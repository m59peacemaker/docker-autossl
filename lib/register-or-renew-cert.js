const certCommand = require('./cert-command')
const staticServer = require('./static-server')

const registerOrRenew = (
  {
    port,
    staticDir,
    domains,
    email,
    development,
    certbotArgs
  }
) => new Promise(resolve => {
  const server = staticServer(staticDir).listen(port, () => resolve(server))
}).then(server => {
  return certCommand({
      staticDir,
      domains,
      email,
      development,
      certbotArgs
    })
      .then(result => {
        server.close()
        return result
      })
      .catch(err => {
        server.close()
        throw err
      })
  })


module.exports = registerOrRenew
