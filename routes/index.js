var express = require('express');
var router = express.Router();
var sharp = require('sharp');
var { Puzzle, PuzzleType } = require('../models')
var { Op } = require('sequelize')

var fs = require('fs');
const { resolveNaptr } = require('dns');
const { url } = require('inspector');

router.get('/scan', function(req, res, next) {
    generateThumbnailsForAll()
        .then((msg) => {
            res.send(msg)
        }).catch(err => {
            res.send(err)
        })
});

router.post('/puzzle', async function(req, res, next) {
    Puzzle.create({
        name: req.body.name,
        price: req.body.price,
        type: req.body.type,
        url: await getUniqueUrlFromText(req.body.name)
    }).then(result => {
        res.json(result)
    }).catch(err => {
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
