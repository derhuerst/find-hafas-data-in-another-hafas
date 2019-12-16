'use strict'

const pick = require('lodash/pick')
const omit = require('lodash/omit')

const legFromTrip = (trip, fromI, toI) => {
	const dep = trip.stopovers[fromI]
	const arr = trip.stopovers[toI]

	return {
		tripId: trip.id,

		origin: dep.stop,
		...pick(dep, [
			'departure', 'scheduledDeparture', 'departureDelay',
			'departurePlatform', 'scheduledDeparturePlatform'
		]),

		destination: arr.stop,
		...pick(arr, [
			'arrival', 'scheduledArrival', 'arrivalDelay',
			'arrivalPlatform', 'scheduledArrivalPlatform'
		]),

		stopovers: trip.stopovers.slice(fromI, toI + 1),

		// todo: filter remarks?
		// todo: .cancelled
		...omit(trip, [
			'id',
			'origin', 'departure', 'scheduledDeparture', 'departureDelay',
			'destination', 'arrival', 'scheduledarrival', 'arrivalDelay',
			'alternatives' // todo: handle them
		])
	}
}

module.exports = legFromTrip
