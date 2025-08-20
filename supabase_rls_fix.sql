-- Supabase RLS (Row Level Security) Düzeltme Scripti
-- Bu script movies tablosunda RLS'yi etkinleştirir ve güvenlik politikalarını oluşturur

-- 1. Movies tablosunda RLS'yi etkinleştir
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- 2. Movies tablosu için güvenlik politikaları oluştur

-- Herkes filmleri görüntüleyebilir (public read)
CREATE POLICY "Movies are viewable by everyone" ON public.movies
    FOR SELECT USING (true);

-- Sadece admin ve operator kullanıcılar film ekleyebilir
CREATE POLICY "Movies can be created by admin and operator" ON public.movies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'operator')
        )
    );

-- Sadece admin ve operator kullanıcılar film güncelleyebilir
CREATE POLICY "Movies can be updated by admin and operator" ON public.movies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'operator')
        )
    );

-- Sadece admin kullanıcılar film silebilir
CREATE POLICY "Movies can be deleted by admin only" ON public.movies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 3. Ratings tablosu için RLS ve politikalar (eğer yoksa)
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi değerlendirmelerini yönetebilir
CREATE POLICY "Users can manage their own ratings" ON public.ratings
    FOR ALL USING (user_id = auth.uid());

-- Herkes değerlendirmeleri görüntüleyebilir
CREATE POLICY "Ratings are viewable by everyone" ON public.ratings
    FOR SELECT USING (true);

-- 4. Favorites tablosu için RLS ve politikalar (eğer yoksa)
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi favorilerini yönetebilir
CREATE POLICY "Users can manage their own favorites" ON public.favorites
    FOR ALL USING (user_id = auth.uid());

-- 5. Users tablosu için RLS ve politikalar (eğer yoksa)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi profillerini görüntüleyebilir
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (id = auth.uid());

-- Kullanıcılar kendi profillerini güncelleyebilir
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (id = auth.uid());

-- Admin ve operator tüm kullanıcıları yönetebilir
CREATE POLICY "Admin and operator can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'operator')
        )
    );

-- 6. Mevcut politikaları kontrol etmek için sorgu
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;

-- 7. RLS durumunu kontrol etmek için sorgu
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;
