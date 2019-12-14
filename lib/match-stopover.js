'use strict'

const createMatcher = (matchStopOrStation, scheduledWhen) => {
	const createMatch = (stopoverA) => {
		const matchStopA = matchStopOrStation(stopoverA.stop)
		const whenA = scheduledWhen(stopoverA)

		const matchStopover = (stopoverB) => {
			if (!matchStopA(stopoverB.stop)) return false
			const whenB = scheduledWhen(stopoverB)
			return whenB !== null && whenB === whenA
		}
		return matchStopover
	}
	return createMatch
}

module.exports = createMatcher
