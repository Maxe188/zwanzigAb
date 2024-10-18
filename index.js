const express = require('express')
const { createServer } = require('node:http')

const app = express()
const server = createServer(app)
const port = process.env.PORT || 3000

app.set('trust proxy', true)

app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.get('/a', (req, res) => {
  res.send('Hello Amenee!')
})
app.get('/ip', (req, res) => {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  res.send('requestIP: ' + req.headers['x-forwarded-for'] + " - " + req.socket.remoteAddress + " - " + req.ip + " - " + req.ips)
  console.log('new user: ' + ip.split(',')[0])
})

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
