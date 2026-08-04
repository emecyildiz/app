CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email citext NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'USER'
        CHECK (role IN ('USER', 'MODERATOR', 'ADMIN')),
    status text NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
    email_verified_at timestamptz,
    last_login_at timestamptz,
    failed_login_attempts integer NOT NULL DEFAULT 0
        CHECK (failed_login_attempts >= 0),
    locked_until timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    username citext NOT NULL UNIQUE,
    name varchar(120) NOT NULL,
    bio varchar(1000),
    location varchar(120),
    avatar_url text,
    social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
    last_active_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (username::text ~ '^[A-Za-z0-9_]{3,32}$'),
    CHECK (jsonb_typeof(social_links) = 'object')
);

CREATE TABLE user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash char(64) NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    user_agent varchar(512),
    ip_hash char(64),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX ix_user_sessions_expires_at ON user_sessions(expires_at);

CREATE TABLE user_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose text NOT NULL
        CHECK (purpose IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'EMAIL_CHANGE', 'MAGIC_LINK')),
    token_hash char(64) NOT NULL UNIQUE,
    pending_email citext,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_user_tokens_user_purpose ON user_tokens(user_id, purpose);
CREATE INDEX ix_user_tokens_expires_at ON user_tokens(expires_at);

CREATE TABLE movies (
    id bigint PRIMARY KEY,
    tmdb_id bigint NOT NULL UNIQUE,
    title varchar(300) NOT NULL,
    poster_path varchar(500),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id bigint NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, movie_id)
);

CREATE INDEX ix_favorites_user_created ON favorites(user_id, created_at DESC);

CREATE TABLE ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id bigint NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    rating numeric(3,1) CHECK (rating >= 0 AND rating <= 10),
    comment varchar(2000),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, movie_id)
);

CREATE INDEX ix_ratings_user_created ON ratings(user_id, created_at DESC);

CREATE TABLE comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id bigint NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    content varchar(2000) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, movie_id)
);

CREATE INDEX ix_comments_user_created ON comments(user_id, created_at DESC);

CREATE TABLE watched_movies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id bigint NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, movie_id)
);

CREATE INDEX ix_watched_movies_user_created ON watched_movies(user_id, created_at DESC);

CREATE TABLE friendships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (from_user_id <> to_user_id)
);

CREATE UNIQUE INDEX ux_friendships_pair
    ON friendships (LEAST(from_user_id, to_user_id), GREATEST(from_user_id, to_user_id));
CREATE INDEX ix_friendships_to_status ON friendships(to_user_id, status);

CREATE TABLE recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title varchar(200) NOT NULL,
    note varchar(2000),
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected')),
    deleted_by_sender boolean NOT NULL DEFAULT false,
    deleted_by_recipient boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (from_user_id <> to_user_id)
);

CREATE INDEX ix_recommendations_sender_created
    ON recommendations(from_user_id, created_at DESC);
CREATE INDEX ix_recommendations_recipient_status_created
    ON recommendations(to_user_id, status, created_at DESC);

CREATE TABLE recommendation_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id uuid NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    movie_id bigint NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    movie_title varchar(300),
    poster_path varchar(500),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (recommendation_id, movie_id)
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER profiles_set_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER movies_set_updated_at
    BEFORE UPDATE ON movies
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER ratings_set_updated_at
    BEFORE UPDATE ON ratings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER comments_set_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER friendships_set_updated_at
    BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER recommendations_set_updated_at
    BEFORE UPDATE ON recommendations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
