'use strict'

const createDbHafas = require('db-hafas')
const createVbbHafas = require('vbb-hafas')
const createFindLeg = require('..')
const createMergeLegs = require('../merge')
const {
	normalizeStopName: normalizeDbStopName,
	normalizeLineName: normalizeDbLineName
} = require('../test/normalize-db-names')
const {
	normalizeStopName: normalizeVbbStopName,
	normalizeLineName: normalizeVbbLineName
} = require('../test/normalize-vbb-names')

const dbName = 'db'
const db = createDbHafas('find-db-hafas-leg-in-another-hafas example')
const vbbName = 'vbb'
const vbb = createVbbHafas('find-db-hafas-leg-in-another-hafas example')

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
const mergeLegs = createMergeLegs({
	clientName: dbName,
	normalizeStopName: normalizeDbStopName
}, {
	clientName: vbbName,
	normalizeStopName: normalizeVbbStopName
})

const potsdamerPlatz = '8011118'
const südkreuz = '8011113'
db.journeys(potsdamerPlatz, südkreuz, {results: 1, stopovers: true, tickets: false})
.then(async (res) => {
	const [journey] = res.journeys

	const dbLeg = journey.legs.find(leg => leg.line) // find non-walking leg
	console.log('\n\n-- DB leg', dbLeg)

	const vbbLeg = await findLegInAnother(dbLeg)
	console.log('\n\n-- equivalent VBB leg', vbbLeg)

	const mergedLeg = mergeLegs(dbLeg, vbbLeg)
	console.log('\n\n-- mergedLeg', mergedLeg)
})
.catch((err) => {
	console.error(err)
	process.exitCode = 1
})
