'use strict'

const debug = require('debug')('find-hafas-data-in-another-hafas:find-arr-dep')
const createFindStop = require('./find-stop')
const createMatchLine = require('./match-line')
const createMatchStop = require('./match-stop-or-station')

const MINUTE = 60 * 1000

const createFindArrDep = (method, A, B) => {
	const {
		endpointName: endpName,
		client,
	} = B

	if (method !== 'departures' && method !== 'arrivals') {
		throw new Error('invalid method')
	}

	const findStop = createFindStop(A, B)
	const matchLine = createMatchLine(A, B)
	const matchStop = createMatchStop(A, B)

	// todo: debug logs
	const findArrDep = async (depA, clientOpts = {}) => {
		debug('depA', depA)

		const stopB = await findStop(depA.stop)
		if (!stopB) {
			debug('finding the stop in', endpName, 'failed', depA.stop)
			return null
		}
		debug('stopB', stopB)

		// todo: search by realtime as well?
		const whenA = +new Date(depA.plannedWhen)
		// todo: fall back to `client[method](stopB.station, opts)`
		const depsB = await client[method](stopB, {
			...clientOpts,
			when: new Date(whenA - MINUTE),
			duration: 2 * MINUTE,
			// todo: includeRelatedStations ?
		})

		const matchStopA = matchStop(depA.stop)
		for (const depB of depsB) {
			debug('depB candidate', depB)

			if (!matchLine(depA.line, depB.line)) {
				debug('matching by line name failed', depA.line, depB.line)
				continue
			}
			if (!matchStopA(depB.stop)) {
				debug('matching by stop failed', depA.stop, depB.stop)
				continue
			}
			if (!depB.plannedWhen || depA.plannedWhen !== depB.plannedWhen) {
				debug('matching date/time failed', depA.plannedWhen, depB.plannedWhen)
				continue
			}
			return depB
		}
		return null
	}
	return findArrDep
}

const createFindDeparture = createFindArrDep.bind(null, 'departures')
const createFindArrival = createFindArrDep.bind(null, 'arrivals')

module.exports = {
	createFindArrDep,
	createFindDeparture,
	createFindArrival,
}
