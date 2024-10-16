const express = require('express')
const app = express()
const port = 3000

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
app.get('/header', (req, res) => {
  res.send('header: ' + req.header.toString())
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
