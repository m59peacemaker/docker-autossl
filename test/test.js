const test = require('tape')
const _spawn = require('child_process').spawn
const fs = require('fs')
const tryConnect = require('try-net-connect')
const pkg = require('../package.json')
const image = 'pmkr/autossl:' + pkg.version

const spawn = (command, args, options = {}) => {
  options.stdio = 'inherit' // makes docker processes loud
  return _spawn(command, args, options)
}

test('starts nginx', t => {
  const p = spawn('docker', ['run', '--rm', '--net=host', image])
    .on('close', () => t.end())
  p.stdout.on('data', (data) => {

  })
})
