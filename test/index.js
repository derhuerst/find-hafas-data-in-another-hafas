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
