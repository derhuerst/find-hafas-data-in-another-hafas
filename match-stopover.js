'use strict'

const createMatchStopover = (matchStopOrStation, plannedWhen) => {
	const matchStopover = (stopoverA) => {
		const matchStopA = matchStopOrStation(stopoverA.stop)
		const whenA = plannedWhen(stopoverA)

		const matchStopover = (stopoverB) => {
			if (!matchStopA(stopoverB.stop)) return false
			const whenB = plannedWhen(stopoverB)
			return whenB !== null && whenB === whenA
		}
		return matchStopover
	}
	return matchStopover
}

module.exports = createMatchStopover
