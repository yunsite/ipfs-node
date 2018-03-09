const axios = require('axios')

async function isHashBlacklisted (ipfs) {
  return process.env.BLACKLIST_URL ? axios.get(`${process.env.BLACKLIST_URL}blacklist/${ipfs}`)
    .then(res => res.data) : false
}

async function isParcelBlacklisted (x, y) {
  return process.env.BLACKLIST_URL ? axios.get(`${process.env.BLACKLIST_URL}blacklist/${x}/${y}`)
  .then(res => res.data) : false
}

module.exports = {
  isHashBlacklisted,
  isParcelBlacklisted
}
