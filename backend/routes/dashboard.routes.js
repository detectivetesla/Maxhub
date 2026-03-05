const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

router.get('/stats', authMiddleware, dashboardController.getStats);
router.get('/bundles', authMiddleware, dashboardController.getBundles);


module.exports = router;
