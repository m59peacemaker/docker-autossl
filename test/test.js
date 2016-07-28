const test = require('tape')
const {spawn: _spawn} = require('child_process')
const fs = require('fs')
const tryConnect = require('try-net-connect')
const http = require('http')
const httpProxy = require('http-proxy')
const pkg = require('../package.json')
const image = 'pmkr/autossl:' + pkg.version
const isAcmeChallengePath = require('./lib/is-acme-challenge-path')

const spawn = (command, args, options = {}) => {
  options.stdio = 'inherit' // makes docker processes loud
  return _spawn(command, args, options)
}

const tryConnectAsync = (...args) => new Promise(resolve => {
 tryConnect(...args).on('connected', resolve)
})

const startProxyServer = () => {
  return new Promise(resolve => {
    const proxy = httpProxy.createProxyServer()
    const server =  http.createServer((req, res) => {
      if (isAcmeChallengePath(req.url)) {
        proxy.web(req, res, {target: 'http://127.0.0.1:13135'})
      } else {
        res.statusCode = 404
        res.end()
      }
    }, resolve)
    process.on('exit', () => {
      server.close()
      proxy.close()
    })
  })
}

const EMAIL = "johnnyhauser@gmail.com"

Promise.all([
  tryConnectAsync({port: 4000, retry: 250}),
  startProxyServer()
]).then(() => {
  test('gets a single name certificate', t => {
    const p = spawn('docker', [
      'run',
      '--rm',
      '--net=host',
      '-e', 'EMAIL='+EMAIL,
      '-e', 'DOMAINS=m59.us',
      //'-v', '/tmp/letsencrypt:/etc/letsencrypt',
      image
    ])
      .on('close', () => t.end())
    p.on('end', (data) => {

    })
  })
})

const caServer = spawn('./start-ca-server.sh', {cwd: __dirname})
process.on('exit', () => caServer.kill())
