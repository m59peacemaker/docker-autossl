const test        = require('tape')
const _spawn     = require('child_process').spawn
const http        = require('http')
const fs          = require('fs-extra')
const {watch}     = require('chokidar')
const _tryConnect = require('try-net-connect')
const {parseCert} = require('x509')
const Proxy       = require('./lib/proxy')
const pkg         = require('../package.json')
const image       = 'pmkr/autossl:' + pkg.version

const spawn = (command, args, options = {}) => {
  options.stdio = 'inherit' // makes processes loud
  return _spawn(command, args, options)
}

const tryConnect = (...args) => new Promise(resolve => {
  _tryConnect(...args).on('connected', resolve)
})

const EMAIL = "johnnyhauser@gmail.com"
const tmpDir = '/tmp/autossl'
const certPath = tmpDir + '/live/m59.us/fullchain.pem'

const run = (args = [], command = []) => spawn('docker', [
  'run',
  '--rm',
  '--net=host',
  '-e', 'EMAIL='+EMAIL,
  '-e', 'DEVELOPMENT=true',
  '-v', tmpDir + ':/etc/letsencrypt',
  ...args,
  image, ...command
])

const resetState = () => fs.emptyDirSync(tmpDir)

resetState()

tryConnect({port: 4000, retry: 250}).then(() => {
  test('gets a single name cert', t => {
    t.plan(1)
    Proxy(close => {
      run([
        '-e', 'DOMAINS=m59.us',
        '-e', 'AUTO=false'
      ])
        .on('close', () => {
          const cert = parseCert(certPath)
          resetState()
          close()
          t.equal(cert.subject.commonName, 'm59.us')
        })
    })
  })

  test('gets a multiple name cert', t => {
    t.plan(1)
    const domains = ['m59.us', 'www.m59.us', 'dev.m59.us']
    Proxy(close => {
      run([
        '-e', 'DOMAINS='+domains.join(','),
        '-e', 'AUTO=false'
      ])
        .on('close', () => {
          const cert = parseCert(certPath)
          resetState()
          close()
          t.deepEqual(cert.altNames.sort(), domains.sort())
        })
    })
  })

  test('expands cert if new alt names are added', t => {
    t.plan(1)
    const fn = (domains) => run([
      '-e', 'DOMAINS=' + domains,
      '-e', 'AUTO=false'
    ])
    Proxy(close => {
      fn('m59.us').on('close', () => {
        const stats = fs.statSync(certPath)
        fn('m59.us,www.m59.us').on('close', () => {
          const newStats = fs.statSync(certPath)
          resetState()
          close()
          t.notDeepEqual(newStats, stats, 'cert has changed after adding an alt name')
        })
      })
    })
  })


  test('works without a port 80 server already running', t => {
    t.plan(1)
    run([
      '-e', 'DOMAINS=m59.us',
      '-e', 'AUTO=false'
    ])
      .on('close', () => {
        try {
          const cert = parseCert(certPath)
          resetState()
          t.equal(cert.subject.commonName, 'm59.us')
        } catch(err) {
          t.fail(err)
        }
      })
  })

  test('exits if server on port 80 does not proxy acme challenge to 13135', t => {
    t.plan(1)
    const server = http.createServer((req, res) => res.end()).listen(80, () => {
      run([
        '-e', 'DOMAINS=m59.us',
      ])
        .on('close', exitCode => {
          server.close()
          t.equal(exitCode, 1)
        })
    })
  })

  test('can renew cert', t => {
    t.plan(1)
    const fn = (cmd) => run([
      '-e', 'DOMAINS=m59.us',
      '-e', 'AUTO=false'
    ], cmd)
    Proxy(close => {
      fn().on('close', () => {
        const stats = fs.statSync(certPath)
        fn(['startup', '--force-renew']).on('close', () => {
          // --force-renew argument is the best I can come up with to test renewal
          // pretend that force-renew isn't here, and the cert is actually old
          // force-renew makes the command treat the cert like it is old enough for renew
          const newStats = fs.statSync(certPath)
          resetState()
          close()
          t.notDeepEqual(newStats, stats, 'cert has changed after trying to renew')
        })
      })
    })
  })


  test('does not renew on startup if cert is not close to expiration', t => {
    t.plan(1)
    const fn = () => run([
      '-e', 'DOMAINS=m59.us',
      '-e', 'AUTO=false'
    ])
    Proxy(close => {
      // get a cert
      fn().on('close', () => {
        const stats = fs.statSync(certPath)
        // start again
        fn().on('close', () => {
          const newStats = fs.statSync(certPath)
          resetState()
          close()
          t.deepEqual(newStats, stats, 'cert was unchanged')
        })
      })
    })
  })

  test('auto renews', t => {
    t.plan(4)
    // will register the cert, then renew every $delay seconds
    const delay = 15
    const delayMs = delay * 1000
    const leewayMs = 6000
    Proxy(close => {
      const watcher = watch(tmpDir, {ignoreInitial: true})
        .on('ready', () => {
          const p = run([
            '-e', 'DOMAINS=m59.us',
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
                close()
                p.kill()
              }
            }
          })
        })
    })
  })
})
