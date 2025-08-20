-- Mevcut RLS durumunu kontrol et
-- Bu sorguları Supabase SQL Editor'da çalıştırın

-- Hangi tablolarda RLS etkin?
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Mevcut politikaları kontrol et
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
