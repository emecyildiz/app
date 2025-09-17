const express = require('express');
const router = express.Router();
const recommendationService = require('../services/recommendationService');
const { authenticateToken } = require('../middleware/auth');

// Tüm recommendation rotaları için authentication gerekli
router.use(authenticateToken);

// Yeni öneri listesi oluştur
router.post('/', async (req, res) => {
  try {
    const { toUserId, title, note, movieIds } = req.body;
    
    if (!toUserId || !title || !movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const recommendation = await recommendationService.createRecommendation(
      req.user.id,
      { toUserId, title, note, movieIds }
    );

    res.status(201).json(recommendation);
  } catch (error) {
    console.error('Error creating recommendation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Önerileri listele (gelen/giden)
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    const recommendations = await recommendationService.getRecommendations(
      req.user.id,
      { type, status }
    );
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Belirli bir öneriyi getir
router.get('/:id', async (req, res) => {
  try {
    const recommendation = await recommendationService.getRecommendationById(req.params.id);
    
    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    // Kullanıcının bu öneriyi görme yetkisi var mı kontrol et
    if (recommendation.from_user_id !== req.user.id && recommendation.to_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(recommendation);
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Öneriye yanıt ver (kabul/red)
router.post('/:id/respond', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const recommendation = await recommendationService.respondToRecommendation(
      req.params.id,
      req.user.id,
      status
    );

    res.json(recommendation);
  } catch (error) {
    console.error('Error responding to recommendation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a recommendation (sender or recipient)
router.delete('/:id', async (req, res) => {
  try {
    const result = await recommendationService.deleteRecommendation(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting recommendation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alternate delete (POST) for environments that block DELETE
router.post('/:id/delete', async (req, res) => {
  try {
    const result = await recommendationService.deleteRecommendation(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting recommendation (POST):', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
