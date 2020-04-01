'use strict'

const createMatchByLocalId = require('./lib/match-stop-or-station-by-local-id')
const createMatchByStableId = require('./lib/match-stop-or-station-by-stable-id')
const createMatchByName = require('./lib/match-stop-or-station-by-name')

const createMatchByStopOrStation = (A, B) => {
	const {
		endpointName: endpNameA,
		normalizeStopName: normalizeNameA,
	} = A
	const {
		endpointName: endpNameB,
		normalizeStopName: normalizeNameB,
	} = B

	const matchByLocalId = createMatchByLocalId(endpNameA, endpNameB)
	const matchByStableId = createMatchByStableId(endpNameA, normalizeNameA, endpNameB, normalizeNameB)
	const matchByName = createMatchByName(endpNameA, normalizeNameA, endpNameB, normalizeNameB)

	const matchByStopOrStation = (stopA) => {
		const byLocalId = matchByLocalId(stopA)
		const byStableId = matchByStableId(stopA)
		const byName = matchByName(stopA)

		const matchStopOrStation = stopB => byLocalId(stopB) || byStableId(stopB) || byName(stopB)
		return matchStopOrStation
	}
	return matchByStopOrStation
}

module.exports = createMatchByStopOrStation
