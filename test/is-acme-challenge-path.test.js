const test = require('tape')
const isAcmeChallengePath = require('./lib/is-acme-challenge-path')

test('isAcmeChallengePath returns true for challenge path', t => {
  t.plan(1)
  t.true(isAcmeChallengePath('/.well-known/acme-challenge/LeqVUYNf2d9mVVOKIt-jTlDfsvmNmw0F5-vywWeA_1w'))
})

test('isAcmeChallengePath is case-sensitive', t => {
  t.plan(1)
  t.false(isAcmeChallengePath('/.well-knowN/acme-challenge/LeqVUYNf2d9mVVOKIt-jTlDfsvmNmw0F5-vywWeA_1w'))
})

test('isAcmeChallengePath returns false for not challenge path', t => {
  t.plan(1)
  t.false(isAcmeChallengePath('/.bleh'))
})

test('isAcmeChallengePath returns false for almost challenge path (lacking id fragment)', t => {
  t.plan(1)
  t.false(isAcmeChallengePath('/.well-known/acme-challenge/'))
})


