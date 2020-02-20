'use strict'

const createMatch = (srcNameA, normalizeLineNameA, srcNameB, normalizeLineNameB) => {
	const matchLineName = (lineA, lineB) => {
		const nameA = normalizeLineNameA(lineA.name)
		const nameB = normalizeLineNameB(lineB.name)
		const addNameA = lineA.additionalName ? normalizeLineNameA(lineA.additionalName) : null
		const addNameB = lineB.additionalName ? normalizeLineNameB(lineB.additionalName) : null
		return [
			[nameA, nameB],
			addNameA ? [addNameA, nameB] : [NaN, NaN],
			addNameB ? [addNameB, nameA] : [NaN, NaN],
			addNameA && addNameB ? [addNameA, addNameB] : [NaN, NaN]
		].some(([a, b]) => a === b)
	}

	return matchLineName
}

module.exports = createMatch
