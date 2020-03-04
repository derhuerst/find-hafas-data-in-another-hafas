# find-hafas-leg-in-another-hafas

**Find a journey leg from one HAFAS endpoint in the data of another HAFAS endpoint.**

[![npm version](https://img.shields.io/npm/v/find-hafas-leg-in-another-hafas.svg)](https://www.npmjs.com/package/find-hafas-leg-in-another-hafas)
[![build status](https://api.travis-ci.org/derhuerst/find-hafas-leg-in-another-hafas.svg?branch=master)](https://travis-ci.org/derhuerst/find-hafas-leg-in-another-hafas)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/find-hafas-leg-in-another-hafas.svg)
[![chat with me on Gitter](https://img.shields.io/badge/chat%20with%20me-on%20gitter-512e92.svg)](https://gitter.im/derhuerst)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)

Public transport providers in Europe often have data about vehicles run by other companies, but almost always it is outdated or imprecise. Consider these examples:

![sncf.com showing TGV 6631](docs/tgv-6631-sncf.png)
![bahn.de showing TGV 6631](docs/tgv-6631-db.png)

![bahn.de showing IC 2029](docs/ic-2029-db.png)
![sncf.com showing IC 2029](docs/ic-2029-sncf.png)

**Let's always get the data about a vehicles from the company that actually run it!** Given a [`leg`](https://github.com/public-transport/friendly-public-transport-format/blob/1.2.1/spec/readme.md#journey) from an endpoint `A`, you can use this library to fetch more up-to-date data about it from another endpoint `B`.

[*Why linked open transit data?*](https://github.com/public-transport/why-linked-open-transit-data) explains more about this idea.


## Installation

```shell
npm install find-hafas-leg-in-another-hafas
```


## Usage

```js
const createDbHafas = require('db-hafas')
const createVbbHafas = require('vbb-hafas')
const createFindLeg = require('find-hafas-leg-in-another-hafas')
const createMergeLegs = require('find-hafas-leg-in-another-hafas/merge')

// Note that, for legs to be matched reliably, you need a more
// sophisticated normalization function. Use e.g.
// - https://github.com/derhuerst/tokenize-db-station-name
// - https://github.com/derhuerst/tokenize-vbb-station-name
const normalizeName = name => str.toLowerCase().replace(/\s/g, '')

// These names should be URL-safe & stable, they will used to compute
// IDs to be matched against other IDs.
const dbName = 'db'
const db = createDbHafas('find-db-hafas-leg-in-another-hafas example')
const vbbName = 'vbb'
const vbb = createVbbHafas('find-db-hafas-leg-in-another-hafas example')

const findLegInAnother = createFindLeg({
	clientName: dbName,
	hafas: db,
	normalizeStopName: normalizeName,
	normalizeLineName: normalizeName
}, {
	clientName: vbbName,
	hafas: vbb,
	normalizeStopName: normalizeName,
	normalizeLineName: normalizeName
})
const mergeLegs = createMergeLegs({
	clientName: dbName,
	normalizeStopName: normalizeName
}, {
	clientName: vbbName,
	normalizeStopName: normalizeName
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

const mergedLeg = mergeLegs(dbLeg, vbbLeg)
console.log('mergedLeg', mergedLeg)
```


## Related

- [*Why linked open transit data?*](https://github.com/public-transport/why-linked-open-transit-data)
- [`pan-european-routing`](https://github.com/derhuerst/pan-european-routing) – Get public transport data across Europe, using multiple HAFAS endpoints.
- [`stable-public-transport-ids`](https://github.com/derhuerst/stable-public-transport-ids) – Get stable IDs for public transport stations, etc.


## Contributing

If you have a question or need support using `find-hafas-leg-in-another-hafas`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/find-hafas-leg-in-another-hafas/issues).
