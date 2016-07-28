const isAcmeChallengePath = path => new RegExp("^/\.well-known/acme-challenge/([^/]+)$").test(path)

module.exports = isAcmeChallengePath
