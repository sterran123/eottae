-- 0001_create_auth_and_users.sql
-- MATCH-003: 사용자 및 인증 세션, 계정 상태, RLS 보안 정책 마이그레이션

-- 1. 계정 상태 ENUM 정의
DO $$ BEGIN
    CREATE TYPE account_status_type AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED', 'PENDING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. users 테이블 생성
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id VARCHAR(255) UNIQUE NOT NULL, -- Supabase Auth 또는 OAuth 식별자
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    account_status account_status_type NOT NULL DEFAULT 'ACTIVE',
    adult_verified BOOLEAN NOT NULL DEFAULT FALSE, -- MATCH-004 성인 게이트 연동
    adult_verified_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. consents(이용약관 및 개인정보 동의 이력) 테이블 생성
CREATE TABLE IF NOT EXISTS public.consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    kind VARCHAR(50) NOT NULL, -- 'TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'ADULT_CONFIRMATION'
    version VARCHAR(20) NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    revoked_at TIMESTAMPTZ NULL
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON public.users(account_status);
CREATE INDEX IF NOT EXISTS idx_consents_user_id ON public.consents(user_id);

-- 5. Row Level Security (RLS) 활성화 — Default Deny 원칙
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

-- 6. users 테이블 RLS 정책:
-- 활성 상태(ACTIVE)인 본인의 사용자 정보만 조회 가능 (auth.uid() 매핑)
DROP POLICY IF EXISTS users_select_own_active ON public.users;
CREATE POLICY users_select_own_active ON public.users
    FOR SELECT
    USING (
        auth_id = auth.uid()::text 
        AND account_status = 'ACTIVE'
    );

-- 본인 정보만 수정 가능 (단, account_status와 adult_verified는 관리자/서버만 수정 가능)
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
    FOR UPDATE
    USING (
        auth_id = auth.uid()::text 
        AND account_status = 'ACTIVE'
    )
    WITH CHECK (
        auth_id = auth.uid()::text 
        AND account_status = 'ACTIVE'
    );

-- consents 테이블 RLS 정책: 본인의 동의 이력만 조회 및 추가 가능
DROP POLICY IF EXISTS consents_select_own ON public.consents;
CREATE POLICY consents_select_own ON public.consents
    FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_id = auth.uid()::text AND account_status = 'ACTIVE'
        )
    );

DROP POLICY IF EXISTS consents_insert_own ON public.consents;
CREATE POLICY consents_insert_own ON public.consents
    FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_id = auth.uid()::text AND account_status = 'ACTIVE'
        )
    );
