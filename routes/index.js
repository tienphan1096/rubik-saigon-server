var express = require('express');
var router = express.Router();
var sharp = require('sharp')

router.get('/scan', function(req, res, next) {
    sharp('public/images/main/20181116_000204.jpg')
    .rotate()
    .resize(445, 445, {
        fit: 'inside'
    })
    .toFile('public/images/thumbnails/20181116_000204_2.jpg', err => {
        console.log(err)
        res.send('respond with a resource');
    })
});

module.exports = router;
