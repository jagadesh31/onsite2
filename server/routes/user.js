const express = require('express');
const router = express.Router();
const {
    // createLink,
    // verifyLink,
    registerUser,
    loginUser,
    userInfo,
    refreshToken,
    getApps,
    createCredentials,
    getToken,
    getCode,
    getUser,
    updateCredentials,
    deleteCredentials,
    regenerateClientSecret
} = require('../controllers/user');

// Authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/userInfo', userInfo);
router.post('/refresh-token', refreshToken);

// Verification routes
// router.get('/createLink', createLink);
// router.get('/verifyLink/callback', verifyLink);

// App management routes
router.get('/getApps', getApps);
router.post('/credentials/create', createCredentials);
router.put('/credentials/:id', updateCredentials);
router.delete('/credentials/:id', deleteCredentials);
router.post('/credentials/:id/regenerate-secret', regenerateClientSecret);

// OAuth flows
router.get('/getCode', getCode);
router.post('/getToken', getToken);
router.get('/getUser', getUser);

module.exports = router;