const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const recommendationService = require('../services/recommendationService');
const { authenticateToken } = require('../middleware/auth');

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Tüm recommendation rotaları için authentication gerekli
router.use(authenticateToken);

// ========== SEND RECOMMENDATION (Öneri Gönder) ==========
router.post('/', async (req, res) => {
  try {
    const fromUserId = req.user.id; // Sender
    // Frontend sends these fields:
    const { toUserId, movieId, movieTitle, posterPath } = req.body;

    // 1. Validation
    if (!toUserId || !movieId) {
      return res.status(400).json({ error: 'Receiver (toUserId) and Movie ID are required' });
    }
    if (fromUserId === toUserId) {
      return res.status(400).json({ error: 'Cannot recommend a movie to yourself' });
    }

    // 2. Insert into Main Table ('recommendations')
    // We map 'toUserId' -> 'to_user_id'
    const { data: recData, error: recError } = await supabase
      .from('recommendations')
      .insert([
        {
          from_user_id: fromUserId,
          to_user_id: toUserId,
          movie_id: movieId,
          status: 'pending',
          created_at: new Date()
        }
      ])
      .select()
      .single();

    if (recError) {
        console.error('Error inserting into recommendations:', recError);
        throw recError;
    }

    // 3. Insert into Items Table ('recommendation_items')
    // Using the ID from the previous step
    if (recData) {
        const { error: itemError } = await supabase
          .from('recommendation_items')
          .insert([
            {
              recommendation_id: recData.id, // Link to parent
              movie_id: movieId,
              movie_title: movieTitle || 'Unknown Title',
              poster_path: posterPath || null
            }
          ]);
          
        if (itemError) {
            console.error('Error inserting recommendation item:', itemError);
            // Non-critical error, but good to log
        }
    }

    return res.status(201).json({ success: true, data: recData });

  } catch (error) {
    console.error('Error in POST /api/recommendations:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
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
