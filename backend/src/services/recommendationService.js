const supabase = require('../config/supabase');

class RecommendationService {
  async createRecommendation(userId, { toUserId, title, note, movieIds }) {
    const { data: recommendation, error: recError } = await supabase
      .from('recommendations')
      .insert({
        from_user_id: userId,
        to_user_id: toUserId,
        title,
        note
      })
      .select()
      .single();

    if (recError) {
      throw recError;
    }

    // Film listesini ekle
    const items = movieIds.map(movieId => ({
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
    let query = supabase
      .from('recommendations')
      .select(`
        *,
        from_user:from_user_id(id, email, full_name),
        to_user:to_user_id(id, email, full_name),
        items:recommendation_items(movie_id)
      `);

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
      .select(`
        *,
        from_user:from_user_id(id, email, full_name),
        to_user:to_user_id(id, email, full_name),
        items:recommendation_items(movie_id)
      `)
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
