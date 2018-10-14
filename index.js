'use strict'

const slug = require('slug')
const debug = require('debug')('find-db-hafas-trip-in-another-hafas')

const minute = 60 * 1000
const nonEmptyStr = str => 'string' === typeof str && str.length > 0

const matchStopOrStationByName = (stopA) => {
	const stopAName = slug(stopA.name)
	const stationAName = stopA.station ? slug(stopA.station.name) : NaN
	return (stopB) => {
		const stopBName = slug(stopB.name)
		if (stopBName === stopAName) return true
		const stationBName = stopB.station ? slug(stopB.station.name) : NaN
		return (
			stopBName === stationAName ||
			stationBName === stopAName ||
			stationBName === stationAName
		)
	}
}

const findStopByName = async (hafasB, stopA) => {
	const stopAName = slug(stopA.name)
	const match = stopB => slug(stopB.name) === stopAName

	const fuzzy = await hafasB.locations(stopA.name, {
		addresses: false, poi: false
	})
	return fuzzy.find(match) || fuzzy.find(matchStopOrStationByName(stopA)) || null
}

// todo: upgrade `hafas-client`
const leadingZeros = /^0+/
const findStopById = async (hafasB, idA) => {
	try {
		const exact = await hafasB.station(idA)
		return exact
	} catch (err) {
		if (err && err.isHafasError) return null
		throw err
	}
}

const findStop = async (hafasB, sA) => {
	let sB = await findStopById(hafasB, sA.id)
	if (sB) {
		debug(sA.id, sA.name, 'matched by stop ID with', sB.id, sB.name)
		return sB
	}
	if (sA.station) {
		sB = await findStopById(hafasB, sA.station.id)
		if (sB) {
			debug(sA.id, sA.name, 'matched by station ID', sA.station.id)
			return sB
		}
	}
	sB = await findStopByName(hafasB, sA)
	if (sB) {
		debug(sA.id, sA.name, 'matched by name with', sB.id, sB.name)
		return sB
	}
	return null
}

const scheduledDepartureOf = (stopover) => {
	let dep = +new Date(stopover.departure)
	if (stopover.cancelled) dep = +new Date(stopover.formerScheduledDeparture)
	else if (stopover.departureDelay) dep -= stopover.departureDelay * 1000
	return Number.isNaN(dep) ? null : dep
}
const scheduledArrivalOf = (stopover) => {
	let arr = +new Date(stopover.arrival)
	if (stopover.cancelled) arr = +new Date(stopover.formerScheduledArrival)
	else if (stopover.arrivalDelay) arr -= stopover.arrivalDelay * 1000
	return Number.isNaN(arr) ? null : arr
}


const createFindLeg = (hafasA, hafasB) => {
	const findTripInAnotherHafas = async (legA) => {
		if (!nonEmptyStr(legA.id)) throw new Error('legA.id must be a trip ID.')
		if (!legA.line) throw new Error('legA.line must be an object.')
		if (!nonEmptyStr(legA.line.name)) {
			throw new Error('legA.line.name must be a non-empty string.')
		}
		debug('legA', legA.id, legA.line.name)

		if (!Array.isArray(legA.stopovers) || legA.stopovers.length === 0) {
			throw new Error('legA.stopovers must be an array with >0 items.')
		}

		const firstStopoverA = legA.stopovers[0]
		const firstStopA = firstStopoverA.stop
		debug('firstStopA', firstStopA.id, firstStopA.name)
		const depA = scheduledDepartureOf(firstStopoverA)
		if (depA === null) throw new Error('invalid leg.stopovers[0]')

		const lastStopoverA = legA.stopovers[legA.stopovers.length - 1]
		const lastStopA = lastStopoverA.stop
		debug('lastStopA', lastStopA.id, lastStopA.name)
		const arrA = scheduledArrivalOf(lastStopoverA)
		if (arrA === null) throw new Error('invalid last(leg.stopovers)')

		// try to pass the trip ID from HAFAS A into HAFAS B
		if (hafasB.trip) {
			const pTrip = hafasB.trip(legA.id, legA.line.name, {
				stopovers: true, remarks: false
				// todo: `language`?
			})
			try {
				const tripB = await pTrip

				const firstI = tripB.stopovers.findIndex((stB) => {
					if (!matchStopOrStationByName(firstStopA)(stB)) return false
					const depB = scheduledDepartureOf(stB)
					return depB !== null && depB === depA
				})
				if (firstI < 0) throw new Error('first stopover not matched')
				const lastI = tripB.stopovers.slice(firstI + 1).findIndex((stB) => {
					if (!matchStopOrStationByName(lastStopA)(stB)) return false
					const arrB = scheduledArrivalOf(stB)
					return arrB !== null && arrB === arrA
				})
				if (lastI < 0) throw new Error('last stopover not matched')

				// todo: fahrtNr, intermediate stopovers
				console.error('match!')
				return null
			} catch (err) {
				if (err && err.isHafasError) {
					debug('trip() matching failed:', err && err.message || (err + ''))
				} else throw err
			}
		}

		const [firstStopB, lastStopB] = await Promise.all([
			findStop(hafasB, firstStopA),
			findStop(hafasB, lastStopA)
		])
		if (!firstStopB) {
			debug('firstStopA matching failed')
			return null
		}
		debug('firstStopB', firstStopB.id, firstStopB.name)
		if (!lastStopB) {
			debug('lastStopA matching failed')
			return null
		}
		debug('lastStopB', lastStopB.id, lastStopB.name)

		// todo
		return null
	}
	return findTripInAnotherHafas
}

module.exports = createFindLeg
