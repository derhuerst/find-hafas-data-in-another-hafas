'use strict'

const omit = require('lodash/omit')
const createMatchStop = require('./lib/match-stop-or-station')
const createMatchStopover = require('./lib/match-stopover')
const {scheduledDepartureOf, scheduledArrivalOf} = require('./lib/helpers')

// this fails with unicode
const camelCase = str => str[0].toUpperCase() + str.slice(1)

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
	const _scheduledWhen = 'scheduled' + camelCase(key)
	const _delay = key + 'Delay'
	const _platform = key + 'Platform'
	const _reachable = 'reachable'

	// always prefer VBB realtime data if both available
	return {
		[_cancelled]: (
			typeof vbbSt[_cancelled] === 'boolean'
			? vbbSt[_cancelled]
			: dbSt[_cancelled] || null
		),
		[_when]: vbbSt[_when] || dbSt[_when],
		[_scheduledWhen]: (
			vbbSt[_scheduledWhen] ||
			dbSt[_scheduledWhen] ||
			null
		),
		[_delay]: (
			Number.isFinite(vbbSt[_delay])
			? vbbSt[_delay]
			: dbSt[_delay]
		),
		[_platform]: (
			vbbSt[_platform] !== null
			? vbbSt[_platform]
			: dbSt[_platform]
		),
		[_reachable]: (
			typeof vbbSt[_reachable] === 'boolean'
			? vbbSt[_reachable]
			: dbSt[_reachable] || null
		)
	}
}
const mergeDep = mergeWhen('departure')
const mergeArr = mergeWhen('arrival')

const mergeLegs = (dbLeg, vbbLeg, normalizeDbName, normalizeVbbName) => {
	const matchStop = createMatchStop(normalizeDbName, normalizeVbbName)
	const matchStopover = createMatchStopover(matchStop, scheduledDepartureOf)
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
