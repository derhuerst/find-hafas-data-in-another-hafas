'use strict'

const omit = require('lodash/omit')
const createMergeId = require('./lib/merge-id')
const mergeIds = require('./lib/merge-ids')

const createMergeStop = (A, B, opt = {}) => {
	const mergeStop = (stopA, stopB) => {
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

	const mergeId = createMergeId(mergeIdPreferB)

	const ids = mergeIds('id', endpNameA, stopA, endpNameB, stopB)
	if (!stopB) return {...stopA, ids}
	if (!stopA) return {...stopB, id: null, ids}

	const res = {
		// todo: additional stopB props?
		...omit(stopA, ['station']),
		id: mergeId(stopA.id, stopB.id),
		ids,
	}

	if (stopA.station) {
		res.station = mergeStop(stopA.station, stopB.station)
	}

	// todo: stops[]

	return res
	}
	return mergeStop
}

module.exports = createMergeStop
