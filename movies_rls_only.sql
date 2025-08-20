-- Sadece Movies tablosu için RLS - Diğer tablolar zaten güvenli
-- Bu script sadece movies tablosunda RLS'yi etkinleştirir

-- Movies tablosunda RLS'yi etkinleştir
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- Movies tablosu için güvenlik politikaları oluştur
-- Herkes filmleri görüntüleyebilir (TMDB'den alınan filmler)
DROP POLICY IF EXISTS "Movies are viewable by everyone" ON public.movies;
CREATE POLICY "Movies are viewable by everyone" ON public.movies
    FOR SELECT USING (true);

-- TMDB'den alınan filmler için local CRUD işlemleri (eğer varsa)
-- Sadece admin ve operator kullanıcılar film ekleyebilir
DROP POLICY IF EXISTS "Movies can be created by admin and operator" ON public.movies;
CREATE POLICY "Movies can be created by admin and operator" ON public.movies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'ADMIN' OR profiles.role = 'OPERATOR')
        )
    );

-- Sadece admin ve operator kullanıcılar film güncelleyebilir
DROP POLICY IF EXISTS "Movies can be updated by admin and operator" ON public.movies;
CREATE POLICY "Movies can be updated by admin and operator" ON public.movies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'ADMIN' OR profiles.role = 'OPERATOR')
        )
    );

-- Sadece admin kullanıcılar film silebilir
DROP POLICY IF EXISTS "Movies can be deleted by admin only" ON public.movies;
CREATE POLICY "Movies can be deleted by admin only" ON public.movies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'ADMIN'
        )
    );

-- RLS durumunu kontrol etmek için sorgu
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
