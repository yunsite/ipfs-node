const axios = require('axios')

async function isBlacklisted (ipfs) {
  return process.env.BLACKLIST_URL ? axios.get(`${process.env.BLACKLIST_URL}blacklist/${ipfs}`)
    .then(res => res.data) : false
}

module.exports = {
  isBlacklisted
}
