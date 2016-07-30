const test = require('tape')
const {spawn: _spawn} = require('child_process')
const fs = require('fs-extra')
const {watch} = require('chokidar')
const pkg = require('../package.json')
const image = 'pmkr/autossl:' + pkg.version
const serversReady = require('./lib/servers-ready')
const {parseCert} = require('x509')

const spawn = (command, args, options = {}) => {
  options.stdio = 'inherit' // makes docker processes loud
  return _spawn(command, args, options)
}

const EMAIL = "johnnyhauser@gmail.com"

const run = (args = [], command = []) => spawn('docker', [
  'run',
  '--rm',
  '--net=host',
  '-e', 'EMAIL='+EMAIL,
  '-e', 'DEVELOPMENT=true',
  ...args,
  image, ...command
])

const tmpDir = '/tmp/autossl'
const certPath = tmpDir + '/live/m59.us/fullchain.pem'

const resetState = () => fs.emptyDirSync(tmpDir)

resetState()

serversReady().then(() => {
  test('gets a single name cert', t => {
    t.plan(1)
    run(['-e', 'DOMAINS=m59.us', '-e', 'AUTO=false'])
      .on('close', exitCode => t.equal(exitCode, 0, 'exited without error'))
  })

  test('gets a multiple name cert', t => {
    t.plan(1)
    const domains = ['m59.us', 'www.m59.us', 'dev.m59.us']
    run([
      '-e', 'DOMAINS='+domains.join(','),
      '-e', 'AUTO=false',
      '-v', tmpDir + ':/etc/letsencrypt'
    ])
      .on('close', () => {
        const cert = parseCert(certPath)
        resetState()
        t.deepEqual(cert.altNames.sort(), domains.sort())
      })
  })

  test('expands cert if new alt names are added', t => {
    t.plan(1)
    const fn = (domains) => run([
      '-e', 'DOMAINS=' + domains,
      '-e', 'AUTO=false',
      '-v', tmpDir + ':/etc/letsencrypt',
    ])
    fn('m59.us').on('close', () => {
      const stats = fs.statSync(certPath)
      fn('m59.us,www.m59.us').on('close', () => {
        const newStats = fs.statSync(certPath)
        resetState()
        t.notDeepEqual(newStats, stats, 'cert has changed after adding an alt name')
      })
    })
  })

  test('can renew cert', t => {
    t.plan(1)
    const fn = (cmd) => run([
      '-e', 'DOMAINS=m59.us',
      '-e', 'AUTO=false',
      '-v', tmpDir + ':/etc/letsencrypt',
    ], cmd)
    fn().on('close', () => {
      const stats = fs.statSync(certPath)
      fn(['startup', '--force-renew']).on('close', () => {
        // --force-renew argument is the best I can come up with to test renewal
        // pretend that force-renew isn't here, and the cert is actually old
        // force-renew makes the command treat the cert like it is old enough for renew
        const newStats = fs.statSync(certPath)
        resetState()
        t.notDeepEqual(newStats, stats, 'cert has changed after trying to renew')
      })
    })
  })


  test('does not renew on startup if cert is not close to expiration', t => {
    t.plan(1)
    const fn = () => run([
      '-e', 'DOMAINS=m59.us',
      '-e', 'AUTO=false',
      '-v', tmpDir + ':/etc/letsencrypt'
    ])
    // get a cert
    fn().on('close', () => {
      const stats = fs.statSync(certPath)
      // start again
      fn().on('close', () => {
        const newStats = fs.statSync(certPath)
        resetState()
        t.deepEqual(newStats, stats, 'cert was unchanged')
      })
    })
  })

  test('auto renews', t => {
    t.plan(4)
    // will register the cert, then renew every $delay seconds
    const delay = 15
    const delayMs = delay * 1000
    const leewayMs = 5000
    const watcher = watch(tmpDir, {ignoreInitial: true})
      .on('ready', () => {
        const p = run([
          '-e', 'DOMAINS=m59.us',
          '-v', tmpDir + ':/etc/letsencrypt',
          '-e', `CRON_PATTERN=*/${delay} * * * * *`
        ], ['startup', '--force-renew'])
        let lastTime = undefined
        watcher.on('change', (path, stats) => {
          if (path === certPath) {
            if (!lastTime) {
              lastTime = new Date().getTime()
              return
            }
            const time = new Date().getTime()
            const minTime = lastTime + delayMs - leewayMs
            const maxTime = lastTime + delayMs + leewayMs
            t.true(time >= minTime, 'enough time has passed')
            t.true(time < maxTime, 'not too much time has passed')
            lastTime = time
            if (t.assertCount === 4) {
              watcher.close()
              p.kill()
            }
          }
        })
      })
  })
})
