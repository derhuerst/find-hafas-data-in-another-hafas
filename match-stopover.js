'use strict'

const debug = require('debug')('find-hafas-data-in-another-hafas:match-stopover')
const {plannedDepartureOf, plannedArrivalOf} = require('./lib/helpers')

const createMatchStopover = (matchStopOrStation) => {
	const matchStopover = (stopoverA) => {
		const matchStopA = matchStopOrStation(stopoverA.stop)
		const depA = plannedDepartureOf(stopoverA)
		const arrA = plannedArrivalOf(stopoverA)

		const matchStopover = (stopoverB) => {
			if (!matchStopA(stopoverB.stop)) {
				debug('matching stops failed', stopoverA.stop, stopoverB.stop)
				return false
			}
			const depB = plannedDepartureOf(stopoverB)
			const arrB = plannedArrivalOf(stopoverB)
			if (
				(depB !== null && depB === depA) ||
				(arrB !== null && arrB === arrA)
			) return true
			debug('matching date/time failed', arrA, depA, arrB, depB)
			return false
		}
		return matchStopover
	}
	return matchStopover
}

module.exports = createMatchStopover
