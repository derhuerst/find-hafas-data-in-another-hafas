'use strict'

const omit = require('lodash/omit')
const createMatchStop = require('./match-stop-or-station')
const mergeObjects = require('./lib/merge-objects')
const createMergeId = require('./lib/merge-id')
const mergeIds = require('./lib/merge-ids')

const createMergeStop = (A, B, opt = {}) => {
	const matchStop = createMatchStop(A, B)

	const mergeSubStops = (stopsA, stopsB) => {
		if (stopsB.length === 0) return stopsA
		if (stopsA.length === 0) return stopsB

		// todo: what about stops in B that are not in A?
		return stopsA.map((stA) => {
			const stB = stopsB.find(matchStop(stA))
			return stB ? mergeStop(stA, stB) : stA
		})
	}

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
		...mergeObjects(stopA, stopB),

		id: mergeId(stopA.id, stopB.id),
		ids,
	}

	if (stopA.station) {
		res.station = mergeStop(stopA.station, stopB.station)
	}

	const subStops = mergeSubStops(stopA.stops || [], stopB.stops || [])
	if (subStops.length > 0) res.stops = subStops

	return res
	}
	return mergeStop
}

module.exports = createMergeStop
