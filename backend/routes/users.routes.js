const express = require('express');
const Default = require('../controllers/default.controller');
const { requireAuth } = require('../middleware/auth');
const { createAuthLimiter } = require('../middleware/rateLimit');
const config = require('../config');
const router = express.Router();
const authLimiter = createAuthLimiter(config.authRateLimit);

router.get('/me', Default.getCurrentUserGET);
router.post('/login', authLimiter, Default.loginUserPOST);
router.post('/logout', Default.logoutUserPOST);
router.post('/register', authLimiter, Default.registerUserPOST);
router.post('/secure', authLimiter, requireAuth(), Default.secureAccountPOST);

module.exports = router;
