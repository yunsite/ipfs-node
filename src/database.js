const Promise = require('bluebird')
const redis = require('redis')

const client = Promise.promisifyAll(redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST))

if (process.env.REDIS_PASSWORD) {
  client.auth(process.env.REDIS_PASSWORD)
}

async function setParcel ({ x, y }, url) {
  await client.setAsync(`${x},${y}`, JSON.stringify(url))
}

async function getParcel (x, y) {
  const url = await client.getAsync(`${x},${y}`)
  return JSON.parse(url)
}

async function setIPFS (ipns, ipfs) {
  await client.setAsync(ipns, ipfs)
}

function getIPFS (ipns) {
  return client.getAsync(ipns)
}

module.exports = {
  setIPFS,
  getIPFS,
  setParcel,
  getParcel
}
