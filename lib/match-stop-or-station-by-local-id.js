'use strict'

const debug = require('debug')('find-hafas-leg-in-another-hafas:match-stop-or-station-by-local-id')

const createMatchStopOrStationByLocalId = (srcNameA, srcNameB) => {
	const matchStopOrStationByLocalId = (stopA) => {
		const bIdOfA = stopA.ids && (
			stopA.ids[srcNameB.toLowerCase()] ||
			stopA.ids[srcNameB.toUpperCase()]
		) || NaN
		return (stopB) => {
			const aIdOfB = stopB.ids && (
				stopB.ids[srcNameA.toLowerCase()] ||
				stopB.ids[srcNameA.toUpperCase()]
			) || NaN
			return (
				stopA.id === aIdOfB ||
				stopB.id === bIdOfA ||
				aIdOfB === bIdOfA
			)
		}
	}
	return matchStopOrStationByLocalId
}

module.exports = createMatchStopOrStationByLocalId
