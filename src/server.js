const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const IPFS = require('./ipfs')
const { connect } = require('./ethereum')


const app = express()

// Allow other domains to connect, todo, limit to DCL domains
app.use(cors())

// Parse the huge uploads we may get, still 100mb limit
// though since the VM may run out of memory
app.use(bodyParser.json({ limit: '10kb' }))

// IPFS Handler
const ipfs = new IPFS()

app.get('/api/pin/:peerId/:x/:y', ipfs.pin)

app.get('/api/get/:ipfs', ipfs.download)

app.get('/api/resolve/:ipns', ipfs.resolve)

app.get('/api/dependencies/:ipfs', ipfs.dependencies)

app.listen(process.env.PORT || 3000, () => {
  connect()
  console.log('Listening on port 3000...')
})
