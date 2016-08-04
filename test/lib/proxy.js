const http = require('http')
const httpProxy = require('http-proxy')
const isAcmeChallengePath = require('./is-acme-challenge-path')

const onError = (err, req, res) => {
  res.statusCode = 404
  res.end(String(err))
}

// a server that proxies acme challenge requests to port 13135
const ProxyServer = (cb) => {
  const proxy = httpProxy.createProxyServer()

  proxy.on('error', onError)

  const server = http.createServer((req, res) => {
    if (isAcmeChallengePath(req.url) && req.method === 'GET') {
      proxy.web(req, res, {target: 'http://127.0.0.1:13135'})
    } else {
      onError('This server only accepts acme challenge paths.', req, res)
    }
  }).listen(80, () => cb(() => server.close(), server))
}

module.exports = ProxyServer
