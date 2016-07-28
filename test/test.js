const test = require('tape')
const {spawn: _spawn} = require('child_process')
const fs = require('fs')
const tryConnect = require('try-net-connect')
const pkg = require('../package.json')
const image = 'pmkr/autossl:' + pkg.version

const spawn = (command, args, options = {}) => {
  options.stdio = 'inherit' // makes docker processes loud
  return _spawn(command, args, options)
}

const tryConnectAsync = (...args) => new Promise(resolve => {
 tryConnect(...args).on('connected', resolve)
})

const serversReady = () => Promise.all([
  tryConnectAsync({port: 4000, retry: 250}),
  tryConnectAsync({port: 5002, retry: 250})
])

const EMAIL = "johnnyhauser@gmail.com"

serversReady().then(() => {
  test('gets a single name certificate', t => {
    t.plan(1)
    // make this a function, next test can use it to get a cert to /tmp/whatever on the host, then bind it on another container that acts when there's already a cert
    spawn('docker', [
      'run',
      '--rm',
      '--net=host',
      '-e', 'EMAIL='+EMAIL,
      '-e', 'DOMAINS=m59.us',
      image
    ])
      .on('close', exitCode => t.equal(exitCode, 0))
  })
})

// --expand option?
