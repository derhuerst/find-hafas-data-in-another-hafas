'use strict'

const stopIds = require('@derhuerst/stable-public-transport-ids/stop')

const createMatchStopOrStationByStableId = (srcNameA, normalizeNameA, srcNameB, normalizeNameB) => {
	const matchStopOrStationByStableId = (stopA) => {
		const stopAIds = stopIds(srcNameA, normalizeNameA)(stopA)
		return (stopB) => {
			const stopBIds = stopIds(srcNameB, normalizeNameB)(stopB)
			return stopBIds.some(bId => stopAIds.includes(bId))
		}
	}
	return matchStopOrStationByStableId
}

module.exports = createMatchStopOrStationByStableId
