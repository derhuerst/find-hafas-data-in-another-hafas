'use strict'

const {deepStrictEqual} = require('assert')
const omit = require('lodash/omit')
const createMatchStop = require('./match-stop-or-station')
const createMatchStopover = require('./match-stopover')
const {plannedDepartureOf} = require('./lib/helpers')

// todo: this fails with unicode
const upperCase = str => str[0].toUpperCase() + str.slice(1)

const mergeIds = (key, clientNameA, a, clientNameB, b) => {
	const pluralKey = key + 's'
	const ids = {
		...(a && a[pluralKey] || {}),
		...(b && b[pluralKey] || {})
	}
	if (a && a[key]) ids[clientNameA] = a[key]
	if (b && b[key]) ids[clientNameB] = b[key]
	return ids
}

const a = {foo: 1, foos: {c: 3}}
const b = {foo: 2, foos: {a: 5, d: 4}}
deepStrictEqual(mergeIds('foo', 'a', null, 'b', null), {})
deepStrictEqual(mergeIds('foo', 'a', a, 'b', null), {a: 1, c: 3})
deepStrictEqual(mergeIds('foo', 'a', null, 'b', b), {a: 5, b: 2, d: 4})
deepStrictEqual(mergeIds('foo', 'a', a, 'b', b), {a: 1, b: 2, c: 3, d: 4})

const mergeStop = (clientNameA, stopA, clientNameB, stopB) => {
	const ids = mergeIds('id', clientNameA, stopA, clientNameB, stopB)
	if (!stopB) return {...stopA, ids}
	if (!stopA) return {...stopB, id: null, ids}
	return {
		// todo: additional stopB props?
		...omit(stopA, ['station']),
		ids,
		station: stopA.station ? mergeStop(clientNameA, stopA.station, clientNameB, stopB.station) : null
	}
}

const mergeWhen = (key) => (stA, stB) => {
	const _cancelled = 'cancelled'
	const _when = key
	const _plannedWhen = 'planned' + upperCase(key)
	const _prognosedWhen = 'prognosed' + upperCase(key)
	const _delay = key + 'Delay'
	const _platform = key + 'Platform'
	const _plannedPlatform = 'planned' + upperCase(key) + 'Platform'
	const _prognosedPlatform = 'prognosed' + upperCase(key) + 'Platform'
	const _reachable = 'reachable'

	// always prefer `stB` realtime data if both available
	const merged = {
		[_when]: (
			Number.isFinite(stB[_delay])
			? stB[_when]
			: stA[_when]
		),
		[_plannedWhen]: (
			stB[_plannedWhen] ||
			stA[_plannedWhen] ||
			null
		),
		[_delay]: (
			Number.isFinite(stB[_delay])
			? stB[_delay]
			: stA[_delay]
		),
		[_platform]: (
			stB[_platform] !== stB[_plannedPlatform]
			? stB[_platform]
			: stA[_platform]
		),
		[_plannedPlatform]: (
			stB[_plannedPlatform] ||
			stA[_plannedPlatform] ||
			null
		)
	}

	if (_cancelled in stB) {
		merged[_cancelled] = stB[_cancelled]
	} else if (_cancelled in stA) {
		merged[_cancelled] = stA[_cancelled]
	}
	if (_prognosedWhen in stB) {
		merged[_prognosedWhen] = stB[_prognosedWhen]
	} else if (_prognosedWhen in stA) {
		merged[_prognosedWhen] = stA[_prognosedWhen]
	}
	if (_prognosedPlatform in stB) {
		merged[_prognosedPlatform] = stB[_prognosedPlatform]
	} else if (_prognosedPlatform in stA) {
		merged[_prognosedPlatform] = stA[_prognosedPlatform]
	}

	if (typeof stB[_reachable] === 'boolean') {
		merged[_reachable] = stB[_reachable]
	} else if (typeof stA[_reachable] === 'boolean') {
		merged[_reachable] = stA[_reachable]
	}

	return merged
}
const mergeDep = mergeWhen('departure')
const mergeArr = mergeWhen('arrival')

const createMergeLeg = (A, B) => (legA, legB) => {
	const {
		clientName: clientNameA,
		normalizeStopName: normalizeStopNameA,
	} = A
	const {
		clientName: clientNameB,
		normalizeStopName: normalizeStopNameB,
	} = B
	const matchStop = createMatchStop(clientNameA, normalizeStopNameA, clientNameB, normalizeStopNameB)
	const matchStopover = createMatchStopover(matchStop, plannedDepartureOf)

	const stopovers = legA.stopovers.map((stA) => {
		const stB = legB.stopovers.find(matchStopover(stA))
		if (!stB) return stA
		return {
			...stA,
			stop: mergeStop(clientNameA, stA.stop, clientNameB, stB.stop),
			...mergeDep(stA, stB),
			...mergeArr(stA, stB)
		}
	})

	return {
		...legA,

		tripIds: mergeIds('tripId', clientNameA, legA, clientNameB, legB),
		line: {
			...legA.line,
			fahrtNrs: mergeIds('fahrtNr', clientNameA, legA.line, clientNameB, legB.line)
		},

		origin: mergeStop(clientNameA, legA.origin, clientNameB, legB.origin),
		...mergeDep(legA, legB),

		destination: mergeStop(clientNameA, legA.destination, clientNameB, legB.destination),
		...mergeArr(legA, legB),

		stopovers,

		remarks: [
			...legA.remarks || [],
			...legB.remarks || []
		]

		// todo: additional `legB` fields?
	}
}

module.exports = createMergeLeg
