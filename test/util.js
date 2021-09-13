'use strict'

const {join} = require('path')
const {DateTime} = require('luxon')

if (process.env.VCR_MODE && !process.env.VCR_OFF) {
	const replayer = require('replayer')
	replayer.configure({
		headerWhitelist: [
			'Content-Type', 'Accept-Encoding', 'Accept',
		],
		includeHeaderValues: true,
		touchHits: false,
	})
	replayer.fixtureDir(join(__dirname, 'fixtures'))
}

const hour = 60 * 60 * 1000
const day = 24 * hour

const T_MOCK = 1632816000 * 1000 // 2021-09-28T10:00:00+02

// next Monday 10 am
const createWhen = (timezone, locale) => {
	const t = process.env.VCR_MODE && !process.env.VCR_OFF
		? T_MOCK
		: Date.now()
	return DateTime.fromMillis(t, {
		zone: timezone,
		locale,
	}).startOf('week').plus({weeks: 1, hours: 10}).toJSDate()
}

module.exports = {
	createWhen,
}
