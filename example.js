'use strict'

const createDbHafas = require('db-hafas')
const createVbbHafas = require('vbb-hafas')
const createFindLeg = require('.')

const potsdamerPlatz = '8011118'
const südkreuz = '8011113'

const db = createDbHafas('find-db-hafas-leg-in-another-hafas example')
const vbb = createVbbHafas('find-db-hafas-leg-in-another-hafas example')
const findLegInAnother = createFindLeg(db, vbb)

db.journeys(potsdamerPlatz, südkreuz, {results: 1, stopovers: true, tickets: false})
.then(async (res) => {
	const [journey] = res.journeys

	const dbLeg = journey.legs.find(leg => leg.line) // find non-walking leg
	console.log('DB leg', dbLeg)

	const vbbLeg = await findLegInAnother(dbLeg)
	console.log('equivalent VBB leg', vbbLeg)
})
.catch((err) => {
	console.error(err)
	process.exitCode = 1
})
