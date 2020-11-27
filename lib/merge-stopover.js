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
		stop: mergeStop(stA.stop, stB.stop),
		...mergeDep(stA, stB),
		...mergeArr(stA, stB)
	}
}

module.exports = createMergeStopover
