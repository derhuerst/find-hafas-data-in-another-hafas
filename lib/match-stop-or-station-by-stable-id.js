'use strict'

const stopIds = require('@derhuerst/stable-public-transport-ids/stop')

const createMatch = (normalizeNameA, normalizeNameB) => {
	const matchStopOrStationByStableId = (stopA) => {
		const stopAIds = stopIds('db', normalizeNameA)(stopA)
		return (stopB) => {
			const stopBIds = stopIds('vbb', normalizeNameB)(stopB)
			return stopBIds.some(bId => stopAIds.includes(bId))
		}
	}
	return matchStopOrStationByStableId
}

module.exports = createMatch
