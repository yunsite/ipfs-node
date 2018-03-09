require('babel-polyfill')
require('dotenv').config({path: './.env'})
const web3Eth = require('decentraland-commons').eth
const LANDRegistry = require('decentraland-commons/dist/contracts').LANDRegistry

async function connectBlockchain () {
  try {
    await web3Eth.disconnect() // clean if it is a retry
    let connected = await web3Eth.connect({
      contracts: [LANDRegistry]
    })
    if (!connected) {
      throw new Error('Could not connect to the blockchain')
    }
  } catch (e) {
    if (e.message.indexOf('Could not connect to the blockchain') !== -1) {
      console.log('Trying to connect to the blockchain...')
      setTimeout(connectBlockchain, 3000)
    }
  }
}

async function getIPNS (x, y) {
  let ipns
  try {
    const land = web3Eth.getContract('LANDRegistry')
    const metadata = await land.landData(x, y)
    ipns = await LANDRegistry.decodeLandData(metadata).ipns
    return ipns ? ipns.split(':')[1] : 0
  } catch (e) {
    console.log(e.message)
  }
  return ipns
}

module.exports = {
  connectBlockchain,
  getIPNS
}
