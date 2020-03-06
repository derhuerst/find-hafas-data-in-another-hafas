'use strict'

const createMatchByLineName = (srcNameA, normalizeLineNameA, srcNameB, normalizeLineNameB) => {
	const matchByLineName = (lineA, lineB) => {
		const nameA = normalizeLineNameA(lineA.name, lineA)
		const nameB = normalizeLineNameB(lineB.name, lineB)
		const addNameA = lineA.additionalName
			? normalizeLineNameA(lineA.additionalName, lineA)
			: null
		const addNameB = lineB.additionalName
			? normalizeLineNameB(lineB.additionalName, lineB)
			: null
		return [
			[nameA, nameB],
			addNameA ? [addNameA, nameB] : [NaN, NaN],
			addNameB ? [addNameB, nameA] : [NaN, NaN],
			addNameA && addNameB ? [addNameA, addNameB] : [NaN, NaN]
		].some(([a, b]) => a === b)
	}

	return matchByLineName
}

module.exports = createMatchByLineName
