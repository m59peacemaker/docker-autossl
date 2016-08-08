const http = require('http')
const serveStatic = require('serve-static')
const mkdirp = require('mkdirp')

const defaultMessage = 'pmkr/autossl: challenge not found'

const Server = (path) => {
  mkdirp.sync(path)
  const serve = serveStatic(path)
  return http.createServer((req, res) => {
    serve(req, res, () => {
      res.statusCode = 404
      res.end(defaultMessage)
    })
  })
}

Server.defaultMessage = defaultMessage

module.exports = Server
