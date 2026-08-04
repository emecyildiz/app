ALTER TABLE user_sessions
    ADD COLUMN csrf_token_hash char(64) NOT NULL;

CREATE INDEX ix_user_sessions_user_expiry
    ON user_sessions(user_id, expires_at DESC);
