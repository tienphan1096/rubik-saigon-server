var express = require('express');
var router = express.Router();
var sharp = require('sharp');

var fs = require('fs');
const { resolve } = require('path');

router.get('/scan', function(req, res, next) {
    generateThumbnailsForAll()
        .then((msg) => {
            res.send(msg)
        }).catch(err => {
            res.send(err)
        })
});

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
