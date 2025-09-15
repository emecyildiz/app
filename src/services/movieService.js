import { supabase } from '../config/supabase'

class MovieService {
  constructor() {
    this.supabase = supabase
  }

  // Kullanıcının film puanlarını getir
  async getMyRatings(page = 1, limit = 20) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Kullanıcı girişi yapılmamış')

      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error, count } = await this.supabase
        .from('ratings')
        .select(`
          *,
          movie:movies(*)
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      return {
        ratings: data || [],
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page
      }
    } catch (error) {
      console.error('Film puanları yüklenirken hata:', error)
      return { ratings: [], totalPages: 0, currentPage: page }
    }
  }

  // Film puanla
  async rateMovie(movieId, rating, comment = '') {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Kullanıcı girişi yapılmamış')

      // Önce mevcut puanı kontrol et
      const { data: existingRating } = await this.supabase
        .from('ratings')
        .select('*')
        .eq('user_id', user.id)
        .eq('movie_id', movieId)
        .maybeSingle()

      if (existingRating) {
        // Mevcut puanı güncelle
        const { data, error } = await this.supabase
          .from('ratings')
          .update({
            rating,
            comment,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRating.id)
          .select()
          .single()

        if (error) throw error
        return { success: true, data }
      } else {
        // Yeni puan ekle
        const { data, error } = await this.supabase
          .from('ratings')
          .insert({
            user_id: user.id,
            movie_id: movieId,
            rating,
            comment
          })
          .select()
          .single()

        if (error) throw error
        return { success: true, data }
      }
    } catch (error) {
      console.error('Film puanlanırken hata:', error)
      return { success: false, error: error.message }
    }
  }

  // Film yorumunu sil
  async deleteRating(movieId) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Kullanıcı girişi yapılmamış')

      const { error } = await this.supabase
        .from('ratings')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Film puanı silinirken hata:', error)
      return { success: false, error: error.message }
    }
  }

  // Kullanıcının izlediği filmleri getir
  async getWatchedMovies(page = 1, limit = 20) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Kullanıcı girişi yapılmamış')

      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error, count } = await this.supabase
        .from('watched_movies')
        .select(`
          *,
          movie:movies(*)
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('watched_date', { ascending: false })
        .range(from, to)

      if (error) throw error

      return {
        movies: data || [],
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page
      }
    } catch (error) {
      console.error('İzlenen filmler yüklenirken hata:', error)
      return { movies: [], totalPages: 0, currentPage: page }
    }
  }

  // Film izlendi olarak işaretle
  async markAsWatched(movieId, watchedDate = new Date().toISOString()) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Kullanıcı girişi yapılmamış')

      const { data, error } = await this.supabase
        .from('watched_movies')
        .upsert({
          user_id: user.id,
          movie_id: movieId,
          watched_date: watchedDate
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Film izlendi olarak işaretlenirken hata:', error)
      return { success: false, error: error.message }
    }
  }

  // Film izlenmedi olarak işaretle
  async markAsUnwatched(movieId) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Kullanıcı girişi yapılmamış')

      const { error } = await this.supabase
        .from('watched_movies')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Film izlenmedi olarak işaretlenirken hata:', error)
      return { success: false, error: error.message }
    }
  }
}

export const movieService = new MovieService()
