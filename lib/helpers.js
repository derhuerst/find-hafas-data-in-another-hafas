'use strict'

const plannedDepartureOf = (stopover) => {
	if (!stopover.plannedDeparture) return null
	const dep = +new Date(stopover.plannedDeparture)
	return Number.isNaN(dep) ? null : dep
}

const plannedArrivalOf = (stopover) => {
	if (!stopover.plannedArrival) return null
	const arr = +new Date(stopover.plannedArrival)
	return Number.isNaN(arr) ? null : arr
}

module.exports = {
	plannedDepartureOf,
	plannedArrivalOf
}
