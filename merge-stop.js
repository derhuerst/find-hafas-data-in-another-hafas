'use strict'

const omit = require('lodash/omit')
const createMergeId = require('./lib/merge-id')
const mergeIds = require('./lib/merge-ids')

const createMergeStop = (A, B, opt = {}) => (stopA, stopB) => {
	const {
		endpointName: endpNameA,
	} = A
	const {
		endpointName: endpNameB,
	} = B

	const {
		preferB,
	} = {
		preferB: {},
		...opt,
	}
	const {
		id: mergeIdPreferB,
	} = {
		id: false,
		...preferB,
	}

	const mergeStop = createMergeStop(A, B, opt) // this is stupid
	const mergeId = createMergeId(mergeIdPreferB)

	const ids = mergeIds('id', endpNameA, stopA, endpNameB, stopB)
	if (!stopB) return {...stopA, ids}
	if (!stopA) return {...stopB, id: null, ids}
	return {
		// todo: additional stopB props?
		...omit(stopA, ['station']),
		id: mergeId(stopA.id, stopB.id),
		ids,
		station: stopA.station ? mergeStop(stopA.station, stopB.station) : null
	}
}

module.exports = createMergeStop
