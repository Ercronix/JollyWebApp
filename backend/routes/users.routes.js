const express = require('express');
const Default = require('../controllers/default.controller');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/me', Default.getCurrentUserGET);
router.post('/login', Default.loginUserPOST);
router.post('/logout', Default.logoutUserPOST);
router.post('/register', Default.registerUserPOST);
router.post('/secure', requireAuth(), Default.secureAccountPOST);

module.exports = router;
