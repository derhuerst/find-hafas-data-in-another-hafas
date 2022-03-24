'use strict'

const STABLE_IDS = require('@derhuerst/stable-public-transport-ids/symbol')
const stopIds = require('@derhuerst/stable-public-transport-ids/stop')

const createMatchStopOrStationByStableId = (srcNameA, normalizeNameA, srcNameB, normalizeNameB) => {
	const matchStopOrStationByStableId = (stopA) => {
		const stopAIds = Array.isArray(stopA[STABLE_IDS])
			? stopA[STABLE_IDS]
			: stopIds(srcNameA, normalizeNameA)(stopA).map(([id]) => id)
		return (stopB) => {
			const stopBIds = Array.isArray(stopB[STABLE_IDS])
				? stopB[STABLE_IDS]
				: stopIds(srcNameB, normalizeNameB)(stopB).map(([id]) => id)
			return stopBIds.some(bId => stopAIds.includes(bId))
		}
	}
	return matchStopOrStationByStableId
}

module.exports = createMatchStopOrStationByStableId
