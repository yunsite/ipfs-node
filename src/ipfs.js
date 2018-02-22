const execFile = require('child_process').execFile
const { getIPNS } = require('./ethereum')
const { isAllowed } = require('./blacklist')

module.exports = class Download {
  constructor () {
    this.download = async (req, res) => {
      try {
        const ipfs = req.params.ipfs
        if (await isAllowed(ipfs)) {
          const data = await Download.get(ipfs)
          return res.json({ok: true, data})
        }
      } catch (error) {
        return res.json({ ok: false, error: error.message })
      }
    }
    this.pin = async (req, res) => {
      try {
        const ipns = await getIPNS(req.params.x, req.params.y)
        if (!ipns) {
          throw new Error('The land has not IPNS associated')
        }
        const connect = await Download.connectToPeer(req.params.peerId)
        let response = false
        if (connect) {
          const ipfs = await Download.resolveIPNS(ipns)
          response = await Download.publishHash(ipfs)
        }
        return res.json({ ok: response })
      } catch (error) {
        return res.json({ ok: false, error: error.message })
      }
    }
    this.resolve = async (req, res) => {
      try {
        const shouldGetDependencies = req.query.dependencies === 'true'
        const url = await Download.getTarget(req.params.ipns, shouldGetDependencies)
        return res.json({ ok: true, url })
      } catch (error) {
        return res.json({ ok: false, error: error.message })
      }
    }
    this.dependencies = async (req, res) => {
      try {
        const ipfs = req.params.ipfs
        if (await isAllowed(ipfs)) {
          const dependencies = await Download.resolveDependencies(ipfs)
          return res.json({ok: true, dependencies})
        }
      } catch (error) {
        console.log(`ERROR: ${error.stack}`)
        return res.json({ ok: false, error: error.message })
      }
    }
  }

  static get (name) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['cat', `/ipfs/${name}`],
        (err, stdout, stderr) => {
          if (err) return reject(stderr)
          return resolve(stdout)
        }
      )
    })
  }

  static publishHash (ipfs) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['pin', 'add', ipfs], (err, stdout, stderr) => {
        if (err) {
          return reject(stderr)
        }
        const match = stdout.match(new RegExp('pinned ([a-zA-Z0-9]+) recursively'))
        if (!match) {
          reject(new Error('Can not pin: ' + ipfs))
        }
        return resolve(true)
      })
    })
  }

  static async getTarget (name, shouldGetDependencies = false) {
    const ipfs = await Download.resolveIPNS(name)
    if (await isAllowed(ipfs)) {
      let dependencies = []
      if (shouldGetDependencies) {
        dependencies = await Download.resolveDependencies(ipfs)
      }
      return new Promise(resolve => resolve({ipfs, dependencies}))
    }
  }

  static resolveIPNS (hash) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['name', 'resolve', '--nocache', hash], (err, stdout, stderr) => {
        if (err) return reject(stderr)
        const ipfs = stdout.substr(6, stdout.length - 7)
        return resolve(ipfs)
      })
    })
  }

  static resolveDependencies (ipfs) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['refs', '-u=true', '-r', ipfs], {maxBuffer: 1024 * 500}, (err, stdout, stderr) => {
        if (err) return reject(stderr)
        const dependencies = stdout.split(/\r?\n/).filter(ipfs => ipfs)
        return resolve(dependencies)
      })
    })
  }

  static connectToPeer (peerId) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['swarm', 'connect', `/p2p-circuit/ipfs/${peerId}`], (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr))
        const match = stdout.match(new RegExp('connect ([a-zA-Z0-9]+) success'))
        if (!match) {
          reject(new Error('Can not connect to: ' + peerId))
        }
        return resolve(true)
      })
    })
  }
}
