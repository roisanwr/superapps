-- ============================================================
-- indexes.sql
-- PG-SPECIFIC LAYER — Jangan disentuh jika migrasi ke MySQL/SQLite
-- Jalankan file ini via Supabase SQL Editor atau migration script
-- ============================================================


-- ============================================================
-- INDEXES: users
-- ============================================================

-- Dipakai saat login via email (getUserByIdentifier)
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users (email);

-- Dipakai saat login via username (getUserByIdentifier)
CREATE INDEX IF NOT EXISTS idx_users_username
  ON users (username);

-- Dipakai saat query filter user aktif saja (isActive = true)
-- Partial index — hanya index row yang is_active = true, lebih ringan
CREATE INDEX IF NOT EXISTS idx_users_active
  ON users (id)
  WHERE is_active = true;


-- ============================================================
-- INDEXES: sessions
-- ============================================================

-- Dipakai saat verifikasi refresh token (getSessionByToken, isSessionValid)
-- Ini query paling sering terjadi — wajib ada index-nya
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token
  ON sessions (refresh_token);

-- Dipakai saat fetch semua session milik user (getSessionsByUserId)
-- dan saat logout semua device (deleteAllSessionsByUserId)
CREATE INDEX IF NOT EXISTS idx_sessions_user_id
  ON sessions (user_id);

-- Dipakai saat cleanup expired sessions (deleteExpiredSessions)
-- Partial index — hanya index row yang belum expired, lebih efisien
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
  ON sessions (expires_at)
  WHERE expires_at > NOW();


-- ============================================================
-- INDEXES: app_access
-- ============================================================

-- Tidak perlu manual index di sini.
-- Unique constraint UNIQUE(user_id, app_name) di schema.ts sudah
-- otomatis membuat index di PostgreSQL untuk kombinasi dua kolom ini.
-- Membuat index manual di atas unique constraint = index duplikat
-- yang memboroskan storage dan memperlambat write operation.


-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- Otomatis update kolom updated_at setiap kali row di-UPDATE
-- Tidak perlu set manual di queries.ts
--
-- NOTE: Ini PG-specific, tidak ada di MySQL/SQLite.
-- Di queries.ts sudah ada fallback manual: set({ updatedAt: new Date() })
-- Trigger ini hanya sebagai safety net di level DB.
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
