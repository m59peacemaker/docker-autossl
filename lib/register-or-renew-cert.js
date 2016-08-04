const _testPort = require('test-port')
const certCommand = require('./cert-command')
const staticServer = require('./static-server')
const checkPort80ProxiesChallenge = require('./check-port-80-proxies-challenge')

const testPort = (...args) => new Promise(resolve => _testPort(...args, resolve))

const Server = (port, staticDir) => new Promise(resolve => {
  const server = staticServer(staticDir).listen(port, () => resolve(server))
})

const exitUnlessPort80ProxiesChallenge = () => checkPort80ProxiesChallenge()
  .then(does => does || process.exit(1))

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
      // no server on port 80, use certbot standalone
      return [true, undefined]
    } else {
      // there is a server on port 80, start static server for challenge
      return Server(port, staticDir)
        // check that the server on port 80 proxies challenge request to challenge static server
        // exit if it doesn't
        .then(server => Promise.all([server, exitUnlessPort80ProxiesChallenge()]))
        // port 80 is proxying to challenge static server as expected
        .then(([server]) => [false, server])
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
