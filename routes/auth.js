const express = require('express');

const authController = require('../controllers/auth');
const isAuth = require('../middleware/auth/is-auth');
const isntAuth = require('../middleware/auth/isnt-auth');

const router = express.Router();

router.get('/login', isntAuth, authController.getLogin);
router.get('/register', isntAuth, authController.getRegister);
router.get('/reset', isntAuth, authController.getReset);
router.get('/reset/:token', isntAuth, authController.getNewPassword);
router.get('/verify/:token', authController.getVerify);

router.post('/login', isntAuth, authController.postLogin);
router.post('/logout', isAuth, authController.postLogout);
router.post('/register', isntAuth, authController.postRegister);
router.post('/reset', isntAuth, authController.postReset);
router.post('/new-password', isntAuth, authController.postNewPassword);

module.exports = router;