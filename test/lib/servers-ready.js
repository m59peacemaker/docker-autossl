const tryConnect = require('try-net-connect')

const tryConnectAsync = (...args) => new Promise(resolve => {
 tryConnect(...args).on('connected', resolve)
})

const serversReady = () => Promise.all([
  tryConnectAsync({port: 4000, retry: 250}),
  tryConnectAsync({port: 5002, retry: 250})
])

module.exports = serversReady
