const {readFileSync} = require('fs')
const {safeLoad} = require('js-yaml')
const reload = require('require-reload')(require)

const findMap = (arr, cb, criteria = v => v) => {
  let result = undefined
  arr.find(item => {
    result = cb(item)
    return criteria(result)
  })
  return result
}

const tryFn = fn => {
  try { return fn() }
  catch(err) {}
}

const tryRequire = path => tryFn(() => reload(path))

// try to find a data file
// priority: .js, .yaml, .json
const loadData = () => {
  return findMap([
    () => tryRequire('/nginx/data.js'),
    () => {
      const doc = tryFn(() => readFileSync('/nginx/data.yaml', 'utf8'))
      // we want this to throw when the file exists but is invalid
      return doc && safeLoad(doc)
    },
    () => tryRequire('/nginx/data.json')
  ], fn => fn()) || {}
}

module.exports = loadData
