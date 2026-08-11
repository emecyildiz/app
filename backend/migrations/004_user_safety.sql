CREATE TABLE user_blocks (
    blocker_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (blocker_user_id, blocked_user_id),
    CHECK (blocker_user_id <> blocked_user_id)
);

CREATE INDEX ix_user_blocks_blocked_user
    ON user_blocks(blocked_user_id, created_at DESC);

CREATE TABLE user_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category text NOT NULL
        CHECK (category IN ('spam', 'harassment', 'inappropriate_content', 'impersonation', 'other')),
    details varchar(2000) NOT NULL,
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    resolution_note varchar(2000),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (reporter_user_id <> reported_user_id),
    CHECK (char_length(btrim(details)) BETWEEN 10 AND 2000)
);

CREATE INDEX ix_user_reports_status_created
    ON user_reports(status, created_at DESC);
CREATE INDEX ix_user_reports_reporter_created
    ON user_reports(reporter_user_id, created_at DESC);
CREATE INDEX ix_user_reports_reported_created
    ON user_reports(reported_user_id, created_at DESC);

CREATE TRIGGER user_reports_set_updated_at
    BEFORE UPDATE ON user_reports
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
