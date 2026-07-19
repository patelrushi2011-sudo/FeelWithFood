const express = require('express');
const router = express.Router();
const waterController = require('../controllers/water.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/', waterController.logWater);
router.get('/', waterController.getWaterLog);

module.exports = router;
