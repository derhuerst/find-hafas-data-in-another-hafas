'use strict'

const omit = require('lodash/omit')
const legFromTrip = require('./leg-from-trip')

const legFromDep = (dep, fromI, toI) => {
	return legFromTrip({
		...omit(dep, [
			'tripId', 'direction',
			'cancelled',
			'when', 'plannedWhen', 'prognosedWhen', 'delay',
			'platform', 'plannedPlatform', 'prognosedPlatform',
			'nextStopovers',

			// 'origin',
			// 'departure', 'plannedDeparture', 'prognosedDeparture', 'departureDelay',

			// 'destination',
			// 'arrival', 'plannedArrival', 'prognosedArrival', 'arrivalDelay',
		]),

		id: dep.tripId,

		origin: null,
		destination: null,

		stopovers: dep.nextStopovers
	}, fromI, toI)
}

module.exports = legFromDep
