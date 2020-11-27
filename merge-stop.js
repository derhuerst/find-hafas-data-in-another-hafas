'use strict'

const omit = require('lodash/omit')
const mergeIds = require('./lib/merge-ids')

const createMergeStop = (A, B) => (stopA, stopB) => {
	const {
		endpointName: endpNameA,
	} = A
	const {
		endpointName: endpNameB,
	} = B

	const mergeStop = createMergeStop(A, B)

	const ids = mergeIds('id', endpNameA, stopA, endpNameB, stopB)
	if (!stopB) return {...stopA, ids}
	if (!stopA) return {...stopB, id: null, ids}
	return {
		// todo: additional stopB props?
		...omit(stopA, ['station']),
		ids,
		station: stopA.station ? mergeStop(stopA.station, stopB.station) : null
	}
}

module.exports = createMergeStop
