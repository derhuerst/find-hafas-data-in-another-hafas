'use strict'

const without = require('lodash/without')
const tokenizeVbb = require('tokenize-vbb-station-name')
const slug = require('slug')

// todo: move to tokenize-vbb-station-name
const vbbStopwords = [
	'bahnhof',
	'berlin', 'polen',
	'sbahn', 'ubahn'
]

const normalizeStopName = (str) => {
	return without(tokenizeVbb(str), ...vbbStopwords).join(' ')
}

const normalizeLineName = str => slug(str.replace(/\s/g, ''))

module.exports = {
	normalizeStopName,
	normalizeLineName
}
