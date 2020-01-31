'use strict'

const plannedDepartureOf = (stopover) => {
	const dep = +new Date(stopover.plannedDeparture)
	return Number.isNaN(dep) ? null : dep
}

const plannedArrivalOf = (stopover) => {
	const arr = +new Date(stopover.plannedArrival)
	return Number.isNaN(arr) ? null : arr
}

module.exports = {
	plannedDepartureOf,
	plannedArrivalOf
}
