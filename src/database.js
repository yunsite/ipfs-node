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

    /* db.run(`INSERT INTO dht(ipns, ipfs) VALUES(?, ?)`, ['1231231231212312312', 'aaaaaaaaaaaaaa'], (err) => {
      if (err) {
        return console.log(err.message)
      }
      // get the last insert id
      console.log(`A row has been inserted with rowid ${this.lastID}`)
    }) */
  }

  async function getIPFS (ipns) {
    const ipfs = await db.all(`SELECT ipfs FROM dht WHERE ipns = '${ipns}'`)
    return ipfs[0]
  }

  async function saveIPFS (ipns, ipfs) {
    await db.run(`
      INSERT OR REPLACE INTO dht (ipns, ipfs) 
      VALUES ('${ipns}',  '${ipfs}')`
    )
  }

  return {
    connectDB,
    saveIPFS,
    getIPFS
  }
})()
