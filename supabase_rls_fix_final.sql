-- Supabase RLS (Row Level Security) Düzeltme Scripti - Final Versiyon
-- Bu script Supabase'in gerçek tablo yapısına uygun olarak hazırlanmıştır
-- Kullanıcılar auth.users tablosunda, bilgileri profiles tablosunda

-- Önce mevcut tabloları kontrol edelim
-- Bu sorguyu çalıştırarak hangi tabloların mevcut olduğunu görebilirsiniz:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- 1. Movies tablosunda RLS'yi etkinleştir (eğer tablo varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'movies') THEN
        ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
        
        -- Movies tablosu için güvenlik politikaları oluştur
        
        -- Herkes filmleri görüntüleyebilir (public read)
        DROP POLICY IF EXISTS "Movies are viewable by everyone" ON public.movies;
        CREATE POLICY "Movies are viewable by everyone" ON public.movies
            FOR SELECT USING (true);
        
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
    END IF;
END $$;

-- 2. Ratings tablosu için RLS ve politikalar (eğer tablo varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ratings') THEN
        ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
        
        -- Kullanıcılar kendi değerlendirmelerini yönetebilir
        DROP POLICY IF EXISTS "Users can manage their own ratings" ON public.ratings;
        CREATE POLICY "Users can manage their own ratings" ON public.ratings
            FOR ALL USING (user_id = auth.uid());
        
        -- Herkes değerlendirmeleri görüntüleyebilir
        DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON public.ratings;
        CREATE POLICY "Ratings are viewable by everyone" ON public.ratings
            FOR SELECT USING (true);
    END IF;
END $$;

-- 3. Favorites tablosu için RLS ve politikalar (eğer tablo varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
        ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
        
        -- Kullanıcılar kendi favorilerini yönetebilir
        DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.favorites;
        CREATE POLICY "Users can manage their own favorites" ON public.favorites
            FOR ALL USING (user_id = auth.uid());
    END IF;
END $$;

-- 4. Profiles tablosu için RLS ve politikalar (eğer tablo varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
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
    END IF;
END $$;

-- 5. Comments tablosu için RLS ve politikalar (eğer tablo varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
        ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
        
        -- Kullanıcılar kendi yorumlarını yönetebilir
        DROP POLICY IF EXISTS "Users can manage their own comments" ON public.comments;
        CREATE POLICY "Users can manage their own comments" ON public.comments
            FOR ALL USING (user_id = auth.uid());
        
        -- Herkes yorumları görüntüleyebilir
        DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
        CREATE POLICY "Comments are viewable by everyone" ON public.comments
            FOR SELECT USING (true);
    END IF;
END $$;

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
