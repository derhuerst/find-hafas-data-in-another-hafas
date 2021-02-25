'use strict'

const {DateTime} = require('luxon')
const createDbHafas = require('db-hafas')
const createVbbHafas = require('vbb-hafas')
const tape = require('tape')
const tapePromise = require('tape-promise').default

const dbStop = require('./db-stop.json')
const vbbStop = require('./vbb-stop.json')
const mergedStop = require('./merged-stop.json')
const dbU7Dep = require('./db-u7-departure.json')
const vbbU7Dep = require('./vbb-u7-departure.json')
const mergedU7Dep = require('./merged-u7-departure.json')
const dbRE5Leg = require('./db-re5-leg.json')
const vbbRE5Leg = require('./vbb-re5-leg.json')
const mergedRE5Leg = require('./merged-re5-leg.json')
const {
	normalizeStopName: normalizeDbStopName,
	normalizeLineName: normalizeDbLineName
} = require('./normalize-db-names')
const {
	normalizeStopName: normalizeVbbStopName,
	normalizeLineName: normalizeVbbLineName
} = require('./normalize-vbb-names')

const createMergeId = require('../lib/merge-id')
const mergeIds = require('../lib/merge-ids')
const createMergeStop = require('../merge-stop')
const {createMergeDeparture} = require('../merge-arr-dep')
const createMergeLeg = require('../merge-leg')
const createFindLeg = require('../find-leg')
const {createFindDeparture} = require('../find-arr-dep')

const WHEN = DateTime
.fromMillis(Date.now(), {
	zone: 'Europe/Berlin',
	locale: 'de-DE',
})
.startOf('week')
.plus({weeks: 1, hours: 10})
.toJSDate()

const db = createDbHafas('find-db-hafas-leg-in-another-hafas test')
const vbb = createVbbHafas('find-db-hafas-leg-in-another-hafas test')

const potsdamerPlatz = '8011118'
const südkreuz = '8011113'

const test = tapePromise(tape)

test('mergeId works', (t) => {
	const m = createMergeId
	t.equal(m(true)(null, 'b'), 'b')
	t.equal(m(true)(undefined, 'b'), 'b')
	t.equal(m(true)(null, 0), 0)
	t.equal(m(true)('a', null), 'a')
	t.equal(m(true)('a', undefined), 'a')
	t.equal(m(true)(0, null), 0)
	t.equal(m(true)('a', 'b'), 'b')
	t.equal(m(true)(1, 0), 0)

	t.equal(m(false)(null, 'b'), 'b')
	t.equal(m(false)(undefined, 'b'), 'b')
	t.equal(m(false)(null, 0), 0)
	t.equal(m(false)('a', null), 'a')
	t.equal(m(false)('a', undefined), 'a')
	t.equal(m(false)(0, null), 0)
	t.equal(m(false)('a', 'b'), 'a')
	t.equal(m(false)(0, 1), 0)

	t.equal(m()(null, 'b'), 'b')
	t.equal(m()(undefined, 'b'), 'b')
	t.equal(m()(null, 0), 0)
	t.equal(m()('a', null), 'a')
	t.equal(m()('a', undefined), 'a')
	t.equal(m()(0, null), 0)
	t.equal(m()('a', 'b'), 'a')
	t.equal(m()(0, 1), 0)
	t.end()
})

test('mergeIds works', (t) => {
	const a = {foo: 1, foos: {c: 3}}
	const b = {foo: 2, foos: {a: 5, d: 4}}

	t.deepEqual(mergeIds('foo', 'a', null, 'b', null), {})
	t.deepEqual(mergeIds('foo', 'a', a, 'b', null), {a: 1, c: 3})
	t.deepEqual(mergeIds('foo', 'a', null, 'b', b), {a: 5, b: 2, d: 4})
	t.deepEqual(mergeIds('foo', 'a', a, 'b', b), {a: 1, b: 2, c: 3, d: 4})
	t.end()
})

test('mergeStop works', (t) => {
	const DB = {
		endpointName: 'db',
		normalizeStopName: normalizeDbStopName,
	}
	const VBB = {
		endpointName: 'vbb',
		normalizeStopName: normalizeVbbStopName,
	}

	const actualMergedStop = createMergeStop(DB, VBB)(dbStop, vbbStop)
	const omit = require('lodash/omit')
	t.deepEqual(omit(actualMergedStop, ['stops']), omit(mergedStop, ['stops']), 'merged stop is not equal')
	// todo: this fails because the stop name normalization is not good enough
	// t.deepEqual(actualMergedStop.stops, mergedStop.stops, 'merged.stops[] is not equal')

	const actualMergedStop2 = createMergeStop(DB, VBB, {
		preferB: {id: true},
	})(dbStop, vbbStop)
	t.equal(actualMergedStop2.id, vbbStop.id)
	t.end()
})

test('mergeDeparture works', (t) => {
	const mergeDep = createMergeDeparture({
		endpointName: 'db',
		normalizeStopName: normalizeDbStopName,
	}, {
		endpointName: 'vbb',
		normalizeStopName: normalizeVbbStopName,
	})
	const actualMergedU7Dep = mergeDep(dbU7Dep, vbbU7Dep)
	t.deepEqual(actualMergedU7Dep, mergedU7Dep, 'merged departure is equal')
	t.end()
})

test('mergeLeg works', (t) => {
	const mergeLegs = createMergeLeg({
		endpointName: 'db',
		normalizeStopName: normalizeDbStopName
	}, {
		endpointName: 'vbb',
		normalizeStopName: normalizeVbbStopName
	})
	const actualMergedRE5Leg = mergeLegs(dbRE5Leg, vbbRE5Leg)
	t.deepEqual(actualMergedRE5Leg, mergedRE5Leg, 'merged leg is equal')
	t.end()
})



const dbEndpoint = {
	endpointName: 'db',
	client: db,
	// todo: serviceArea
	normalizeStopName: normalizeDbStopName,
	normalizeLineName: normalizeDbLineName
}
const vbbEndpoint = {
	endpointName: 'vbb',
	client: vbb,
	normalizeStopName: normalizeVbbStopName,
	normalizeLineName: normalizeVbbLineName
}

test('findDeparture works', async (t) => {
	const [dbDep] = await db.departures(potsdamerPlatz, {
		when: WHEN,
		results: 1, stopovers: true,
	})

	const findDeparture = createFindDeparture(dbEndpoint, vbbEndpoint)
	const vbbDep = await findDeparture(dbDep)
	t.ok(vbbDep, 'matching worked')

	// todo
	const vbbLineName = normalizeVbbLineName(vbbDep.line.name, vbbDep.line)
	const dbLineName = normalizeDbLineName(dbDep.line.name, dbDep.line)
	t.equal(vbbLineName, dbLineName, 'line names are equal')
	const vbbStopName = normalizeVbbStopName(vbbDep.stop.name)
	const dbStopName = normalizeDbStopName(dbDep.stop.name)
	t.equal(vbbStopName, dbStopName, 'stop names are equal')

	t.end()
})

test('findLegInAnother works', async (t) => {
	const res = await db.journeys(potsdamerPlatz, südkreuz, {
		results: 1, stopovers: true, tickets: false
	})
	const [journey] = res.journeys
	const dbLeg = journey.legs.find(leg => leg.line) // find non-walking leg
	t.ok(dbLeg, 'prerequisite: missing non-walking DB leg')

	const findLegInAnother = createFindLeg(dbEndpoint, vbbEndpoint)
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
	const clientB = {
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
		endpointName: 'A',
		client: db,
		normalizeStopName: normalizeName,
		normalizeLineName: normalizeName
	}, {
		endpointName: 'B',
		client: clientB,
		normalizeStopName: normalizeName,
		normalizeLineName: normalizeName
	})

	const legB = await findLegInAnother(legA)
	t.ok(legB)
	t.equal(legB.destination.id, 'bar')
	t.equal(legB.stopovers[legB.stopovers.length - 1].stop.id, 'bar')
	t.end()
})
