const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.get('/a', (req, res) => {
  res.send('Hello Amenée!')
})
app.get('/ip', (req, res) => {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  res.send('requestIP: ' + req.headers['x-forwarded-for'] + " - " + req.socket.remoteAddress)
  console.log('new user' + ip)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
