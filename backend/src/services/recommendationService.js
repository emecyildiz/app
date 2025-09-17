const supabase = require('../config/supabase');

class RecommendationService {
  async createRecommendation(userId, { toUserId, title, note, movieIds }) {
    // Basic validation/sanitization
    const cleanTitle = (title || '').toString().trim();
    const cleanNote = (note || '').toString().trim();
    const targetUserId = (toUserId || '').toString().trim();
    const itemsIds = Array.isArray(movieIds)
      ? movieIds
          .map((m) => parseInt(m, 10))
          .filter((n) => Number.isFinite(n) && n > 0)
      : [];

    if (!userId || !targetUserId || !cleanTitle || itemsIds.length === 0) {
      throw new Error('invalid_payload');
    }

    const { data: recommendation, error: recError } = await supabase
      .from('recommendations')
      .insert({
        from_user_id: userId,
        to_user_id: targetUserId,
        title: cleanTitle,
        note: cleanNote || null,
      })
      .select()
      .single();

    if (recError) {
      throw recError;
    }

    // Film listesini ekle
    const items = itemsIds.map((movieId) => ({
      recommendation_id: recommendation.id,
      movie_id: movieId
    }));

    const { error: itemsError } = await supabase
      .from('recommendation_items')
      .insert(items);

    if (itemsError) {
      throw itemsError;
    }

    return recommendation;
  }

  async getRecommendations(userId, { type = 'received', status } = {}) {
    // Keep selection minimal to avoid join/rls issues
    let query = supabase
      .from('recommendations')
      .select('*, items:recommendation_items(movie_id)', { count: 'exact' });

    // Gelen veya giden önerileri filtrele
    if (type === 'received') {
      query = query.eq('to_user_id', userId);
    } else if (type === 'sent') {
      query = query.eq('from_user_id', userId);
    }

    // Duruma göre filtrele (opsiyonel)
    if (status) {
      query = query.eq('status', status);
    }

    // Tarihe göre sırala
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return data;
  }

  async getRecommendationById(id) {
    const { data, error } = await supabase
      .from('recommendations')
      .select(`*, items:recommendation_items(movie_id)`) 
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async respondToRecommendation(id, userId, status) {
    if (!['accepted', 'rejected'].includes(status)) {
      throw new Error('Invalid status');
    }

    const { data, error } = await supabase
      .from('recommendations')
      .update({ status })
      .eq('id', id)
      .eq('to_user_id', userId) // Güvenlik kontrolü
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new RecommendationService();
