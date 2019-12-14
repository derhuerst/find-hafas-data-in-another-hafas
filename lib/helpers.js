'use strict'

const scheduledDepartureOf = (stopover) => {
	let dep = +new Date(stopover.departure)
	if (stopover.cancelled) dep = +new Date(stopover.scheduledDeparture)
	else if (Number.isFinite(stopover.departureDelay)) {
		dep -= stopover.departureDelay * 1000
	}
	return Number.isNaN(dep) ? null : dep
}

const scheduledArrivalOf = (stopover) => {
	let arr = +new Date(stopover.arrival)
	if (stopover.cancelled) arr = +new Date(stopover.scheduledArrival)
	else if (Number.isFinite(stopover.arrivalDelay)) {
		arr -= stopover.arrivalDelay * 1000
	}
	return Number.isNaN(arr) ? null : arr
}

module.exports = {
	scheduledDepartureOf,
	scheduledArrivalOf
}
