'use strict'

const createMatchStop = require('./match-stop-or-station')
const createMatchStopover = require('./match-stopover')
const createMergeStopovers = require('./lib/merge-stopovers')
const {
	mergeArrival: mergeArr,
	mergeDeparture: mergeDep,
} = require('./lib/merge-when')
const createMergeStopover = require('./lib/merge-stopover')
const mergeStop = require('./lib/merge-stop')
const mergeIds = require('./lib/merge-ids')

const createMergeLeg = (A, B) => (legA, legB) => {
	const {
		endpointName: endpNameA,
		normalizeStopName: normalizeStopNameA,
	} = A
	const {
		endpointName: endpNameB,
		normalizeStopName: normalizeStopNameB,
	} = B
	const matchStop = createMatchStop(A, B)
	const matchStopover = createMatchStopover(matchStop)
	const mergeStopover = createMergeStopover(mergeStop, mergeArr, mergeDep, A, B)
	const mergeStopovers = createMergeStopovers(matchStopover, mergeStopover, A, B)

	return {
		...legA,

		tripIds: mergeIds('tripId', endpNameA, legA, endpNameB, legB),
		line: {
			...legA.line,
			fahrtNrs: mergeIds('fahrtNr', endpNameA, legA.line, endpNameB, legB.line)
		},

		origin: mergeStop(endpNameA, legA.origin, endpNameB, legB.origin),
		...mergeDep(legA, legB),

		destination: mergeStop(endpNameA, legA.destination, endpNameB, legB.destination),
		...mergeArr(legA, legB),

		stopovers: mergeStopovers(legA.stopovers, legB.stopovers),

		remarks: [
			...legA.remarks || [],
			...legB.remarks || []
		]

		// todo: additional `legB` fields?
	}
}

module.exports = createMergeLeg
