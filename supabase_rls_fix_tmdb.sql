-- Supabase RLS (Row Level Security) Düzeltme Scripti - TMDB API Versiyonu
-- Bu script TMDB API kullanımına uygun olarak hazırlanmıştır
-- Filmler TMDB'den alınıyor, local CRUD işlemleri yok

-- 1. Movies tablosunda RLS'yi etkinleştir
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- Movies tablosu için güvenlik politikaları oluştur
-- Herkes filmleri görüntüleyebilir (public read - TMDB'den alınan filmler)
DROP POLICY IF EXISTS "Movies are viewable by everyone" ON public.movies;
CREATE POLICY "Movies are viewable by everyone" ON public.movies
    FOR SELECT USING (true);

-- TMDB'den alınan filmler için local CRUD işlemleri yok
-- Eğer local film ekleme/düzenleme varsa, sadece admin/operator yapabilir
DROP POLICY IF EXISTS "Movies can be created by admin and operator" ON public.movies;
CREATE POLICY "Movies can be created by admin and operator" ON public.movies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'ADMIN' OR profiles.role = 'OPERATOR')
        )
    );

DROP POLICY IF EXISTS "Movies can be updated by admin and operator" ON public.movies;
CREATE POLICY "Movies can be updated by admin and operator" ON public.movies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'ADMIN' OR profiles.role = 'OPERATOR')
        )
    );

DROP POLICY IF EXISTS "Movies can be deleted by admin only" ON public.movies;
CREATE POLICY "Movies can be deleted by admin only" ON public.movies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'ADMIN'
        )
    );

-- 2. Ratings tablosu için RLS ve politikalar
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi değerlendirmelerini yönetebilir
DROP POLICY IF EXISTS "Users can manage their own ratings" ON public.ratings;
CREATE POLICY "Users can manage their own ratings" ON public.ratings
    FOR ALL USING (user_id = auth.uid());

-- Herkes değerlendirmeleri görüntüleyebilir
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON public.ratings;
CREATE POLICY "Ratings are viewable by everyone" ON public.ratings
    FOR SELECT USING (true);

-- 3. Profiles tablosu için RLS ve politikalar
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi profillerini görüntüleyebilir
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (id = auth.uid());

-- Kullanıcılar kendi profillerini güncelleyebilir
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- Admin ve operator tüm profilleri yönetebilir
DROP POLICY IF EXISTS "Admin and operator can manage all profiles" ON public.profiles;
CREATE POLICY "Admin and operator can manage all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'ADMIN' OR profiles.role = 'OPERATOR')
        )
    );

-- 4. Comments tablosu için RLS ve politikalar
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi yorumlarını yönetebilir
DROP POLICY IF EXISTS "Users can manage their own comments" ON public.comments;
CREATE POLICY "Users can manage their own comments" ON public.comments
    FOR ALL USING (user_id = auth.uid());

-- Herkes yorumları görüntüleyebilir
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" ON public.comments
    FOR SELECT USING (true);

-- 5. Friendships tablosu için RLS ve politikalar
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi arkadaşlık isteklerini yönetebilir
DROP POLICY IF EXISTS "Users can manage their own friendships" ON public.friendships;
CREATE POLICY "Users can manage their own friendships" ON public.friendships
    FOR ALL USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Kullanıcılar arkadaşlık durumlarını görüntüleyebilir
DROP POLICY IF EXISTS "Users can view friendship status" ON public.friendships;
CREATE POLICY "Users can view friendship status" ON public.friendships
    FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Mevcut politikaları kontrol etmek için sorgu
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;

-- RLS durumunu kontrol etmek için sorgu
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;
