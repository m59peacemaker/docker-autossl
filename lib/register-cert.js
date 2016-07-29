const {exec} = require('child_process')

module.exports = (
  {
    domains,
    email,
    configDir,
    staticDir,
    staging = false
  },
  cb
) => {
  return new Promise((resolve, reject) => {
    let args = [
      ' certonly',
      '--non-interactive',
      '--expand' // add new domains to existing if available
    ]
    if (staging) {
      args = args.concat([
        '--server', 'http://127.0.0.1:4000/directory',
        '--tls-sni-01-port', '5001'
      ])
    }
    if (configDir) {
      args = args.concat(['--config-dir', configDir])
    }
    args = args.concat([
      '-a', 'webroot',
      '--webroot-path', staticDir,
      '--agree-tos',
      '--email', email,
      '-d', domains.join(' -d ')
    ])
    return exec(
      'certbot' + args.join(' '),
      (err, result) => err ? reject(err) : resolve(result)
    )
  })
}
