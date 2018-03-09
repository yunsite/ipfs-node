const execFile = require('child_process').execFile
const path = require('path')
const fs = require('fs')
const { getIPNS } = require('./ethereum')
const { isHashBlacklisted, isParcelBlacklisted } = require('./blacklist')
const { setParcel, getParcel, setIPFS, getIPFS } = require('./database')
const { getContentType } = require('./utils')
const axios = require('axios')
const request = require('request')

module.exports = class Download {
  constructor () {
    this.download = async (req, res) => {
      try {
        const ipfs = req.params.ipfs
        const file = `${ipfs}/${req.params.file}`
        const blackListed = await isHashBlacklisted(ipfs)
        if (blackListed) {
          throw new Error(`IPFS ${ipfs} is blacklisted`)
        }
        request.get(`http://localhost:8080/ipfs/${file}`).pipe(res)
      } catch (error) {
        return res.json({ ok: false, error: error.message })
      }
    }
    this.pin = async (req, res) => {
      try {
        const [x, y] = [req.params.x, req.params.y]
        const ipns = await getIPNS(x, y)
        if (!ipns) {
          throw new Error('The land has not IPNS associated')
        }
        const connect = await Download.connectToPeer(req.params.peerId)
        let response = false
        if (connect) {
          const url = await Download.getTarget(ipns)
          response = await Download.publishHash(url.ipfs)
          await setIPFS(url.ipns, url.ipfs)
          await setParcel({ x, y }, url)
        }
        return res.json({ ok: response })
      } catch (error) {
        return res.json({ ok: false, error: error.message })
      }
    }
    this.resolve = async (req, res) => {
      try {
        const [x, y] = [req.params.x, req.params.y]
        const blackListed = await isParcelBlacklisted(x, y)
        if (blackListed) {
          throw new Error(`Parcel (${x},${y}) is blacklisted`)
        }

        const cachedResponse = await getParcel(x, y)
        if (cachedResponse && !req.query.force) {
          return res.json({ ok: true, url: cachedResponse })
        }

        const ipns = await getIPNS(x, y)
        if (!ipns) {
          throw new Error('The land has not IPNS associated')
        }
        const url = await Download.getTarget(ipns)
        await setParcel({ x, y }, url)
        return res.json({ ok: true, url })
      } catch (error) {
        return res.json({ ok: false, error: error.message })
      }
    }
    this.dependencies = async (req, res) => {
      try {
        const ipfs = req.params.ipfs
        const blackListed = await isHashBlacklisted(ipfs)
        if (blackListed) {
          throw new Error(`IPFS ${ipfs} is blacklisted`)
        }
        const dependencies = await Download.resolveDependencies(ipfs)
        return res.json({ok: true, dependencies})
      } catch (error) {
        return res.json({ ok: false, error: error.message })
      }
    }
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

  static async getTarget (ipns) {
    let ipfs = ''
    try {
      ipfs = await Download.resolveIPNS(ipns)
      const dependencies = await Download.resolveDependencies(ipfs)
      return new Promise(resolve => resolve({ ipns, ipfs, dependencies }))
    } catch (error) {
      return new Promise((resolve, reject) => reject(error))
    }
  }

  static resolveIPNS (ipns) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['name', 'resolve', '--nocache', ipns], async (err, stdout, stderr) => {
        let ipfs
        if (err) {
          ipfs = await getIPFS(ipns)
          if (!ipfs) {
            return reject(new Error(stderr))
          } else {
            return resolve(ipfs)
          }
        }
        ipfs = stdout.substr(6, stdout.length - 7)
        return resolve(ipfs)
      })
    })
  }

  static resolveDependencies (ipfs) {
    return new Promise((resolve, reject) => {
      execFile('ipfs', ['refs', '-r', '--format=\'<src> <dst> <linkname>\'', ipfs], {maxBuffer: 1024 * 500}, (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr))
        const dependencies = stdout.split(/\r?\n/).filter(row => row).map(row => {
          const data = row.replace(/\s+/g, ' ').trim().split(' ') // row format: src | ipfsHash | name
          return {
            src: data[0],
            ipfs: data[1],
            name: data[2]
          }
        })
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
