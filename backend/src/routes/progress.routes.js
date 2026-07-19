const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progress.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/stats', progressController.getStats);
router.get('/streak', progressController.getStreak);
router.post('/weight', progressController.logWeight);
router.get('/weight', progressController.getWeightHistory);
router.get('/calories', progressController.getCaloriesHistory);

module.exports = router;
