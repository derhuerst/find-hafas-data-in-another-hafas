'use strict'

const createDbHafas = require('db-hafas')
const createVbbHafas = require('vbb-hafas')
const {ok, fail, strictEqual} = require('assert')
const {deepStrictEqual} = require('assert')

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

const mergeLegs = createMergeLegs({
	clientName: 'db',
	normalizeStopName: normalizeDbStopName
}, {
	clientName: 'vbb',
	normalizeStopName: normalizeVbbStopName
})
const actualMergedRE5 = mergeLegs(dbRE5, vbbRE5)
deepStrictEqual(actualMergedRE5, mergedRE5)
console.info('merge works fine')

;(async () => {
	const res = await db.journeys(potsdamerPlatz, südkreuz, {
		results: 1, stopovers: true, tickets: false
	})
	const [journey] = res.journeys
	const dbLeg = journey.legs.find(leg => leg.line) // find non-walking leg
	ok(dbLeg, 'missing test prerequisite: DB leg')

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

	const vbbLineName = normalizeVbbLineName(vbbLeg.line.name)
	const dbLineName = normalizeDbLineName(dbLeg.line.name)
	strictEqual(vbbLineName, dbLineName, 'line names not equal')
	// todo: more assertions

	console.info('findLegInAnother works')
})()
.catch((err) => {
	console.error(err)
	process.exitCode = 1
})
