-- Mevcut tabloları kontrol etmek için sorgu
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Ayrıca auth.users tablosunu da kontrol edelim
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'auth' 
ORDER BY table_name;

-- Profiles tablosunu kontrol edelim
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name LIKE '%profile%' 
ORDER BY table_schema, table_name;
