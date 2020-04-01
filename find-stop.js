'use strict'

const _distance = require('@turf/distance').default
const {point} = require('@turf/helpers')
const debug = require('debug')('find-hafas-data-in-another-hafas:find-stop')
const createMatchStopOrStation = require('./match-stop-or-station')

const distance = (lA, lB) => {
	return _distance(
		point([lA.longitude, lA.latitude]),
		point([lB.longitude, lB.latitude]),
		{units: 'kilometers'}
	)
}

const createFindStop = (A, B) => {
	const {
		endpointName: endpNameA,
		normalizeStopName: normalizeStopNameA,
	} = A
	const {
		endpointName: endpNameB,
		client: clientB,
		normalizeStopName: normalizeStopNameB,
	} = B

	const matchStopOrStation = createMatchStopOrStation(A, B)

	const findStopByName = async (stopA) => {
		debug('findStopByName', stopA.id, stopA.name)

		const nearby = await clientB.nearby(stopA.location, {
			poi: false,
			results: 10,
			subStops: false, entrances: false, linesOfStops: false,
		})
		debug('clientB.nearby()', stopA.location, nearby.map(loc => [loc.id, loc.name]))

		const matchA = matchStopOrStation(stopA)
		return nearby.find(matchA) || null

		// todo
		// const fuzzy = await clientB.locations(stopA.name, {
		// 	addresses: false, poi: false
		// })
	}

	const findStopById = async (stopA) => {
		debug('findStopById', stopA.id, stopA.ids, stopA.name)
		const idsA = stopA.ids || {}
		const idA = (
			idsA[endpNameB] ||
			idsA[endpNameB.toLowerCase()] ||
			idsA[endpNameB.toUpperCase()] ||
			stopA.id
		)
		try {
			const exact = await clientB.stop(idA)
			return distance(exact.location, stopA.location) < .2 ? exact : null
		} catch (err) {
			if (err && err.isHafasError) return null
			throw err
		}
	}

	const findStop = async (sA) => {
		debug('findStop', sA.id, sA.name)

		let sB = await findStopById(sA)
		if (sB) {
			debug('matched by stop ID with', endpNameB, sB.id, sB.ids || {}, sB.name)
			return sB
		}
		if (sA.station) {
			sB = await findStopById(sA.station)
			if (sB) {
				debug('matched by station ID with', endpNameB, sB.id, sB.ids || {}, sB.name)
				return sB
			}
		}
		sB = await findStopByName(sA)
		if (sB) {
			debug('matched by name with', endpNameB, sB.id, sB.name)
			return sB
		}
		if (sA.station) {
			sB = await findStopByName(sA.station)
			if (sB) {
				debug('matched by station name with', endpNameB, sB.id, sB.name)
				return sB
			}
		}

		debug('not matched :(', sA.id, sA.name)
		return null
	}
	return findStop
}

module.exports = createFindStop
