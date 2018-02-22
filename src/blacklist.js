const axios = require('axios')

async function isAllowed (ipfs) {
  const allowed = await
    axios.get(`${process.env.BLACKLIST_URL}blacklist/${ipfs}`)
    .then(res => res)

  if (!allowed) {
    throw new Error(`IPFS hash: ${ipfs} is blacklisted`)
  }
  return allowed
}

module.exports = {
  isAllowed
}
