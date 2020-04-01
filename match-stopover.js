'use strict'

const {plannedDepartureOf, plannedArrivalOf} = require('./lib/helpers')

const createMatchStopover = (matchStopOrStation) => {
	const matchStopover = (stopoverA) => {
		const matchStopA = matchStopOrStation(stopoverA.stop)
		const depA = plannedDepartureOf(stopoverA)
		const arrA = plannedArrivalOf(stopoverA)

		const matchStopover = (stopoverB) => {
			if (!matchStopA(stopoverB.stop)) return false
			const depB = plannedDepartureOf(stopoverB)
			const arrB = plannedArrivalOf(stopoverB)
			return (
				(depB !== null && depB === depA) ||
				(arrB !== null && arrB === arrA)
			)
		}
		return matchStopover
	}
	return matchStopover
}

module.exports = createMatchStopover
