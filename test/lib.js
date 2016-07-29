const test = require('tape')
const serversReady = require('./lib/servers-ready')
const registerCert = require('../lib/register-cert')
const staticServer = require('../lib/static-server')
const tmpDir = '/tmp/autossl'
const email = 'johnnyhauser@gmail.com'

serversReady().then(() => {
  test('register-cert gets a single name cert', t => {
    const server = staticServer(tmpDir).listen(13135, () => {
      registerCert({
        staticDir: tmpDir,
        staging: true,
        domains: ['m59.us'],
        email
      }).then(t.pass).catch(t.fail).then(() => server.close() && t.end())
    })
  })
})
