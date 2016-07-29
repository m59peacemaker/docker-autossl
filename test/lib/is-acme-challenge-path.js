function is (path) {
  return new RegExp("^/\.well-known/acme-challenge/([^/]+)$").test(path)
}

module.exports = is
