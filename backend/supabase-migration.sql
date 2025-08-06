-- Supabase Migration for CinemaHub
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('USER', 'OPERATOR', 'ADMIN')),
  bio TEXT,
  location VARCHAR(255),
  avatarUrl TEXT,
  memberSince TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  socialLinks JSONB,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create movies table
CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  releaseYear INTEGER,
  duration INTEGER, -- in minutes
  posterUrl TEXT,
  trailerUrl TEXT,
  genres JSONB,
  "cast" JSONB, -- cast kelimesini tırnak içine aldık
  director VARCHAR(255),
  averageRating DECIMAL(3,2) DEFAULT 0,
  totalRatings INTEGER DEFAULT 0,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  review TEXT,
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movieId UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(userId, movieId)
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movieId UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(userId, movieId)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_release_year ON movies(releaseYear);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(userId);
CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movieId);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(userId);
CREATE INDEX IF NOT EXISTS idx_favorites_movie_id ON favorites(movieId);

-- Create function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON movies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update movie average rating
CREATE OR REPLACE FUNCTION update_movie_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update average rating and total ratings count
  UPDATE movies 
  SET 
    averageRating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM ratings 
      WHERE movieId = NEW.movieId
    ),
    totalRatings = (
      SELECT COUNT(*)
      FROM ratings 
      WHERE movieId = NEW.movieId
    ),
    updatedAt = NOW()
  WHERE id = NEW.movieId;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for rating updates
CREATE TRIGGER update_movie_rating_trigger 
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_movie_rating();

-- Insert sample admin user (password: admin123)
INSERT INTO users (email, passwordHash, name, username, role) 
VALUES (
  'admin@cinemahub.com',
  '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash of 'admin123'
  'Admin User',
  'admin',
  'ADMIN'
) ON CONFLICT (email) DO UPDATE SET 
  passwordHash = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  role = 'ADMIN';

-- Insert sample operator user (password: operator123)
INSERT INTO users (email, passwordHash, name, username, role) 
VALUES (
  'operator@cinemahub.com',
  '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash of 'operator123'
  'Operator User',
  'operator',
  'OPERATOR'
) ON CONFLICT (email) DO UPDATE SET 
  passwordHash = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  role = 'OPERATOR';

-- Insert sample movies
INSERT INTO movies (title, description, releaseYear, duration, genres, "cast", director, averageRating, totalRatings) VALUES
('Inception', 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 2010, 148, '["Action", "Sci-Fi", "Thriller"]', '["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Ellen Page"]', 'Christopher Nolan', 8.8, 2500000),
('The Shawshank Redemption', 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', 1994, 142, '["Drama"]', '["Tim Robbins", "Morgan Freeman", "Bob Gunton"]', 'Frank Darabont', 9.3, 2800000),
('The Dark Knight', 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', 2008, 152, '["Action", "Crime", "Drama"]', '["Christian Bale", "Heath Ledger", "Aaron Eckhart"]', 'Christopher Nolan', 9.0, 2600000),
('Pulp Fiction', 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.', 1994, 154, '["Crime", "Drama"]', '["John Travolta", "Uma Thurman", "Samuel L. Jackson"]', 'Quentin Tarantino', 8.9, 2000000),
('Fight Club', 'An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into something much, much more.', 1999, 139, '["Drama"]', '["Brad Pitt", "Edward Norton", "Helena Bonham Carter"]', 'David Fincher', 8.8, 2200000)
ON CONFLICT DO NOTHING; 