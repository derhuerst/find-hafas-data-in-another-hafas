'use strict'

const createDbHafas = require('db-hafas')
const createVbbHafas = require('vbb-hafas')
const createFindLeg = require('../find-leg')
const createMergeLeg = require('../merge-leg')
const {
	normalizeStopName: normalizeDbStopName,
	normalizeLineName: normalizeDbLineName
} = require('../test/normalize-db-names')
const {
	normalizeStopName: normalizeVbbStopName,
	normalizeLineName: normalizeVbbLineName
} = require('../test/normalize-vbb-names')

const dbHafas = createDbHafas('find-db-hafas-leg-in-another-hafas example')
const db = {
	// The client name should be URL-safe & stable, it will be used to compute
	// IDs to be matched against other IDs.
	endpointName: 'db',
	client: dbHafas,
	normalizeStopName: normalizeDbStopName,
	normalizeLineName: normalizeDbLineName,
}

const vbbHafas = createVbbHafas('find-db-hafas-leg-in-another-hafas example')
const vbb = {
	endpointName: 'vbb',
	client: vbbHafas,
	normalizeStopName: normalizeVbbStopName,
	normalizeLineName: normalizeVbbLineName,
}

const findLegInAnother = createFindLeg(db, vbb)
const mergeLegs = createMergeLeg(db, vbb)

const potsdamerPlatz = '8011118'
const südkreuz = '8011113'
dbHafas.journeys(potsdamerPlatz, südkreuz, {results: 1, stopovers: true, tickets: false})
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
