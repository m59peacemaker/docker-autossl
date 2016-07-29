function tryCatch (tryFn, catchFn) {
  try {
    return tryFn()
  } catch(err) {
    return catchFn(err)
  }
}

module.exports = tryCatch
