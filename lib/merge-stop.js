'use strict'

const omit = require('lodash/omit')
const mergeIds = require('./merge-ids')

const mergeStop = (endpNameA, stopA, endpNameB, stopB) => {
	const ids = mergeIds('id', endpNameA, stopA, endpNameB, stopB)
	if (!stopB) return {...stopA, ids}
	if (!stopA) return {...stopB, id: null, ids}
	return {
		// todo: additional stopB props?
		...omit(stopA, ['station']),
		ids,
		station: stopA.station ? mergeStop(endpNameA, stopA.station, endpNameB, stopB.station) : null
	}
}

module.exports = mergeStop
