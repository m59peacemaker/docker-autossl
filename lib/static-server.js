const http         = require('http')
const serveStatic  = require('serve-static')
const finalhandler = require('finalhandler')
const mkdirp       = require('mkdirp')

const Server = (path) => {
  mkdirp.sync(path)
  const serve = serveStatic(path)
  return http.createServer((req, res) => {
    serve(req, res, finalhandler(req, res))
  })
}

module.exports = Server
