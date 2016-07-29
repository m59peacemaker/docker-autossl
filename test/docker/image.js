const test = require('tape')
const {spawn: _spawn} = require('child_process')
const fs = require('fs')
const pkg = require('../package.json')
const image = 'pmkr/autossl:' + pkg.version
const serversReady = require('./lib/servers-ready')

const spawn = (command, args, options = {}) => {
  options.stdio = 'inherit' // makes docker processes loud
  return _spawn(command, args, options)
}

const EMAIL = "johnnyhauser@gmail.com"

const run = (...args) => spawn('docker', [
  'run',
  '--rm',
  '--net=host',
  '-e', 'EMAIL='+EMAIL,
  ...args,
  image
])

serversReady().then(() => {
/*  test('gets a single name certificate', t => {
    t.plan(1)
    run('-e', 'DOMAINS=m59.us').on('close', exitCode => t.equal(exitCode, 0))
  })

  test('gets a single name cert, does not renew on startup if cert is not close to expiration', t => {
    t.plan(2)
    const fn = () => run('-e', 'DOMAINS=m59.us')
    fn.on('close', exitCode => {
      t.equal(exitCode, 0)
      fn().on('close', 
    })
  })*/
})
