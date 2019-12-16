'use strict'

const omit = require('lodash/omit')
const legFromTrip = require('./leg-from-trip')

const legFromDep = (dep, fromI, toI) => {
	return legFromTrip({
		...omit(dep, [
			'tripId', 'direction',
			'cancelled', 'when', 'delay', 'platform', 'scheduledPlatform', 'scheduledWhen',
			'nextStopovers',
			// 'origin', 'departure', 'scheduledDeparture', 'departureDelay',
			// 'destination', 'arrival', 'scheduledarrival', 'arrivalDelay',
		]),

		id: dep.tripId,

		origin: null,
		destination: null,

		stopovers: dep.nextStopovers
	}, fromI, toI)
}

module.exports = legFromDep
