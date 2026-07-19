const express = require('express');
const router = express.Router();
const foodController = require('../controllers/food.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes (no auth needed)
router.get('/categories', foodController.getCategories);
router.get('/database', foodController.searchDatabase);

// Protected routes
router.use(authMiddleware);

router.post('/log', foodController.logFood);
router.get('/log', foodController.getFoodLog);
router.delete('/log/:id', foodController.deleteFoodLog);
router.get('/summary', foodController.getSummary);

module.exports = router;
