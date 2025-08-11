// Rate movie (with daily limit)
app.post('/api/movies/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { id: movieId } = req.params;
    const { rating } = req.body || {};
    const userId = req.user?.userId;
    if (!userId || !movieId || !rating || rating < 1 || rating > 10) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    // Check daily limit (10 different movies)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: todayRatings, error: countErr } = await supabase
      .from('user_ratings')
      .select('movie_id')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });
    if (countErr) throw countErr;

    const uniqueMovies = new Set(todayRatings?.map(r => r.movie_id) || []);
    if (uniqueMovies.size >= 10 && !uniqueMovies.has(String(movieId))) {
      return res.status(429).json({ message: 'Günlük puan verme limitine ulaştınız (10 farklı film)' });
    }

    // Upsert rating
    const { error: upsertErr } = await supabase
      .from('user_ratings')
      .upsert({
        user_id: userId,
        movie_id: String(movieId),
        rating: rating,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,movie_id'
      });
    if (upsertErr) throw upsertErr;

    // Get updated aggregates
    const [ratings, friends] = await Promise.all([
      getMovieRatings([movieId]),
      getFriendsRatings(userId, [movieId]),
    ]);

    return res.json({
      success: true,
      data: {
        ...(ratings.get(movieId) || {}),
        ...(friends.get(movieId) || {}),
      }
    });
  } catch (error) {
    console.error('Rate movie error:', error);
    return res.status(500).json({ message: 'Failed to rate movie' });
  }
});

// Remove rating
app.delete('/api/movies/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { id: movieId } = req.params;
    const userId = req.user?.userId;
    if (!userId || !movieId) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const { error } = await supabase
      .from('user_ratings')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', String(movieId));
    if (error) throw error;

    // Get updated aggregates
    const [ratings, friends] = await Promise.all([
      getMovieRatings([movieId]),
      getFriendsRatings(userId, [movieId]),
    ]);

    return res.json({
      success: true,
      data: {
        ...(ratings.get(movieId) || {}),
        ...(friends.get(movieId) || {}),
      }
    });
  } catch (error) {
    console.error('Remove rating error:', error);
    return res.status(500).json({ message: 'Failed to remove rating' });
  }
});

// Get my rated movies
app.get('/api/users/ratings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 12, 1);
    const offset = (page - 1) * limit;

    // Get paginated ratings
    const { data: ratings, error: ratingsErr, count } = await supabase
      .from('user_ratings')
      .select('movie_id, rating, created_at', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (ratingsErr) throw ratingsErr;

    if (!ratings || ratings.length === 0) {
      return res.json({
        success: true,
        data: {
          ratings: [],
          totalPages: 0,
          currentPage: page,
          totalCount: 0,
        }
      });
    }

    // Fetch movie details from TMDB
    const movieIds = ratings.map(r => r.movie_id);
    const movieDetails = await Promise.all(
      movieIds.map(async (id) => {
        try {
          const resp = await tmdbClient.get(`/movie/${encodeURIComponent(id)}`, {
            params: withAuthParams({ language: 'tr-TR' }),
          });
          return mapMovieSummary(resp.data, new Map());
        } catch (_) {
          return null;
        }
      })
    );

    // Merge ratings with movie details
    const merged = ratings
      .map((r, i) => {
        const movie = movieDetails[i];
        if (!movie) return null;
        return {
          ...movie,
          userRating: r.rating,
          ratedAt: r.created_at,
        };
      })
      .filter(Boolean);

    return res.json({
      success: true,
      data: {
        ratings: merged,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalCount: count,
      }
    });
  } catch (error) {
    console.error('Get my ratings error:', error);
    return res.status(500).json({ message: 'Failed to fetch ratings' });
  }
});

// Export the Express app for Vercel
export default app;

// For Railway deployment
if (process.env.NODE_ENV !== 'production' || process.env.RAILWAY_ENVIRONMENT || process.env.PORT) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Railway Environment: ${process.env.RAILWAY_ENVIRONMENT}`);
  });
}