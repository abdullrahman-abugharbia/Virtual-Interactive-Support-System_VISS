-- Chat sessions (one per browser visit / user)
CREATE TABLE IF NOT EXISTS support_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
  guest_name VARCHAR(100),
  status     VARCHAR(20) NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual messages within a session
CREATE TABLE IF NOT EXISTS support_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES support_sessions(id) ON DELETE CASCADE,
  role       VARCHAR(15) NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_session ON support_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_support_sessions_user   ON support_sessions(user_id);
