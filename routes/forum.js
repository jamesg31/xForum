const express = require('express');

const forumController = require('../controllers/forum');
const isAuth = require('../middleware/auth/is-auth');
const isntAuth = require('../middleware/auth/isnt-auth');

const router = express.Router();

router.get('/forum/:url', forumController.getForum);

module.exports = router;