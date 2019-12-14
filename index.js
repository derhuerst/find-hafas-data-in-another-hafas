'use strict'

const _distance = require('@turf/distance').default
const {point} = require('@turf/helpers')
const debug = require('debug')('find-db-hafas-trip-in-another-hafas')
const createMatchStopOrStation = require('./lib/match-stop-or-station')
const createMatchLineName = require('./lib/match-line-by-name')
const createMatchStopover = require('./lib/match-stopover')
const legFromTrip = require('./lib/leg-from-trip')
const {scheduledDepartureOf, scheduledArrivalOf} = require('./lib/helpers')

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

const createFindLeg = (A, B) => {
	const {
		hafas: hafasA,
		normalizeStopName: normalizeNameA,
		normalizeLineName: normalizeLineNameA
	} = A
	const {
		hafas: hafasB,
		normalizeStopName: normalizeNameB,
		normalizeLineName: normalizeLineNameB
	} = B

	const matchStopOrStation = createMatchStopOrStation(normalizeNameA, normalizeNameB)
	const matchLineName = createMatchLineName(normalizeLineNameA, normalizeLineNameB)

	const matchDep = createMatchStopover(matchStopOrStation, scheduledDepartureOf)
	const matchArr = createMatchStopover(matchStopOrStation, scheduledArrivalOf)

	const findStopByName = async (hafasB, stopA) => {
		debug('findStopByName', stopA.id, stopA.name)

		const nearby = await hafasB.nearby(stopA.location, {poi: false})
		debug('hafasB.nearby()', stopA.location, nearby.map(loc => [loc.id, loc.name]))

		const matchA = matchStopOrStation(stopA)
		return nearby.find(matchA) || null

		// todo
		// const fuzzy = await hafasB.locations(stopA.name, {
		// 	addresses: false, poi: false
		// })
	}

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

	const findLegInAnotherHafas = async (legA) => {
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

		const matchDepA = matchDep(firstStopoverA)
		const matchArrA = matchDep(lastStopoverA)

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
				const firstI = tripB.stopovers.findIndex(matchDepA)
				if (firstI < 0) throw new Error('first stopover not matched')
				const lastI = tripB.stopovers.slice(firstI + 1).findIndex(matchArrA)
				if (lastI < 0) throw new Error('last stopover not matched')

				// todo: fahrtNr, intermediate stopovers
				debug('trip match!', 'tripA', tripA.id, 'tripB', tripB.id)
				return null
			} catch (err) {
				if (err && err.isHafasError) {
					debug('matching by trip ID failed:', err && err.message || (err + ''))
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

		// todo: parallelize this!
		for (const dep of deps) {
			if (!matchLineName(legA.line, dep.line)) {
				debug('matching by line name failed', legA.line, dep.line)
				continue
			}
			// todo
			// if (dep.line.fahrtNr !== legA.line.fahrtNr) continue

			let trip
			try {
				const trip = await hafasB.trip(dep.tripId, dep.line.name, {stopovers: true})
			} catch (err) {
				debug('matching by trip ID failed:', err)
			}
			if (trip) {
				const depI = trip.stopovers.findIndex(matchDepA)
				const arrI = trip.stopovers.slice(depI + 1).findIndex(matchArrA)
				if (depI >= 0 && arrI >= 0) {
					debug('match by trip ID!', trip.id, trip.line.name)
					return legFromTrip(trip, depI, arrI)
				}
			}

			const {journeys} = await hafasB.journeys(firstStopB, lastStopB, {
				departure: depA, stopovers: true, tickets: false
				// todo: introduce product mapping, limit products
			})
			for (const j of journeys) {
				const transitLegs = j.legs.filter(l => !l.walking)
				// if (transitLegs.length > 1) console.error('multiple transit legs', transitLegs) // todo
				const [legB] = transitLegs
				debug('legB', legB.tripId, legB.line.name)

				const depI = legB.stopovers.findIndex(matchDepA)
				if (depI < 0) {
					debug('first stopover not matched', legB.tripId, legB.line.name)
					continue
				}
				const arrI = legB.stopovers.slice(depI + 1).findIndex(matchArrA)
				if (arrI < 0) {
					debug('last stopover not matched', legB.tripId, legB.line.name)
					continue
				}

				return legB
			}
		}

		debug('no match at all :((')
		return null
	}

	return findLegInAnotherHafas
}

module.exports = createFindLeg
