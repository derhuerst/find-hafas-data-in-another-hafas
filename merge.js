'use strict'

const omit = require('lodash/omit')
const createMatchStop = require('./lib/match-stop-or-station')
const createMatchStopover = require('./lib/match-stopover')
const {plannedDepartureOf} = require('./lib/helpers')

// this fails with unicode
const upperCase = str => str[0].toUpperCase() + str.slice(1)

const mergeStop = (dbStop, vbbStop) => {
	if (!vbbStop) return dbStop
	if (!dbStop) return {...vbbStop, id: null, vbbId: vbbStop.id}
	return {
		// todo: additional vbbStop props?
		...omit(dbStop, ['station']),
		vbbId: vbbStop.id,
		station: mergeStop(dbStop.station, vbbStop.station) || null
	}
}

const mergeWhen = (key) => (dbSt, vbbSt) => {
	const _cancelled = 'cancelled'
	const _when = key
	const _plannedWhen = 'planned' + upperCase(key)
	const _prognosedWhen = 'prognosed' + upperCase(key)
	const _delay = key + 'Delay'
	const _platform = key + 'Platform'
	const _plannedPlatform = 'planned' + upperCase(key) + 'Platform'
	const _prognosedPlatform = 'prognosed' + upperCase(key) + 'Platform'
	const _reachable = 'reachable'

	// always prefer VBB realtime data if both available
	const merged = {
		[_when]: (
			Number.isFinite(vbbSt[_delay])
			? vbbSt[_when]
			: dbSt[_when]
		),
		[_plannedWhen]: (
			vbbSt[_plannedWhen] ||
			dbSt[_plannedWhen] ||
			null
		),
		[_delay]: (
			Number.isFinite(vbbSt[_delay])
			? vbbSt[_delay]
			: dbSt[_delay]
		),
		[_platform]: (
			vbbSt[_platform] !== vbbSt[_plannedPlatform]
			? vbbSt[_platform]
			: dbSt[_platform]
		),
		[_plannedPlatform]: (
			vbbSt[_plannedPlatform] ||
			dbSt[_plannedPlatform] ||
			null
		)
	}

	if (_cancelled in vbbSt) {
		merged[_cancelled] = vbbSt[_cancelled]
	} else if (_cancelled in dbSt) {
		merged[_cancelled] = dbSt[_cancelled]
	}
	if (_prognosedWhen in vbbSt) {
		merged[_prognosedWhen] = vbbSt[_prognosedWhen]
	} else if (_prognosedWhen in dbSt) {
		merged[_prognosedWhen] = dbSt[_prognosedWhen]
	}
	if (_prognosedPlatform in vbbSt) {
		merged[_prognosedPlatform] = vbbSt[_prognosedPlatform]
	} else if (_prognosedPlatform in dbSt) {
		merged[_prognosedPlatform] = dbSt[_prognosedPlatform]
	}

	if (typeof vbbSt[_reachable] === 'boolean') {
		merged[_reachable] = vbbSt[_reachable]
	} else if (typeof dbSt[_reachable] === 'boolean') {
		merged[_reachable] = dbSt[_reachable]
	}

	return merged
}
const mergeDep = mergeWhen('departure')
const mergeArr = mergeWhen('arrival')

const mergeLegs = (dbLeg, vbbLeg, normalizeDbName, normalizeVbbName) => {
	const matchStop = createMatchStop(normalizeDbName, normalizeVbbName)
	const matchStopover = createMatchStopover(matchStop, plannedDepartureOf)
	const stopovers = dbLeg.stopovers.map((dbSt) => {
		const vbbSt = vbbLeg.stopovers.find(matchStopover(dbSt))
		if (!vbbSt) return dbSt
		return {
			...dbSt,
			stop: mergeStop(dbSt.stop, vbbSt.stop),
			...mergeDep(dbSt, vbbSt),
			...mergeArr(dbSt, vbbSt)
		}
	})

	return {
		...dbLeg,

		vbbTripId: vbbLeg.tripId,
		line: {
			...dbLeg.line,
			vbbFahrtNr: vbbLeg.line.fahrtNr
		},

		origin: mergeStop(dbLeg.origin, vbbLeg.origin),
		...mergeDep(dbLeg, vbbLeg),

		destination: mergeStop(dbLeg.destination, vbbLeg.destination),
		...mergeArr(dbLeg, vbbLeg),

		stopovers,

		remarks: [
			...dbLeg.remarks || [],
			...vbbLeg.remarks || []
		]
	}
}

module.exports = mergeLegs
