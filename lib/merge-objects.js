'use strict'

const pickBy = require('lodash/pickBy')
const {deepStrictEqual} = require('assert')

const notNullNotUndef = val => val !== null && val !== undefined

const mergeObjects = (a, b) => {
	return {
		...b,
		...pickBy(a, notNullNotUndef),
	}
}

deepStrictEqual(
	mergeObjects(
		{bar: null, baz: 3},
		{foo: null, bar: 1, baz: 2},
	),
	{foo: null, bar: 1, baz: 3},
)

module.exports = mergeObjects
