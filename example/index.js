'use strict'

const createDbHafas = require('db-hafas')
const createVbbHafas = require('vbb-hafas')
const createFindLeg = require('..')
const mergeLegs = require('../merge')
const {
	normalizeStopName: normalizeDbStopName,
	normalizeLineName: normalizeDbLineName
} = require('../test/normalize-db-names')
const {
	normalizeStopName: normalizeVbbStopName,
	normalizeLineName: normalizeVbbLineName
} = require('../test/normalize-vbb-names')

const db = createDbHafas('find-db-hafas-leg-in-another-hafas example')
const vbb = createVbbHafas('find-db-hafas-leg-in-another-hafas example')

const findLegInAnother = createFindLeg({
	hafas: db,
	normalizeStopName: normalizeDbStopName,
	normalizeLineName: normalizeDbLineName
}, {
	hafas: vbb,
	normalizeStopName: normalizeVbbStopName,
	normalizeLineName: normalizeVbbLineName
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

	const mergedLeg = mergeLegs(dbLeg, vbbLeg, normalizeDbStopName, normalizeVbbStopName)
	console.log('\n\n-- mergedLeg', mergedLeg)
})
.catch((err) => {
	console.error(err)
	process.exitCode = 1
})
