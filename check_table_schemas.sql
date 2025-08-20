-- Tüm tabloların şemalarını kontrol et
-- Bu sorguları Supabase SQL Editor'da çalıştırın

-- Ratings tablosunun şemasını kontrol et
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ratings'
ORDER BY ordinal_position;

-- Comments tablosunun şemasını kontrol et
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'comments'
ORDER BY ordinal_position;

-- Friendships tablosunun şemasını kontrol et
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'friendships'
ORDER BY ordinal_position;

-- Movies tablosunun şemasını kontrol et
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'movies'
ORDER BY ordinal_position;

-- Profiles tablosunun şemasını kontrol et
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
