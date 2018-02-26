const axios = require('axios')

async function isBlacklisted (ipfs) {
  return axios.get(`${process.env.BLACKLIST_URL}blacklist/${ipfs}`)
    .then(res => res.data)
}

module.exports = {
  isBlacklisted
}
