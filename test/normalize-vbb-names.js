'use strict'

const without = require('lodash/without')
const normalizeVbbStationName = require('normalize-vbb-station-name-for-search')
const {strictEqual} = require('assert')
const slug = require('slug')

const normalizeStopName = (rawName) => {
	return normalizeVbbStationName(rawName)
}

const normalizeLineName = str => slug(str.replace(/\s/g, ''))

module.exports = {
	normalizeStopName,
	normalizeLineName
}
