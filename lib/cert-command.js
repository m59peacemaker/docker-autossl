const {exec} = require('child_process')

const certCommand = (
  {
    domains,
    email,
    configDir,
    staticDir,
    development = false,
    certbotArgs
  },
  cb
) => {
  return new Promise((resolve, reject) => {
    let args = [
      ' certonly',

      // without non-interactive, running this command when a cert is not near expiry will lead to a prompt rather than doing nothing
      '--non-interactive',

      // add new domains to existing if available
      '--expand',
      '-a', 'webroot',
      '--webroot-path', staticDir,
      '--agree-tos',
      '--email', email,
      '-d', domains.join(' -d ')
    ]
    if (development) {
      args = args.concat([
        '--server', 'http://127.0.0.1:4000/directory',
        '--tls-sni-01-port', '5001'
      ])
    }
    if (certbotArgs) {
      args = args.concat(certbotArgs)
    }
    return exec(
      'certbot' + args.join(' '),
      (err, result) => err ? reject(err) : resolve(result)
    )
  })
}

module.exports = certCommand
