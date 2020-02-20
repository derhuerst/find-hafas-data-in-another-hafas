'use strict'

const createMatchByStableId = require('./match-stop-or-station-by-stable-id')
const createMatchByName = require('./match-stop-or-station-by-name')

const createMatchByStopOrStation = (srcNameA, normalizeNameA, srcNameB, normalizeNameB) => {
	const matchByStableId = createMatchByStableId(srcNameA, normalizeNameA, srcNameB, normalizeNameB)
	const matchByName = createMatchByName(srcNameA, normalizeNameA, srcNameB, normalizeNameB)

	const matchByStopOrStation = (stopA) => {
		const byStableId = matchByStableId(stopA)
		const byName = matchByName(stopA)

		const matchStopOrStation = stopB => byStableId(stopB) || byName(stopB)
		return matchStopOrStation
	}
	return matchByStopOrStation
}

module.exports = createMatchByStopOrStation
