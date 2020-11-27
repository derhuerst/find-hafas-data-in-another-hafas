'use strict'

const createMergeId = (preferB = false) => (idA, idB) => {
	if (idB !== null && idB !== undefined && preferB) return idB
	if (idA !== null && idA !== undefined && !preferB) return idA
	return preferB ? idA : idB
}

module.exports = createMergeId
