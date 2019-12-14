'use strict'

const pick = require('lodash/pick')
const omit = require('lodash/omit')

const legFromTrip = (trip, fromI, toI) => {
	const depI = trip.stopovers.findIndex(matchDep)
	const dep = trip.stopovers[depI]
	const arrI = trip.stopovers.slice(depI + 1).findIndex(matchArr)
	const arr = trip.stopovers[arrI]

	return {
		tripId: trip.id,

		origin: dep.stop,
		...pick(dep, ['departure', 'scheduledDeparture', 'departureDelay']),

		origin: arr.stop,
		...pick(arr, ['arrival', 'scheduledArrival', 'arrivalDelay']),

		stopovers: trip.stopovers.slice(depI, arrI + 1),

		...omit(trip, [
			'id',
			'origin', 'departure', 'scheduledDeparture', 'departureDelay',
			'destination', 'arrival', 'scheduledarrival', 'arrivalDelay',
			'alternatives' // todo: handle them
		])
	}
}

module.exports = legFromTrip
