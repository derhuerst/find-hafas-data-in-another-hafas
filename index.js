'use strict'

const {
	createMergeArrival,
	createMergeDeparture,
} = require('./merge-arr-dep')

module.exports = {
	createMatchLine: require('./match-line'),
	createMatchStopOrStation: require('./match-stop-or-station'),
	createMatchStopover: require('./match-stopover'),
	createFindStop: require('./find-stop'),
	createFindLeg: require('./find-leg'),
	createMergeLeg: require('./merge-leg'),
	createMergeArrival,
	createMergeDeparture,
}
