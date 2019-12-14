'use strict'

const createByStableId = require('./match-stop-or-station-by-stable-id')
const createByName = require('./match-stop-or-station-by-name')

const createMatcher = (normalizeNameA, normalizeNameB) => {
	const matchByStableId = createByStableId(normalizeNameA, normalizeNameB)
	const matchByName = createByName(normalizeNameA, normalizeNameB)

	const createMatch = (stopA) => {
		const byStableId = matchByStableId(stopA)
		const byName = matchByName(stopA)

		const matchStopOrStation = stopB => byStableId(stopB) || byName(stopB)
		return matchStopOrStation
	}
	return createMatch
}

module.exports = createMatcher
