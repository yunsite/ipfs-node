const sqlite = require('sqlite')

module.exports = (() => {
  let db
  async function connectDB () {
    db = await sqlite.open('db/ipfs.db', { Promise, cached: true })
    db.run(`
      CREATE TABLE IF NOT EXISTS dht (
        ipns TEXT NOT NULL PRIMARY KEY, 
        ipfs TEXT NOT NULL
      )`
    )
  }

  async function getIPFS (ipns) {
    const query = await db.prepare('SELECT ipfs FROM dht WHERE ipns = ?')
    const ipfs = await query.run([ipns])
    return ipfs[0] ? ipfs[0].ipfs : null
  }

  async function saveIPFS (ipns, ipfs) {
    const query = await db.prepare(`
      INSERT OR REPLACE INTO dht (ipns, ipfs) 
      VALUES (?,  ?)`)
    await query.run([ipns, ipfs])
  }

  return {
    connectDB,
    saveIPFS,
    getIPFS
  }
})()
