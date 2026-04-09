-- ==========================================
-- 0. TABEL NEXTAUTH
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    email TEXT UNIQUE,
    password_hash TEXT,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 1. ENUMERATIONS
-- ==========================================
CREATE TYPE wallet_type AS ENUM ('TUNAI', 'BANK', 'DOMPET_DIGITAL');
CREATE TYPE fiat_tx_type AS ENUM ('PEMASUKAN', 'PENGELUARAN', 'TRANSFER');
CREATE TYPE asset_type AS ENUM ('KRIPTO', 'SAHAM', 'LOGAM_MULIA', 'PROPERTI', 'BISNIS', 'LAINNYA');
CREATE TYPE asset_tx_type AS ENUM ('BELI', 'JUAL', 'SALDO_AWAL');
CREATE TYPE valuation_source AS ENUM ('MANUAL', 'API');

-- ==========================================
-- 2. TABEL UTAMA (MASTER DATA & KAS)
-- ==========================================
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type wallet_type NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    deleted_at TIMESTAMPTZ, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type fiat_tx_type NOT NULL,
    -- Tambahan Sparky: Soft Delete & Updated At untuk Kategori!
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, name, type)
);

CREATE TABLE fiat_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    to_wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    transaction_type fiat_tx_type NOT NULL,
    amount DECIMAL(18, 2) NOT NULL CHECK (amount > 0),
    exchange_rate DECIMAL(18, 6) DEFAULT 1.0, 
    description TEXT,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Tambahan Sparky: Jejak audit yang sempurna
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_not_same_wallet CHECK (
        transaction_type <> 'TRANSFER' OR (wallet_id IS DISTINCT FROM to_wallet_id)
    )
);

-- ==========================================
-- 3. FITUR (BUDGET & GOALS)
-- ==========================================
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    amount DECIMAL(18, 2) NOT NULL CHECK (amount > 0),
    period VARCHAR(20) NOT NULL, 
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(18, 2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(18, 2) DEFAULT 0 CHECK (current_amount >= 0),
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. TABEL ASET (HYBRID MODE ACTIVATE! 🚀)
-- ==========================================
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, 
    name VARCHAR(255) NOT NULL,
    asset_type asset_type NOT NULL,
    ticker_symbol VARCHAR(50),
    unit_name VARCHAR(50) DEFAULT 'unit',
    -- Tambahan Sparky: Aset ini dinilai pakai mata uang apa? Sangat penting buat API!
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    price_source valuation_source DEFAULT 'MANUAL',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_unique_global_assets 
ON assets (asset_type, ticker_symbol) WHERE user_id IS NULL;

CREATE UNIQUE INDEX idx_unique_user_assets 
ON assets (user_id, asset_type, ticker_symbol) WHERE user_id IS NOT NULL;


CREATE TABLE user_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    total_units DECIMAL(18, 8) DEFAULT 0 CHECK (total_units >= 0),
    average_buy_price DECIMAL(18, 2) DEFAULT 0 CHECK (average_buy_price >= 0),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, asset_id)
);

CREATE TABLE asset_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
    transaction_type asset_tx_type NOT NULL,
    units DECIMAL(18, 8) NOT NULL CHECK (units > 0),
    price_per_unit DECIMAL(18, 2) NOT NULL CHECK (price_per_unit >= 0),
    total_amount DECIMAL(18, 2) NOT NULL CHECK (total_amount >= 0),
    linked_fiat_transaction_id UUID REFERENCES fiat_transactions(id) ON DELETE SET NULL,
    notes TEXT,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asset_valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    price_per_unit DECIMAL(18, 8) NOT NULL CHECK (price_per_unit >= 0),
    source valuation_source NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (asset_id, recorded_at)
);

-- ==========================================
-- 5. TRIGGERS (DCA OTOMATIS)
-- ==========================================
CREATE OR REPLACE FUNCTION update_portfolio_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_portfolio_id UUID;
    new_units DECIMAL(18, 8) := 0;
    new_avg_price DECIMAL(18, 2) := 0;
    total_cost DECIMAL(18, 2) := 0;
    accumulated_units DECIMAL(18, 8) := 0;
    tx RECORD;
BEGIN
    -- 1. Tentukan portfolio mana yang terpengaruh (DELETE pakai OLD, INSERT/UPDATE pakai NEW)
    IF TG_OP = 'DELETE' THEN
        target_portfolio_id := OLD.portfolio_id;
    ELSE
        target_portfolio_id := NEW.portfolio_id;
    END IF;

    -- 2. Kalkulasi ulang SEMUA transaksi dari awal untuk portfolio ini (Mode Bulletproof! 🛡️)
    FOR tx IN (SELECT * FROM asset_transactions WHERE portfolio_id = target_portfolio_id ORDER BY transaction_date ASC, created_at ASC) LOOP
        IF tx.transaction_type IN ('BELI', 'SALDO_AWAL') THEN
            total_cost := total_cost + (tx.units * tx.price_per_unit);
            accumulated_units := accumulated_units + tx.units;
        ELSIF tx.transaction_type = 'JUAL' THEN
            accumulated_units := accumulated_units - tx.units;
            -- Jual tidak mengubah harga rata-rata (average_buy_price) dari sisa unit
            IF accumulated_units > 0 THEN
                total_cost := accumulated_units * (total_cost / (accumulated_units + tx.units));
            ELSE
                total_cost := 0;
            END IF;
        END IF;
    END LOOP;

    -- 3. Set hasil akhir
    new_units := accumulated_units;
    IF new_units > 0 THEN
        new_avg_price := total_cost / new_units;
    ELSE
        new_avg_price := 0;
    END IF;

    -- 4. Simpan ke tabel portofolio
    UPDATE user_portfolios
    SET total_units = new_units, average_buy_price = new_avg_price, updated_at = NOW()
    WHERE id = target_portfolio_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Hapus trigger lama (jika ada), buat yang super canggih!
DROP TRIGGER IF EXISTS after_asset_transaction_insert ON asset_transactions;

CREATE TRIGGER after_asset_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON asset_transactions
FOR EACH ROW EXECUTE FUNCTION update_portfolio_stats();

-- ==========================================
-- 6. VIEWS (KALKULASI SALDO OTOMATIS)
-- ==========================================
CREATE OR REPLACE VIEW wallet_balances AS
SELECT
    w.id AS wallet_id,
    w.user_id,
    w.name,
    COALESCE(SUM(
        CASE
            WHEN ft.transaction_type = 'PEMASUKAN' AND ft.wallet_id = w.id THEN ft.amount
            WHEN (ft.transaction_type = 'PENGELUARAN' OR ft.transaction_type = 'TRANSFER') AND ft.wallet_id = w.id THEN -ft.amount
            WHEN ft.transaction_type = 'TRANSFER' AND ft.to_wallet_id = w.id THEN ft.amount
            ELSE 0
        END
    ), 0) AS balance
FROM wallets w
LEFT JOIN fiat_transactions ft ON w.id = ft.wallet_id OR w.id = ft.to_wallet_id
WHERE w.deleted_at IS NULL 
GROUP BY w.id, w.user_id, w.name;

CREATE OR REPLACE VIEW latest_asset_prices AS
SELECT DISTINCT ON (asset_id) asset_id, price_per_unit, recorded_at
FROM asset_valuations ORDER BY asset_id, recorded_at DESC;

-- Sparky Tweaks: Ganti nama dan pisahkan kalkulasi berdasarkan mata uang!
DROP VIEW IF EXISTS user_net_worth;

CREATE OR REPLACE VIEW user_asset_value_by_currency AS
SELECT 
    up.user_id, 
    a.currency, 
    SUM(up.total_units * lap.price_per_unit) AS total_asset_value
FROM user_portfolios up
JOIN assets a ON up.asset_id = a.id
JOIN latest_asset_prices lap ON lap.asset_id = up.asset_id 
GROUP BY up.user_id, a.currency;

-- ==========================================
-- 7. INDEXES (BIAR DATABASE NGEBUT SAAT DATA JUTAAN ⚡)
-- ==========================================
CREATE INDEX idx_fiat_tx_user_date ON fiat_transactions(user_id, transaction_date);
CREATE INDEX idx_fiat_tx_wallet ON fiat_transactions(wallet_id);
CREATE INDEX idx_asset_tx_portfolio ON asset_transactions(portfolio_id);
CREATE INDEX idx_budgets_user_date ON budgets(user_id, start_date, end_date);



-- 1. Modifikasi tabel goals untuk mendukung tracking portofolio Aset
ALTER TABLE goals
ADD COLUMN asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
ADD COLUMN target_asset_units DECIMAL(18, 8),
ADD COLUMN current_asset_units DECIMAL(18, 8) DEFAULT 0;

-- 2. Modifikasi tabel budgets untuk mendukung Multi-Kategori
ALTER TABLE budgets DROP COLUMN category_id;

CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(budget_id, category_id)
);




-- ============================================================
-- MYKANZ MOBILE — RLS (Row Level Security) Setup Script
-- Jalankan script ini di Supabase SQL Editor
--
-- Cara kerja:
-- JWT dari Edge Function "login" berisi claim { sub: user_id }
-- Supabase mengenali claim "sub" sebagai auth.uid()
-- Policy di bawah memfilter baris berdasarkan auth.uid()
-- ============================================================


-- ============================================================
-- HELPER: Aktifkan RLS di semua tabel sekaligus
-- ============================================================
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiat_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_portfolios    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_valuations   ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 1. TABEL USERS
-- User hanya bisa baca & update data dirinya sendiri
-- ============================================================
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- INSERT di-handle oleh Edge Function "register" pakai service_role
-- Tidak perlu policy INSERT untuk anon/authenticated


-- ============================================================
-- 2. TABEL WALLETS
-- ============================================================
DROP POLICY IF EXISTS "wallets_all_own" ON public.wallets;

CREATE POLICY "wallets_all_own" ON public.wallets
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- 3. TABEL CATEGORIES
-- ============================================================
DROP POLICY IF EXISTS "categories_all_own" ON public.categories;

CREATE POLICY "categories_all_own" ON public.categories
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- 4. TABEL FIAT_TRANSACTIONS
-- ============================================================
DROP POLICY IF EXISTS "fiat_transactions_all_own" ON public.fiat_transactions;

CREATE POLICY "fiat_transactions_all_own" ON public.fiat_transactions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- 5. TABEL BUDGETS
-- ============================================================
DROP POLICY IF EXISTS "budgets_all_own" ON public.budgets;

CREATE POLICY "budgets_all_own" ON public.budgets
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- 6. TABEL BUDGET_CATEGORIES
-- Akses via JOIN budget — user hanya bisa akses milik budgetnya
-- ============================================================
DROP POLICY IF EXISTS "budget_categories_all_own" ON public.budget_categories;

CREATE POLICY "budget_categories_all_own" ON public.budget_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.budgets b
      WHERE b.id = budget_id AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.budgets b
      WHERE b.id = budget_id AND b.user_id = auth.uid()
    )
  );


-- ============================================================
-- 7. TABEL GOALS
-- ============================================================
DROP POLICY IF EXISTS "goals_all_own" ON public.goals;

CREATE POLICY "goals_all_own" ON public.goals
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- 8. TABEL ASSETS
-- Assets bisa: (a) global (user_id IS NULL) - read only
--              (b) milik user sendiri - full CRUD
-- ============================================================
DROP POLICY IF EXISTS "assets_select_global_or_own" ON public.assets;
DROP POLICY IF EXISTS "assets_insert_own" ON public.assets;
DROP POLICY IF EXISTS "assets_update_own" ON public.assets;
DROP POLICY IF EXISTS "assets_delete_own" ON public.assets;

CREATE POLICY "assets_select_global_or_own" ON public.assets
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "assets_insert_own" ON public.assets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "assets_update_own" ON public.assets
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "assets_delete_own" ON public.assets
  FOR DELETE USING (user_id = auth.uid());


-- ============================================================
-- 9. TABEL USER_PORTFOLIOS
-- ============================================================
DROP POLICY IF EXISTS "user_portfolios_all_own" ON public.user_portfolios;

CREATE POLICY "user_portfolios_all_own" ON public.user_portfolios
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- 10. TABEL ASSET_TRANSACTIONS
-- ============================================================
DROP POLICY IF EXISTS "asset_transactions_all_own" ON public.asset_transactions;

CREATE POLICY "asset_transactions_all_own" ON public.asset_transactions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- 11. TABEL ASSET_VALUATIONS
-- Read: semua user bisa baca (harga aset bersifat publik)
-- Write: hanya assets milik user sendiri yg bisa diupdate
-- ============================================================
DROP POLICY IF EXISTS "asset_valuations_select_all" ON public.asset_valuations;
DROP POLICY IF EXISTS "asset_valuations_insert_own_asset" ON public.asset_valuations;

CREATE POLICY "asset_valuations_select_all" ON public.asset_valuations
  FOR SELECT USING (true);

CREATE POLICY "asset_valuations_insert_own_asset" ON public.asset_valuations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assets a
      WHERE a.id = asset_id AND a.user_id = auth.uid()
    )
  );


-- ============================================================
-- 12. VIEWS — Grant akses read ke role "authenticated"
-- Views otomatis mewarisi RLS dari tabel induknya
-- Tapi tetap perlu di-grant agar bisa di-query
-- ============================================================
GRANT SELECT ON public.wallet_balances              TO authenticated;
GRANT SELECT ON public.latest_asset_prices          TO authenticated;
GRANT SELECT ON public.user_asset_value_by_currency TO authenticated;


-- ============================================================
-- SELESAI!
-- Cek status RLS dengan query ini:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' ORDER BY tablename;
-- ============================================================


-- Patch RLS untuk tabel users (agar register bisa jalan dari anon key)
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- 1. Karena login dari Flutter sekarang nyari berdasarkan email dengan anon key,
-- kita harus membolehkan select ke semua user (login form perlu ini buat cek email).
-- Untuk keamanan, pastikan data sensitif di aplikasi diamankan di level UI.
CREATE POLICY "users_select_all" ON public.users
  FOR SELECT USING (true);

-- 2. Memperbolehkan update profil sendiri, dengan mencocokkan id.
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (true); -- Disederhanakan untuk proof of concept (karena auth.uid() kosong)

-- 3. Memperbolehkan anon key melakukan insert (REGISTER).
CREATE POLICY "users_insert_all" ON public.users
  FOR INSERT WITH CHECK (true);

-- Untuk tabel-tabel lain, karena bergantung pada auth.uid(), ini tidak akan jalan kalau kita
-- query langsung tanpa JWT token login dari Supabase Auth.
-- Karena requirement memaksa langsung tembak tanpa JWT dari Edge Function,
-- kita sementara perlu mematikan RLS atau mem-bypass-nya dengan policy `USING (true)`
-- mengingat ini POC custom Auth tanpa Edge Function.

ALTER TABLE public.wallets            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiat_transactions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_portfolios    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_valuations   DISABLE ROW LEVEL SECURITY;




