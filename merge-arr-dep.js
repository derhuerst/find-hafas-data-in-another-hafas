'use strict'

const {
	createMergeWhen,
	mergeArrival: mergeArr,
	mergeDeparture: mergeDep,
} = require('./lib/merge-when')
const createMatchStop = require('./match-stop-or-station')
const createMatchStopover = require('./match-stopover')
const createMergeStopover = require('./lib/merge-stopover')
const createMergeStopovers = require('./lib/merge-stopovers')
const mergeIds = require('./lib/merge-ids')
const createMergeStop = require('./merge-stop')

const mergeWhen = createMergeWhen({
	cancelled: 'cancelled',
	when: 'when',
	plannedWhen: 'plannedWhen',
	prognosedWhen: 'prognosedWhen',
	delay: 'delay',
	platform: 'platform',
	plannedPlatform: 'plannedPlatform',
	prognosedPlatform: 'prognosedPlatform',
	reachable: 'reachable',
})

const createMergeArrDep = (stopoversKey, A, B) => (arrDepA, arrDepB) => {
	const {
		endpointName: endpNameA,
		normalizeStopName: normalizeStopNameA,
	} = A
	const {
		endpointName: endpNameB,
		normalizeStopName: normalizeStopNameB,
	} = B

	const mergeStop = createMergeStop(A, B)

	const res = {
		...arrDepA,

		tripIds: mergeIds('tripId', endpNameA, arrDepA, endpNameB, arrDepB),
		line: {
			...arrDepA.line,
			fahrtNrs: mergeIds('fahrtNr', endpNameA, arrDepA.line, endpNameB, arrDepB.line)
		},

		stop: mergeStop(arrDepA.stop, arrDepB.stop),

		...mergeWhen(arrDepA, arrDepB),

		remarks: [
			...arrDepA.remarks || [],
			...arrDepB.remarks || []
		]

		// todo: additional `arrDepB` fields?
	}

	const matchStop = createMatchStop(A, B)
	const matchStopover = createMatchStopover(matchStop)
	const mergeStopover = createMergeStopover(mergeStop, mergeArr, mergeDep, A, B)
	const mergeStopovers = createMergeStopovers(matchStopover, mergeStopover, A, B)

	const stopoversA = arrDepA[stopoversKey] || []
	const stopoversB = arrDepB[stopoversKey] || []
	const stopovers = mergeStopovers(stopoversA, stopoversB)
	if (stopovers.length > 0) res[stopoversKey] = stopovers

	return res
}

// https://github.com/public-transport/hafas-client/blob/33d77868a441ae0391ce8cfcf2ef0c855ceffd91/parse/arrival-or-departure.js#L53-L54
const createMergeArrival = createMergeArrDep.bind(null, 'previousStopovers')
const createMergeDeparture = createMergeArrDep.bind(null, 'nextStopovers')

module.exports = {
	createMergeArrival,
	createMergeDeparture,
}
