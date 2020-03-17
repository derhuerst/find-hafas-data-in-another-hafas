'use strict'

const createDbHafas = require('db-hafas')
const createVbbHafas = require('vbb-hafas')
const tape = require('tape')
const tapePromise = require('tape-promise').default

const dbRE5 = require('./db-re5.json')
const vbbRE5 = require('./vbb-re5.json')
const mergedRE5 = require('./merged-re5.json')
const {
	normalizeStopName: normalizeDbStopName,
	normalizeLineName: normalizeDbLineName
} = require('./normalize-db-names')
const {
	normalizeStopName: normalizeVbbStopName,
	normalizeLineName: normalizeVbbLineName
} = require('./normalize-vbb-names')

const createMergeLegs = require('../merge')
const createFindLeg = require('..')

const db = createDbHafas('find-db-hafas-leg-in-another-hafas test')
const vbb = createVbbHafas('find-db-hafas-leg-in-another-hafas test')

const potsdamerPlatz = '8011118'
const südkreuz = '8011113'

const test = tapePromise(tape)

test('merge works', (t) => {
	const mergeLegs = createMergeLegs({
		clientName: 'db',
		normalizeStopName: normalizeDbStopName
	}, {
		clientName: 'vbb',
		normalizeStopName: normalizeVbbStopName
	})
	const actualMergedRE5 = mergeLegs(dbRE5, vbbRE5)
	t.deepEqual(actualMergedRE5, mergedRE5, 'merged leg is equal')
	t.end()
})



test('findLegInAnother works', async (t) => {
	const res = await db.journeys(potsdamerPlatz, südkreuz, {
		results: 1, stopovers: true, tickets: false
	})
	const [journey] = res.journeys
	const dbLeg = journey.legs.find(leg => leg.line) // find non-walking leg
	t.ok(dbLeg, 'prerequisite: missing non-walking DB leg')

	const findLegInAnother = createFindLeg({
		clientName: 'db',
		hafas: db,
		normalizeStopName: normalizeDbStopName,
		normalizeLineName: normalizeDbLineName
	}, {
		clientName: 'vbb',
		hafas: vbb,
		normalizeStopName: normalizeVbbStopName,
		normalizeLineName: normalizeVbbLineName
	})
	const vbbLeg = await findLegInAnother(dbLeg)
	t.ok(vbbLeg, 'matching worked')

	const vbbLineName = normalizeVbbLineName(vbbLeg.line.name, vbbLeg.line)
	const dbLineName = normalizeDbLineName(dbLeg.line.name, dbLeg.line)
	t.equal(vbbLineName, dbLineName, 'line names are equal')
	// todo: more assertions

	t.end()
})



const foo = {
	type: 'stop', id: 'foo', name: 'Foo',
	location: {latitude: 1, longitude: 2}
}
const dep = '2010-10-10T10:10+01:00'
const bar = {
	type: 'stop', id: 'bar', name: 'Bar',
	location: {latitude: 2, longitude: 3}
}
const arr = '2010-10-10T10:20+01:00'
const legA = {
	origin: foo,
	departure: dep,
	plannedDeparture: dep,
	departureDelay: null,

	destination: bar,
	arrival: arr,
	plannedArrival: arr,
	arrivalDelay: null,

	tripId: 'trip-123',
	line: {id: 'a', name: 'A'},
	direction: 'anywhere',
	stopovers: [{
		stop: foo,
		departure: dep,
		plannedDeparture: dep,
		departureDelay: null,
	}, {
		stop: {
			type: 'stop', id: 'baz', name: 'Baz',
			location: {latitude: 3, longitude: 4}
		},
		arrival: '2010-10-10T10:15+01:00',
		plannedArrival: '2010-10-10T10:15+01:00',
		arrivalDelay: null,
		departure: '2010-10-10T10:16+01:00',
		plannedDeparture: '2010-10-10T10:16+01:00',
		departureDelay: null,
	}, {
		stop: bar,
		arrival: arr,
		plannedArrival: arr,
		arrivalDelay: null,
	}]
}

test('findLegInAnother picks the right index', async (t) => {
	const hafasB = {
		stop: async (id) => {
			if (id === foo.id) return foo
			if (id === bar.id) return bar
			throw new Error('some error')
		},
		departures: async (id) => {
			if (id !== foo.id) throw new Error('some error')
			return [{
				stop: foo,
				tripId: legA.tripId,
				direction: legA.direction,
				line: legA.line,
				nextStopovers: [{
					stop: {
						type: 'stop', id: 'qux', name: 'qux',
						location: {latitude: 4, longitude: 5}
					}
				}, ...legA.stopovers]
			}]
		}
	}

	const normalizeName = n => n.toLowerCase()
	const findLegInAnother = createFindLeg({
		clientName: 'A',
		hafas: db,
		normalizeStopName: normalizeName,
		normalizeLineName: normalizeName
	}, {
		clientName: 'B',
		hafas: hafasB,
		normalizeStopName: normalizeName,
		normalizeLineName: normalizeName
	})

	const legB = await findLegInAnother(legA)
	t.ok(legB)
	t.equal(legB.destination.id, 'bar')
	t.equal(legB.stopovers[legB.stopovers.length - 1].stop.id, 'bar')
	t.end()
})
