'use strict'

const pick = require('lodash/pick')
const mergeObjects = require('./merge-objects')

const createMergeStopover = (mergeStop, mergeArr, mergeDep, A, B) => (stA, stB) => {
	const {
		endpointName: endpNameA,
		mergeStopoverAdditionalFields: additionalFieldsA = null,
	} = A
	const {
		endpointName: endpNameB,
		mergeStopoverAdditionalFields: additionalFieldsB = null,
	} = B

	return {
		...mergeObjects(stA, stB),

		// pick also accepts `null` as the 2nd argument
		...pick(stA, additionalFieldsA),
		...pick(stB, additionalFieldsB),

		stop: mergeStop(stA.stop, stB.stop),
		...mergeDep(stA, stB),
		...mergeArr(stA, stB)
	}
}

module.exports = createMergeStopover
