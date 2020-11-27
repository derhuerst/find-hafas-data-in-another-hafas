
const without = require('lodash/without')
const tokenizeDb = require('tokenize-db-station-name')
const slug = require('slug')
const {strictEqual} = require('assert')

// todo: move to tokenize-db-station-name
const dbStopwords = [
	'bahnhof',
	'berlin', 'hamburg',
	'ubahn', 'sbahn', '[tram]',

	'bayern', 'thueringen', 'sachsen', 'anhalt', 'westfalen', 'wuerttemberg', 'oberpfalz', 'schwaben', 'oberbayern', 'holstein', 'braunschweig', 'saalekreis', 'saalekreis', 'niederbayern', 'schwarzwald', 'oldenburg', 'uckermark', 'rheinland', 'oberfranken', 'rheinhessen', 'hessen', 'altmark', 'limesstadt', 'vogtland', 'mecklenburg', 'mittelfranken', 'dillkreis', 'odenwald', 'erzgebirge', 'prignitz', 'oberhessen', 'ostfriesland', 'schleswig', 'unterfranken', 'westerwald', 'dithmarschen',
	// todo: 'saechsische schweiz', 'thueringer wald', 'schaumburg lippe', 'frankfurt main'
	'bahnhof',
	'fernbahnhof'
]

const normalizeStopName = (str) => {
	return without(tokenizeDb(str), ...dbStopwords).join(' ')
}

const normalizeLineName = (str) => {
	str = str
	.replace(/^bus\s+/ig, '') // buses
	.replace(/^str\s+/ig, '') // trams
	.replace(/\s/g, '')
	return slug(str)
}

strictEqual(normalizeLineName('Bus 142'), '142')
strictEqual(normalizeLineName('Metro Bus 142'), 'metrobus142')

module.exports = {
	normalizeStopName,
	normalizeLineName
}
