
const without = require('lodash/without')
const tokenizeDb = require('tokenize-db-station-name')
const slug = require('slug')

// todo: move to tokenize-db-station-name
const dbStopwords = [
	'bahnhof',
	'berlin',
	'sbahn',

	'bayern', 'thueringen', 'sachsen', 'anhalt', 'westfalen', 'wuerttemberg', 'oberpfalz', 'schwaben', 'oberbayern', 'holstein', 'braunschweig', 'saalekreis', 'saalekreis', 'niederbayern', 'schwarzwald', 'oldenburg', 'uckermark', 'rheinland', 'oberfranken', 'rheinhessen', 'hessen', 'altmark', 'limesstadt', 'vogtland', 'mecklenburg', 'mittelfranken', 'dillkreis', 'odenwald', 'erzgebirge', 'prignitz', 'oberhessen', 'ostfriesland', 'schleswig', 'unterfranken', 'westerwald', 'dithmarschen',
	// todo: 'saechsische schweiz', 'thueringer wald', 'schaumburg lippe', 'frankfurt main'
	'bahnhof',
	'fernbahnhof'
]

const normalizeStopName = (str) => {
	return without(tokenizeDb(str), ...dbStopwords).join(' ')
}

const normalizeLineName = str => slug(str.replace(/\s/g, ''))

module.exports = {
	normalizeStopName,
	normalizeLineName
}
