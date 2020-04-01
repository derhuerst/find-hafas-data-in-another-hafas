'use strict'

const createMergeWhen = (keys) => (stA, stB) => {
	const {
		cancelled: _cancelled,
		when: _when,
		plannedWhen: _plannedWhen,
		prognosedWhen: _prognosedWhen,
		delay: _delay,
		platform: _platform,
		plannedPlatform: _plannedPlatform,
		prognosedPlatform: _prognosedPlatform,
		reachable: _reachable,
	} = keys

	// always prefer `stB` realtime data if both available
	const merged = {
		[_when]: (
			Number.isFinite(stB[_delay])
			? stB[_when]
			: stA[_when]
		),
		[_plannedWhen]: (
			stB[_plannedWhen] ||
			stA[_plannedWhen] ||
			null
		),
		[_delay]: (
			Number.isFinite(stB[_delay])
			? stB[_delay]
			: stA[_delay]
		),
		[_platform]: (
			stB[_platform] !== stB[_plannedPlatform] // todo
			? stB[_platform]
			: stA[_platform]
		),
		[_plannedPlatform]: (
			stB[_plannedPlatform] ||
			stA[_plannedPlatform] ||
			null
		)
	}

	if (_cancelled in stB) {
		merged[_cancelled] = stB[_cancelled]
	} else if (_cancelled in stA) {
		merged[_cancelled] = stA[_cancelled]
	}
	if (_prognosedWhen in stB) {
		merged[_prognosedWhen] = stB[_prognosedWhen]
	} else if (_prognosedWhen in stA) {
		merged[_prognosedWhen] = stA[_prognosedWhen]
	}
	if (_prognosedPlatform in stB) {
		merged[_prognosedPlatform] = stB[_prognosedPlatform]
	} else if (_prognosedPlatform in stA) {
		merged[_prognosedPlatform] = stA[_prognosedPlatform]
	}

	if (typeof stB[_reachable] === 'boolean') {
		merged[_reachable] = stB[_reachable]
	} else if (typeof stA[_reachable] === 'boolean') {
		merged[_reachable] = stA[_reachable]
	}

	return merged
}

const mergeArrival = createMergeWhen({
	cancelled: 'cancelled',
	when: 'arrival',
	plannedWhen: 'plannedArrival',
	prognosedWhen: 'prognosedArrival',
	delay: 'arrivalDelay',
	platform: 'arrivalPlatform',
	plannedPlatform: 'plannedArrivalPlatform',
	prognosedPlatform: 'prognosedArrivalPlatform',
	reachable: 'reachable',
})
const mergeDeparture = createMergeWhen({
	cancelled: 'cancelled',
	when: 'departure',
	plannedWhen: 'plannedDeparture',
	prognosedWhen: 'prognosedDeparture',
	delay: 'departureDelay',
	platform: 'departurePlatform',
	plannedPlatform: 'plannedDeparturePlatform',
	prognosedPlatform: 'prognosedDeparturePlatform',
	reachable: 'reachable',
})

module.exports = {
	createMergeWhen,
	mergeArrival,
	mergeDeparture,
}
