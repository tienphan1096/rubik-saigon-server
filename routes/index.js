const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const jwt = require('jsonwebtoken');
const { Puzzle, PuzzleType, User } = require('../models')
const { Op } = require('sequelize')
const fs = require('fs');
const multer  = require('multer')
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images/main/')
    },
    filename: (req, file, cb) => {
        // TODO: check if filename already exists.
        cb(null, file.originalname)
    }
})
var upload = multer({ storage })

const OAuth2Server = require('oauth2-server');
const Request = OAuth2Server.Request;
const Response = OAuth2Server.Response;
const oauth = new OAuth2Server({
  model: {
    generateAccessToken(client, user) {
        return jwt.sign({user: user.username}, process.env.JWT_SECRET, { expiresIn: '10h' })
    },
    getAccessToken(accessToken) {
        // if token expired, an error will be thrown here and propagated up.
        let decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
        return {
            token: accessToken,
            accessTokenExpiresAt: new Date(decoded.exp * 1000),
            user: {
                username: decoded.username
            }
        }
    },
    getClient(clientId, clientSecret) {
        if (clientId === process.env.APP_CLIENT_ID && clientSecret === process.env.APP_CLIENT_SECRET)
        return {
            id: process.env.APP_CLIENT_ID,
            clientSecret: process.env.APP_CLIENT_SECRET,
            grants: ['password']
        }
    },
    async getUser(username, password) {
        let user = await User.findOne({
            where: { username }
        })
        if (!user) {
            return false
        }
        let match = await bcrypt.compare(password, user.password)
        if (match) {
            return {
                username: user.username
            }
        } else {
            return false
        }
    },
    saveToken(token, client, user) {
        token.user = {
            username: user.username
        }
        token.client = {
            id: client.id
        }
        return token
    },
  }
});

router.post('/login', (req, res, next) => {
    var request = new Request(req)
    var response = new Response(res)
    oauth.token(request, response)
        .then(function(token) {
            res.json(token);
        }).catch(function(err) {
            res.status(err.code || 500).json(err);
        });
})

router.get('/scan', function(req, res, next) {
    generateThumbnailsForAll()
        .then((msg) => {
            res.send(msg)
        }).catch(err => {
            res.send(err)
        })
});

router.get('/puzzles', (req, res, next) => {
    Puzzle.findAll().then(results => {
        results.forEach(puzzle => {
            puzzle.setDataValue('thumbnail', `/images/thumbnails/${puzzle.image}`)
        })
        res.json(results)
    })
})

router.post('/puzzle',
    (req, res, next) => {
        var request = new Request(req)
        var response = new Response(res)
        oauth.authenticate(request, response)
            .then(token => {
                next()
            })
            .catch(err => {
                res.status(err.code || 500).json(err)
            })
    },
    upload.single('image'), async function(req, res, next) {
        if (req.file && req.file.originalname) {
            generateThumbnail(req.file.originalname)
        }
        Puzzle.create({
            name: req.body.name,
            price: req.body.price,
            type: req.body.type,
            image: req.file ? req.file.originalname : null,
            url: await getUniqueUrlFromText(req.body.name)
        }).then(result => {
            res.json(result)
        }).catch(err => {
            console.log(err)
            res.json({
                err: 'Error adding new item.'
            })
        })
    })

router.get('/puzzle-types', function(req, res, next) {
    PuzzleType.findAll().then(results => res.json(results))
})

async function getUniqueUrlFromText(str) {
    let url = normalizeTextForUrl(str)
    let puzzles = await Puzzle.findAll({
        where: {
            url: {
                [Op.like]: `${url}%`
            }
        }
    })
    if (puzzles.length > 0) {
        url = `${url}-${findMaxUrlNumber(puzzles.map(puzzle => puzzle.url))+1}`
    }
    return url
}

function findMaxUrlNumber(urls) {
    let max = 0;
    urls.forEach(url => {
        let number = url.substr(url.lastIndexOf('-') + 1)
        if (isNaN(number)) {
            return
        }
       if (parseInt(number) > max) {
            max  = parseInt(number)
        }
    })
    return max
}

function normalizeTextForUrl(str) {
    let toReturn = normalizeText(str)
    toReturn = toReturn.replace(/\s+/g, '-').toLowerCase()
    return toReturn
}

function normalizeText(str) {
    let toReturn = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    // TODO: normalize Vietnamese 'd' as well.
    return toReturn
}

function readdirSyncIgnoreHiddenFiles(folder) {
    let toReturn = fs.readdirSync(folder)
    return toReturn.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item))
}

function generateThumbnailsForAll() {
    let originals = readdirSyncIgnoreHiddenFiles('public/images/main')
    let currentThumbnails = readdirSyncIgnoreHiddenFiles('public/images/thumbnails')
    let toBeProcessed = originals.filter(filename => !currentThumbnails.includes(filename))
    let promises = []
    toBeProcessed.forEach(filename => {
        promises.push(generateThumbnail(filename))
    })

    return new Promise((resolve, reject) => {
        if (toBeProcessed.length === 0) {
            resolve('No thumbnails to be processed.')
            return
        }

        Promise.allSettled(promises)
        .then((results) => {
            console.log(results)
            let fulfilled = results.filter(result => result.status === 'fulfilled')
            let rejected = results.filter(result => result.status === 'rejected')
            if (rejected.length === 0) {
                resolve(`${fulfilled.length} thumbnails generated.`)
            } else {
                reject(`Failed to generate ${rejected.length} thumbnails, ${fulfilled.length} were generated.`)
            }
        })
    })
}

async function generateThumbnail(filename) {
    let img = sharp(`public/images/main/${filename}`)

    let metadata = await img.metadata()
    if (metadata.format === 'jpeg') {
        img.jpeg({ quality: 100 })
    }
    
    await img.rotate().resize(445, 445, { fit: 'inside' })
        .toFile(`public/images/thumbnails/${filename}`)
}

module.exports = router;
