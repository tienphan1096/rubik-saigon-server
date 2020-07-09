const express = require('express')
const app = express()
const port = 3000

var router = require('./routes/index')

app.use(express.static('public'))
app.use('/', router)

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))