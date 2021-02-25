'use strict'

const createMatchStop = require('./match-stop-or-station')
const createMatchStopover = require('./match-stopover')
const mergeObjects = require('./lib/merge-objects')
const createMergeStopovers = require('./lib/merge-stopovers')
const {
	createMergeArrival,
	createMergeDeparture,
} = require('./lib/merge-when')
const createMergeStopover = require('./lib/merge-stopover')
const createMergeStop = require('./merge-stop')
const createMergeId = require('./lib/merge-id')
const mergeIds = require('./lib/merge-ids')

const createMergeLeg = (A, B, opt = {}) => (legA, legB) => {
	const {
		endpointName: endpNameA,
		normalizeStopName: normalizeStopNameA,
	} = A
	const {
		endpointName: endpNameB,
		normalizeStopName: normalizeStopNameB,
	} = B

	const {
		preferB,
	} = {
		preferB: {},
		...opt,
	}
	const {
		when: mergeWhenPreferB,
		id: mergeIdPreferB,
	} = {
		when: true,
		id: false,
		...preferB,
	}

	const mergeId = createMergeId(mergeIdPreferB)
	const matchStop = createMatchStop(A, B)
	const mergeStop = createMergeStop(A, B, opt)
	const mergeArr = createMergeArrival(mergeWhenPreferB)
	const mergeDep = createMergeDeparture(mergeWhenPreferB)
	const matchStopover = createMatchStopover(matchStop)
	const mergeStopover = createMergeStopover(mergeStop, mergeArr, mergeDep, A, B)
	const mergeStopovers = createMergeStopovers(matchStopover, mergeStopover, A, B)

	return {
		...mergeObjects(legA, legB),

		tripId: mergeId(legA.tripId, legB.tripId),
		tripIds: mergeIds('tripId', endpNameA, legA, endpNameB, legB),
		line: {
			...legA.line,
			fahrtNrs: mergeIds('fahrtNr', endpNameA, legA.line, endpNameB, legB.line)
		},

		origin: mergeStop(legA.origin, legB.origin),
		...mergeDep(legA, legB),

		destination: mergeStop(legA.destination, legB.destination),
		...mergeArr(legA, legB),

		stopovers: mergeStopovers(legA.stopovers, legB.stopovers),

		remarks: [
			...legA.remarks || [],
			...legB.remarks || []
		],

		polyline: legB.polyline || legA.polyline || null,

		// todo: merge alternatives[]
	}
}

module.exports = createMergeLeg
