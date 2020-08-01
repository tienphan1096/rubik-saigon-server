require('dotenv').config()
const express = require('express')
const https = require('https')
const fs = require('fs');
const app = express()
const port = 3000

const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const cors = require('cors')
app.use(cors())

const router = require('./routes/index')

app.use(express.static('public'))
app.use('/', router)

if (process.env.NODE_ENV === 'production') {
  const privateKey  = fs.readFileSync('keys/key.pem')
const certificate = fs.readFileSync('keys/cert.pem')
const bundle = fs.readFileSync('keys/bundle.ca-bundle')
  https.createServer({key: privateKey, cert: certificate, ca: bundle}, app).listen(port)
} else {
  app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
}
