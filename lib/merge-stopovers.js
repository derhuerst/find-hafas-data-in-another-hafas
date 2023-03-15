'use strict'

const findIndex = require('lodash/findIndex')
// const {plannedDepartureOf, plannedArrivalOf} = require('./helpers')

// const sortChronologically = (stA, stB) => {
// 	debugger
// 	const depA = plannedDepartureOf(stA)
// 	const depB = plannedDepartureOf(stB)
// 	if (depA !== null && depB !== null) return depA - depB
// 	const arrA = plannedArrivalOf(stA)
// 	const arrB = plannedArrivalOf(stB)
// 	if (arrA !== null && arrB !== null) return arrA - arrB
// 	if (depA !== null && arrB !== null && depA < arrB) return -1
// 	if (depB !== null && arrA !== null && depB < arrA) return 1
// 	return 0
// }

const createMergeStopovers = (matchStopover, mergeStopover, A, B) => (stopoversA, stopoversB) => {
	if (stopoversB.length === 0) return stopoversA
	if (stopoversA.length === 0) return stopoversB

	// todo: what about stopovers in B that are not in A?
	let prevMatchIdx = -1
	return stopoversA.map((stA) => {
		// start searching after/behind the previous match
		const stBIdx = findIndex(stopoversB, matchStopover(stA), prevMatchIdx + 1)
		if (stBIdx === -1) return stA
		prevMatchIdx = stBIdx

		const stB = stopoversB[stBIdx]
		return mergeStopover(stA, stB)
	})
}

module.exports = createMergeStopovers
