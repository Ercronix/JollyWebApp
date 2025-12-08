const express = require('express');
const Default = require('../controllers/default.controller');
const router = express.Router();

router.get('/me', Default.getCurrentUserGET);
router.post('/login', Default.loginUserPOST);
router.post('/logout', Default.logoutUserPOST);

module.exports = router;
