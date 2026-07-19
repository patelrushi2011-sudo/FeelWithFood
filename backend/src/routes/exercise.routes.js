const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exercise.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes (no auth needed)
router.get('/categories', exerciseController.getCategories);
router.get('/database', exerciseController.searchDatabase);

// Protected routes
router.use(authMiddleware);

router.post('/log', exerciseController.logWorkout);
router.get('/log', exerciseController.getWorkoutLog);
router.delete('/log/:id', exerciseController.deleteWorkoutLog);
router.get('/summary', exerciseController.getSummary);

module.exports = router;
