const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') next();
    else res.status(403).json({ message: 'Forbidden' });
};

router.use(authMiddleware, adminOnly);

router.get('/stats', adminController.getStats);
router.get('/recent-data', adminController.getRecentData);
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/bundles', adminController.getAllBundles);
router.post('/bundles', adminController.createBundle);
router.get('/orders', adminController.getAllOrders);
router.get('/transactions', adminController.getAllTransactions);
router.get('/logs', adminController.getLogs);

module.exports = router;
