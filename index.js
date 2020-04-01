'use strict'

const debug = require('debug')('find-hafas-data-in-another-hafas')
const createCollectDeps = require('hafas-collect-departures-at')
const createMatchStopOrStation = require('./match-stop-or-station')
const createMatchLine = require('./match-line')
const createMatchStopover = require('./match-stopover')
const createFindStop = require('./find-stop')
const legFromTrip = require('./lib/leg-from-trip')
const legFromDep = require('./lib/leg-from-dep')
const {plannedDepartureOf, plannedArrivalOf} = require('./lib/helpers')

const minute = 60 * 1000
const nonEmptyStr = str => 'string' === typeof str && str.length > 0

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
	const matchLine = createMatchLine(clientNameA, normalizeLineNameA, clientNameB, normalizeLineNameB)

	const matchDep = createMatchStopover(matchStopOrStation, plannedDepartureOf)
	const matchArr = createMatchStopover(matchStopOrStation, plannedArrivalOf)

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
		const matchArrA = matchArr(lastStopoverA)

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

		const findStop = createFindStop(A, B)
		const [firstStopB, lastStopB] = await Promise.all([
			findStop(firstStopA),
			findStop(lastStopA)
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
			if (deps.length === 0) debug('0 departures')
			// todo: parallelize this!
			for (const depB of deps) {
				debug('legB candidate', depB.tripId, depB.line.name)

				if (!matchLine(legA.line, depB.line)) {
					debug('matching by line name failed', legA.line, depB.line)
					continue
				}
				const depI = depB.nextStopovers.findIndex(matchDepA)
				if (depI < 0) {
					debug('first stopover not matched', depB.tripId, depB.line.name)
					continue
				}
				let arrI = depB.nextStopovers.slice(depI + 1).findIndex(matchArrA)
				if (arrI < 0) {
					debug('last stopover not matched', depB.tripId, depB.line.name)
					continue
				}
				arrI += depI + 1

				// todo: fahrtNr? intermediate stops?
				debug('matched with', clientNameB, depB.tripId, depB.line.name)
				return legFromDep(depB, depI, arrI)
			}

			if (++iterations >= 3) break;
		}

		debug('no match at all :((')
		return null
	}

	return findLegInAnotherHafas
}

module.exports = createFindLeg
