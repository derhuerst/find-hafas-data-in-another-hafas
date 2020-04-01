'use strict'

const mergeIds = (key, endpNameA, a, endpNameB, b) => {
	const pluralKey = key + 's'
	const ids = {
		...(a && a[pluralKey] || {}),
		...(b && b[pluralKey] || {})
	}
	if (a && a[key]) ids[endpNameA] = a[key]
	if (b && b[key]) ids[endpNameB] = b[key]
	return ids
}

module.exports = mergeIds
