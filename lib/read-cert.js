const tryCatch = require('./try-catch')

function getAllCertPaths () {
  const leDir = '/etc/letsencrypt/live'
  try {
    return fs.readdirSync(leDir).map(dir => ({full: path.join(leDir, dir), dir}))
  } catch (err) {
    return []
  }
}

function findCertsByCommonName (name) {
  return getAllCertPaths()
    .filter(({full, dir}) => new RegExp('^' + name).test(dir))
    .map(({full}) => full)
}

function readCert (domains) {
  const certNames = {common: domains[0], alt: domains}
  const matchingCertPaths = findCertsByCommonName(certNames.common)
  const matchingCerts = matchingCertPaths.map(certDir => parseCert(path.join(certDir, 'fullchain.pem')))
  return matchingCerts.filter(cert => deepEqual(certNames, {
    common: cert.commonName,
    alt: cert.altNames
  }))
}

module.exports = readCert
