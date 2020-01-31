'use strict'

const debug = require('debug')('find-hafas-leg-in-another-hafas:match-stop-or-station-by-name')

const createMatch = (normalizeNameA, normalizeNameB) => {
	const matchStopOrStationByName = (stopA) => {
		const stopAName = normalizeNameA(stopA.name)
		const stationAName = stopA.station ? normalizeNameA(stopA.station.name) : NaN
		return (stopB) => {
			const stopBName = normalizeNameB(stopB.name)
			debug('stopAName', stopAName, 'stopBName', stopBName)
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
