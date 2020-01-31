'use strict'

const pick = require('lodash/pick')
const omit = require('lodash/omit')

const depFields = [
	'departure',
	'plannedDeparture',
	'prognosedDeparture',
	'departureDelay',

	'departurePlatform',
	'plannedDeparturePlatform'
]
const arrFields = [
	'arrival',
	'plannedArrival',
	'prognosedArrival',
	'arrivalDelay',

	'arrivalPlatform',
	'plannedArrivalPlatform'
]

const legFromTrip = (trip, fromI, toI) => {
	const dep = trip.stopovers[fromI]
	const arr = trip.stopovers[toI]

	return {
		tripId: trip.id,

		origin: dep.stop,
		...pick(dep, depFields),

		destination: arr.stop,
		...pick(arr, arrFields),

		stopovers: trip.stopovers.slice(fromI, toI + 1),

		// todo: filter remarks?
		// todo: .cancelled
		// todo: remove .reachable?
		...omit(trip, [
			'id',
			'origin',
			...depFields,
			'destination',
			...arrFields,
			'alternatives' // todo: handle them
		])
	}
}

module.exports = legFromTrip
