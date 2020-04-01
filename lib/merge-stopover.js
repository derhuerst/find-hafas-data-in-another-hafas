'use strict'

const createMergeStopover = (mergeStop, mergeArr, mergeDep, A, B) => (stA, stB) => {
	const {
		endpointName: endpNameA,
	} = A
	const {
		endpointName: endpNameB,
	} = B

	return {
		...stA,
		stop: mergeStop(endpNameA, stA.stop, endpNameB, stB.stop),
		...mergeDep(stA, stB),
		...mergeArr(stA, stB)
	}
}

module.exports = createMergeStopover
