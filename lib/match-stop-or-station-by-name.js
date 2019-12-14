'use strict'

const createMatch = (normalizeNameA, normalizeNameB) => {
	const matchStopOrStationByName = (stopA) => {
		const stopAName = normalizeNameA(stopA.name)
		const stationAName = stopA.station ? normalizeNameA(stopA.station.name) : NaN
		return (stopB) => {
			const stopBName = normalizeNameB(stopB.name)
			if (stopBName === stopAName) return true
			const stationBName = stopB.station ? normalizeNameB(stopB.station.name) : NaN
			return (
				stopBName === stationAName ||
				stationBName === stopAName ||
				stationBName === stationAName
			)
		}
	}
	return matchStopOrStationByName
}

module.exports = createMatch
