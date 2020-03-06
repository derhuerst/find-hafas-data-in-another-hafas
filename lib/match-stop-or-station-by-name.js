'use strict'

const debug = require('debug')('find-hafas-leg-in-another-hafas:match-stop-or-station-by-name')

const createMatchStopOrStationByName = (srcNameA, normalizeNameA, srcNameB, normalizeNameB) => {
	const matchStopOrStationByName = (stopA) => {
		const stopAName = normalizeNameA(stopA.name, stopA)
		const stationAName = stopA.station
			? normalizeNameA(stopA.station.name, stopA)
			: NaN
		return (stopB) => {
			const stopBName = normalizeNameB(stopB.name, stopB)
			debug('stopAName', stopAName, 'stopBName', stopBName)
			if (stopBName === stopAName) return true
			const stationBName = stopB.station
				? normalizeNameB(stopB.station.name, stopB)
				: NaN
			return (
				stopBName === stationAName ||
				stationBName === stopAName ||
				stationBName === stationAName
			)
		}
	}
	return matchStopOrStationByName
}

module.exports = createMatchStopOrStationByName
