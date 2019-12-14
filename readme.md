# find-hafas-leg-in-another-hafas

**Find a journey leg from one HAFAS endpoint in the data of another HAFAS endpoint.**

[![npm version](https://img.shields.io/npm/v/find-hafas-leg-in-another-hafas.svg)](https://www.npmjs.com/package/find-hafas-leg-in-another-hafas)
[![build status](https://api.travis-ci.org/derhuerst/find-hafas-leg-in-another-hafas.svg?branch=master)](https://travis-ci.org/derhuerst/find-hafas-leg-in-another-hafas)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/find-hafas-leg-in-another-hafas.svg)
[![chat with me on Gitter](https://img.shields.io/badge/chat%20with%20me-on%20gitter-512e92.svg)](https://gitter.im/derhuerst)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## Installation

```shell
npm install find-hafas-leg-in-another-hafas
```


## Usage

```js
const createDbHafas = require('db-hafas')
const createVbbHafas = require('vbb-hafas')
const createFindLeg = require('find-hafas-leg-in-another-hafas')

// Note that, for legs to be matched reliably, you need a more
// sophisticated normalization function. Use e.g.
// - https://github.com/derhuerst/tokenize-db-station-name
// - https://github.com/derhuerst/tokenize-vbb-station-name
const normalizeName = name => str.toLowerCase().replace(/\s/g, '')

const db = createDbHafas('find-db-hafas-leg-in-another-hafas example')
const vbb = createVbbHafas('find-db-hafas-leg-in-another-hafas example')

const findLegInAnother = createFindLeg({
	hafas: db,
	normalizeStopName: normalizeName,
	normalizeLineName: normalizeName
}, {
	hafas: vbb,
	normalizeStopName: normalizeName,
	normalizeLineName: normalizeName
})

const potsdamerPlatz = '8011118'
const südkreuz = '8011113'
const res = await db.journeys(potsdamerPlatz, südkreuz, {
	results: 1, stopovers: true, tickets: false
})
const [journey] = res.journeys

const dbLeg = journey.legs.find(leg => leg.line) // find non-walking leg
console.log('DB leg', dbLeg)

const vbbLeg = findLegInAnother(dbLeg)
console.log('equivalent VBB leg', leg)
```


## Contributing

If you have a question or need support using `find-hafas-leg-in-another-hafas`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/find-hafas-leg-in-another-hafas/issues).
