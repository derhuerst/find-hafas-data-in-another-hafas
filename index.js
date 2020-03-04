'use strict'

const _distance = require('@turf/distance').default
const {point} = require('@turf/helpers')
const debug = require('debug')('find-hafas-leg-in-another-hafas')
const createCollectDeps = require('hafas-collect-departures-at')
const createMatchStopOrStation = require('./lib/match-stop-or-station')
const createMatchLineName = require('./lib/match-line-by-name')
const createMatchStopover = require('./lib/match-stopover')
const legFromTrip = require('./lib/leg-from-trip')
const legFromDep = require('./lib/leg-from-dep')
const {plannedDepartureOf, plannedArrivalOf} = require('./lib/helpers')

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
		clientName: clientNameA,
		hafas: hafasA,
		normalizeStopName: normalizeNameA,
		normalizeLineName: normalizeLineNameA
	} = A
	const {
		clientName: clientNameB,
		hafas: hafasB,
		normalizeStopName: normalizeNameB,
		normalizeLineName: normalizeLineNameB
	} = B

	const matchStopOrStation = createMatchStopOrStation(clientNameA, normalizeNameA, clientNameB, normalizeNameB)
	const matchLineName = createMatchLineName(clientNameA, normalizeLineNameA, clientNameB, normalizeLineNameB)

	const matchDep = createMatchStopover(matchStopOrStation, plannedDepartureOf)

	const findStopByName = async (hafasB, stopA) => {
		debug('findStopByName', stopA.id, stopA.name)

		const nearby = await hafasB.nearby(stopA.location, {
			poi: false,
			results: 10
		})
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
			debug('matched by stop ID with', clientNameB, sB.id, sB.name)
			return sB
		}
		if (sA.station) {
			sB = await findStopById(hafasB, sA.station)
			if (sB) {
				debug('matched by station ID with', clientNameB, sB.id, sB.name)
				return sB
			}
		}
		sB = await findStopByName(hafasB, sA)
		if (sB) {
			debug('matched by name with', clientNameB, sB.id, sB.name)
			return sB
		}
		if (sA.station) {
			sB = await findStopByName(hafasB, sA.station)
			if (sB) {
				debug('matched by station name with', clientNameB, sB.id, sB.name)
				return sB
			}
		}

		debug('not matched :(', sA.id, sA.name)
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
		const depA = plannedDepartureOf(firstStopoverA)
		if (depA === null) throw new Error('invalid leg.stopovers[0]')

		const lastStopoverA = legA.stopovers[legA.stopovers.length - 1]
		const lastStopA = lastStopoverA.stop
		debug('lastStopA', lastStopA.id, lastStopA.name)
		const arrA = plannedArrivalOf(lastStopoverA)
		if (arrA === null) throw new Error('invalid last(leg.stopovers)')

		const matchDepA = matchDep(firstStopoverA)
		const matchArrA = matchDep(lastStopoverA)

		// try to pass the trip ID from HAFAS A into HAFAS B
		if (hafasB.trip) {
			try {
				const tripB = await hafasB.trip(legA.tripId, legA.line.name, {
					stopovers: true, remarks: false
					// todo: `language`?
				})

				if (!Array.isArray(tripB.stopovers)) {
					throw new Error(`${clientNameB} HAFAS didn't return stopovers`)
				}
				const depI = tripB.stopovers.findIndex(matchDepA)
				if (depI < 0) throw new Error('first stopover of tripB not matched')
				const arrI = tripB.stopovers.slice(depI + 1).findIndex(matchArrA)
				if (depI >= 0 && arrI >= 0) {
					debug('match by trip ID with', clientNameB, tripB.id, tripB.line.name)
					return legFromTrip(tripB, depI, arrI)
				}
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
		const collectDepsB = createCollectDeps(hafasB.departures, {
			direction: lastStopB.id,
			remarks: false,
			stopovers: true // todo: fall back to `hafasB.trip(dep.tripId)`?
		})
		let iterations = 0
		for await (const deps of collectDepsB(firstStopB.id, depA - minute)) {
			if (++iterations >= 3) break;

			// todo: parallelize this!
			for (const depB of deps) {
				debug('legB candidate', depB.tripId, depB.line.name)

				if (!matchLineName(legA.line, depB.line)) {
					debug('matching by line name failed', legA.line, depB.line)
					continue
				}
				const depI = depB.nextStopovers.findIndex(matchDepA)
				if (depI < 0) {
					debug('first stopover not matched', depB.tripId, depB.line.name)
					continue
				}
				const arrI = depB.nextStopovers.slice(depI + 1).findIndex(matchArrA)
				if (arrI < 0) {
					debug('last stopover not matched', depB.tripId, depB.line.name)
					continue
				}

				// todo: fahrtNr? intermediate stops?
				debug('matched with', clientNameB, depB.tripId, depB.line.name)
				return legFromDep(depB, depI, arrI)
			}
		}

		debug('no match at all :((')
		return null
	}

	return findLegInAnotherHafas
}

module.exports = createFindLeg
