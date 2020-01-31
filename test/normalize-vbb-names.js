'use strict'

const without = require('lodash/without')
const tokenizeVbb = require('tokenize-vbb-station-name')
const {strictEqual} = require('assert')
const slug = require('slug')

// todo: move to tokenize-vbb-station-name
const vbbStopwords = [
	'bahnhof',
	'berlin', 'polen',
	'sbahn', 'ubahn'
]

const normalizeStopName = (str) => {
	return without(tokenizeVbb(str), ...vbbStopwords)
	.reduce((tokens, token) => {
		if (/[\w]strasse/g.test(token)) {
			return [...tokens, token.slice(0, -7), token.slice(-7)]
		}
		return [...tokens, token]
	}, [])
	.join(' ')
}

strictEqual(normalizeStopName('Foo Barstr.'), 'foo bar strasse')
strictEqual(normalizeStopName('str.'), 'strasse')

const normalizeLineName = str => slug(str.replace(/\s/g, ''))

module.exports = {
	normalizeStopName,
	normalizeLineName
}
