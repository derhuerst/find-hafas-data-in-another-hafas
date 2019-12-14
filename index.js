'use strict'

const _distance = require('@turf/distance').default
const {point} = require('@turf/helpers')
const without = require('lodash/without')
const tokenizeDb = require('tokenize-db-station-name')
const tokenizeVbb = require('tokenize-vbb-station-name')
const debug = require('debug')('find-db-hafas-trip-in-another-hafas')

const minute = 60 * 1000
const nonEmptyStr = str => 'string' === typeof str && str.length > 0

const distance = (lA, lB) => {
	return _distance(
		point([lA.longitude, lA.latitude]),
		point([lB.longitude, lB.latitude]),
		{units: 'kilometers'}
	)
}

// todo: use same `language`

// todo: move to tokenize-db-station-name
const dbStopwords = [
	'bahnhof',
	'berlin',
	'sbahn',

	'bayern', 'thueringen', 'sachsen', 'anhalt', 'westfalen', 'wuerttemberg', 'oberpfalz', 'schwaben', 'oberbayern', 'holstein', 'braunschweig', 'saalekreis', 'saalekreis', 'niederbayern', 'schwarzwald', 'oldenburg', 'uckermark', 'rheinland', 'oberfranken', 'rheinhessen', 'hessen', 'altmark', 'limesstadt', 'vogtland', 'mecklenburg', 'mittelfranken', 'dillkreis', 'odenwald', 'erzgebirge', 'prignitz', 'oberhessen', 'ostfriesland', 'schleswig', 'unterfranken', 'westerwald', 'dithmarschen',
	// todo: 'saechsische schweiz', 'thueringer wald', 'schaumburg lippe', 'frankfurt main'
	'bahnhof',
	'fernbahnhof'
]

// todo: move to tokenize-vbb-station-name
const vbbStopwords = [
	'bahnhof',
	'berlin', 'polen',
	'sbahn', 'ubahn'
]

// todo: pass these in
const normalizeNameA = str => without(tokenizeDb(str), ...dbStopwords).join(' ')
const normalizeNameB = str => without(tokenizeVbb(str), ...vbbStopwords).join(' ')

const matchStopOrStationByName = (stopA) => {
	const stopAName = normalizeNameA(stopA.name)
	const stationAName = stopA.station ? normalizeNameA(stopA.station.name) : NaN
	return (stopB) => {
		const stopBName = normalizeNameB(stopB.name)
		if (stopBName === stopAName) return true
		const stationBName = stopB.station ? normalizeNameB(stopB.station.name) : NaN
		return (
			stopBName === stationAName ||
			stationBName === stopAName ||
			stationBName === stationAName
		)
	}
}

const findStopByName = async (hafasB, stopA) => {
	debug('findStopByName', stopA.id, stopA.name)

	const nearby = await hafasB.nearby(stopA.location, {poi: false})
	debug('hafasB.nearby()', stopA.location, nearby.map(loc => [loc.id, loc.name]))

	const matchA = matchStopOrStationByName(stopA)
	return nearby.find(matchA) || null

	// todo
	// const fuzzy = await hafasB.locations(stopA.name, {
	// 	addresses: false, poi: false
	// })
}

// todo: upgrade `hafas-client`
// const leadingZeros = /^0+/
const findStopById = async (hafasB, stopA) => {
	debug('findStopById', stopA.id, stopA.name)
	try {
		const exact = await hafasB.stop(stopA)
		return distance(exact.location, stopA.location) < .2 ? exact : null
	} catch (err) {
		if (err && err.isHafasError) return null
		throw err
	}
}

const findStop = async (hafasB, sA) => {
	debug('findStop', sA.id, sA.name)

	let sB = await findStopById(hafasB, sA)
	if (sB) {
		debug('matched by stop ID with', sB.id, sB.name)
		return sB
	}
	if (sA.station) {
		sB = await findStopById(hafasB, sA.station)
		if (sB) {
			debug('matched by station ID', sA.station.id)
			return sB
		}
	}
	sB = await findStopByName(hafasB, sA)
	if (sB) {
		debug('matched by name with', sB.id, sB.name)
		return sB
	}
	if (sA.station) {
		sB = await findStopByName(hafasB, sA.station)
		if (sB) {
			debug('matched by station name with', sB.id, sB.name)
			return sB
		}
	}

	debug('not matched :(')
	return null
}

module.exports = {findStop}

const scheduledDepartureOf = (stopover) => {
	let dep = +new Date(stopover.departure)
	if (stopover.cancelled) dep = +new Date(stopover.formerScheduledDeparture)
	else if (Number.isFinite(stopover.departureDelay)) {
		dep -= stopover.departureDelay * 1000
	}
	return Number.isNaN(dep) ? null : dep
}
const scheduledArrivalOf = (stopover) => {
	let arr = +new Date(stopover.arrival)
	if (stopover.cancelled) arr = +new Date(stopover.formerScheduledArrival)
	else if (Number.isFinite(stopover.arrivalDelay)) {
		arr -= stopover.arrivalDelay * 1000
	}
	return Number.isNaN(arr) ? null : arr
}

// todo: use stable-public-transport-ids
const createFindLeg = (hafasA, hafasB) => {
	const findTripInAnotherHafas = async (legA) => {
		if (!nonEmptyStr(legA.tripId)) throw new Error('legA.tripId must be a trip ID.')
		if (!legA.line) throw new Error('legA.line must be an object.')
		if (!nonEmptyStr(legA.line.name)) {
			throw new Error('legA.line.name must be a non-empty string.')
		}
		if (legA.walking) throw new Error('legA must not be a walking leg.')
		debug('legA', legA.tripId, legA.line.name)

		if (!Array.isArray(legA.stopovers) || legA.stopovers.length === 0) {
			throw new Error('legA.stopovers must be an array with >0 items.')
		}

		const firstStopoverA = legA.stopovers[0]
		const firstStopA = firstStopoverA.stop
		debug('firstStopA', firstStopA.id, firstStopA.name)
		const depA = scheduledDepartureOf(firstStopoverA)
		if (depA === null) throw new Error('invalid leg.stopovers[0]')

		const lastStopoverA = legA.stopovers[legA.stopovers.length - 1]
		const lastStopA = lastStopoverA.stop
		debug('lastStopA', lastStopA.id, lastStopA.name)
		const arrA = scheduledArrivalOf(lastStopoverA)
		if (arrA === null) throw new Error('invalid last(leg.stopovers)')

		// try to pass the trip ID from HAFAS A into HAFAS B
		if (hafasB.trip) {
			const pTrip = hafasB.trip(legA.tripId, legA.line.name, {
				stopovers: true, remarks: false
				// todo: `language`?
			})
			try {
				const tripB = await pTrip

				if (!Array.isArray(tripB.stopovers)) {
					throw new Error(`HAFAS B didn't return stopovers`)
				}
				const firstI = tripB.stopovers.findIndex((stB) => {
					if (!matchStopOrStationByName(firstStopA)(stB)) return false
					const depB = scheduledDepartureOf(stB)
					return depB !== null && depB === depA
				})
				if (firstI < 0) throw new Error('first stopover not matched')
				const lastI = tripB.stopovers.slice(firstI + 1).findIndex((stB) => {
					if (!matchStopOrStationByName(lastStopA)(stB)) return false
					const arrB = scheduledArrivalOf(stB)
					return arrB !== null && arrB === arrA
				})
				if (lastI < 0) throw new Error('last stopover not matched')

				// todo: fahrtNr, intermediate stopovers
				debug('trip match!', 'tripA', tripA.id, 'tripB', tripB.id)
				return null
			} catch (err) {
				if (err && err.isHafasError) {
					debug('trip matching failed:', err && err.message || (err + ''))
				} else throw err
			}
		}

		const [firstStopB, lastStopB] = await Promise.all([
			findStop(hafasB, firstStopA),
			findStop(hafasB, lastStopA)
		])
		if (!firstStopB) {
			debug('firstStopA matching failed')
			return null
		}
		debug('firstStopB', firstStopB.id, firstStopB.name)
		if (!lastStopB) {
			debug('lastStopA matching failed')
			return null
		}
		debug('lastStopB', lastStopB.id, lastStopB.name)

		// Query departures at firstStopB in direction of lastStopB.
		const deps = await hafasB.departures(firstStopB.id, {
			when: depA - minute, duration: 2 * minute,
			direction: lastStopB.id,
			remarks: false
		})

		for (const dep of deps) {
			if (dep.line.fahrtNr !== legA.line.fahrtNr) continue

			try {
				const trip = await hafasB.trip(dep.tripId, {stopovers: true})
				return trip
			} catch (err) {
				const journeys = await hafas.journeys(firstStopB, lastStopB, {
					when: depA, stopovers: true, tickets: false
				})
				// todo: find a matching journey
			}
		}

		// todo
		// debug('fahrtNr', legA.line.fahrtNr)
		return null
	}
	return findTripInAnotherHafas
}

module.exports = createFindLeg
