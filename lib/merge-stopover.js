'use strict'

const mergeObjects = require('./merge-objects')

const createMergeStopover = (mergeStop, mergeArr, mergeDep, A, B) => (stA, stB) => {
	const {
		endpointName: endpNameA,
	} = A
	const {
		endpointName: endpNameB,
	} = B

	return {
		...mergeObjects(stA, stB),

		stop: mergeStop(stA.stop, stB.stop),
		...mergeDep(stA, stB),
		...mergeArr(stA, stB)
	}
}

module.exports = createMergeStopover
