'use strict'

const createMatcher = (matchStopOrStation, plannedWhen) => {
	const createMatch = (stopoverA) => {
		const matchStopA = matchStopOrStation(stopoverA.stop)
		const whenA = plannedWhen(stopoverA)

		const matchStopover = (stopoverB) => {
			if (!matchStopA(stopoverB.stop)) return false
			const whenB = plannedWhen(stopoverB)
			return whenB !== null && whenB === whenA
		}
		return matchStopover
	}
	return createMatch
}

module.exports = createMatcher
