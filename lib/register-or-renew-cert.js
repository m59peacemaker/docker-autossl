const _testPort = require('test-port')
const certCommand = require('./cert-command')
const staticServer = require('./static-server')
const checkPort80ProxiesChallenge = require('./check-port-80-proxies-challenge')
const log = require('./log')

const testPort = (...args) => new Promise(resolve => _testPort(...args, resolve))

const Server = (port, staticDir) => new Promise(resolve => {
  const server = staticServer(staticDir).listen(port, () => resolve(server))
})

const exitUnlessPort80ProxiesChallenge = () => checkPort80ProxiesChallenge()
  .then(does => {
    if (does) {
      return true
    } else {
      log.fatal('The server on port 80 does not proxy the acme challenge to autossl')
      process.exit(1)
    }
  })

const registerOrRenew = ({
  port,
  staticDir,
  domains,
  email,
  development,
  certbotArgs
}) => testPort(80)
  .then(port80Listening => {
    if (!port80Listening) {
      log.info('No server on port 80. Will use cerbot standalone server.')
      return [true, undefined]
    } else {
      log.info('There is a server listening on port 80. Starting static server to handle acme challenge.')
      return Server(port, staticDir)
        .then(server => Promise.all([server, exitUnlessPort80ProxiesChallenge()]))
        .then(([server]) => {
          log.info('Port 80 is proxying acme challenge to challenge static server.')
          return [false, server]
        })
    }
  })
  .then(([standalone, server]) => {
    const promise = certCommand({
      staticDir,
      domains,
      email,
      standalone,
      development,
      certbotArgs
    })
    if (server) {
      promise
        .then(result => {
          server.close()
          return result
        })
        .catch(err => {
          server.close()
          throw err
        })
    }
    return promise
  })

module.exports = registerOrRenew
