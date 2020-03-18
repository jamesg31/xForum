const express = require('express');

const mainController = require('../controllers/main');
const isAuth = require('../middleware/auth/is-auth');
const isntAuth = require('../middleware/auth/isnt-auth');

const router = express.Router();

router.get('/', mainController.getHome);

module.exports = router;