const http = require('http')
const staticServer = require('./static-server')

const checkPort80ProxiesChallenge = () => new Promise(resolve => {
  http.request({
    host: '127.0.0.1',
    path: '/.well-known/acme-challenge/this-does-not-exist'
  }, res => {
    let result = ''
    res.on('data', chunk => (result += chunk))
    res.on('end', () => {
      if (res.statusCode === 404 && result === staticServer.defaultMessage) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  }).end()
})

module.exports = checkPort80ProxiesChallenge
