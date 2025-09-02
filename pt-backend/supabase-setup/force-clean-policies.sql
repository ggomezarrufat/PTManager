    -- LIMPIEZA FORZADA DE TODAS LAS POLÍTICAS RLS
    -- Ejecutar en el SQL Editor de Supabase

    -- ===========================================
    -- ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
    -- ===========================================

    -- Método agresivo: eliminar todas las políticas de las tablas problemáticas
    DO $$
    DECLARE
        policy_record RECORD;
    BEGIN
        -- Eliminar todas las políticas de rebuys
        FOR policy_record IN
            SELECT schemaname, tablename, policyname
            FROM pg_policies
            WHERE schemaname = 'public'
            AND tablename = 'rebuys'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                        policy_record.policyname,
                        policy_record.schemaname,
                        policy_record.tablename);
            RAISE NOTICE 'Dropped policy: %.%', policy_record.tablename, policy_record.policyname;
        END LOOP;

        -- Eliminar todas las políticas de addons
        FOR policy_record IN
            SELECT schemaname, tablename, policyname
            FROM pg_policies
            WHERE schemaname = 'public'
            AND tablename = 'addons'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                        policy_record.policyname,
                        policy_record.schemaname,
                        policy_record.tablename);
            RAISE NOTICE 'Dropped policy: %.%', policy_record.tablename, policy_record.policyname;
        END LOOP;

        -- Eliminar todas las políticas de tournament_players
        FOR policy_record IN
            SELECT schemaname, tablename, policyname
            FROM pg_policies
            WHERE schemaname = 'public'
            AND tablename = 'tournament_players'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                        policy_record.policyname,
                        policy_record.schemaname,
                        policy_record.tablename);
            RAISE NOTICE 'Dropped policy: %.%', policy_record.tablename, policy_record.policyname;
        END LOOP;
    END $$;

    -- Asegurar que RLS esté habilitado
    ALTER TABLE public.rebuys ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;

    -- ===========================================
    -- CREAR POLÍTICAS COMPLETAMENTE NUEVAS
    -- ===========================================

    -- POLÍTICAS PARA REBUYS
    CREATE POLICY "rebuys_select_public" ON public.rebuys
    FOR SELECT USING (true);

    CREATE POLICY "rebuys_insert_admin" ON public.rebuys
    FOR INSERT WITH CHECK (
        EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
        )
    );

    CREATE POLICY "rebuys_update_admin" ON public.rebuys
    FOR UPDATE USING (
        EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
        )
    );

    CREATE POLICY "rebuys_delete_admin" ON public.rebuys
    FOR DELETE USING (
        EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
        )
    );

    -- POLÍTICAS PARA ADDONS
    CREATE POLICY "addons_select_public" ON public.addons
    FOR SELECT USING (true);

    CREATE POLICY "addons_insert_admin" ON public.addons
    FOR INSERT WITH CHECK (
        EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
        )
    );

    CREATE POLICY "addons_update_admin" ON public.addons
    FOR UPDATE USING (
        EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
        )
    );

    CREATE POLICY "addons_delete_admin" ON public.addons
    FOR DELETE USING (
        EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
        )
    );

    -- POLÍTICAS PARA TOURNAMENT_PLAYERS
    CREATE POLICY "tournament_players_select_public" ON public.tournament_players
    FOR SELECT USING (true);

    CREATE POLICY "tournament_players_insert_public" ON public.tournament_players
    FOR INSERT WITH CHECK (true);

    CREATE POLICY "tournament_players_update_own_admin" ON public.tournament_players
    FOR UPDATE USING (
        auth.uid() = user_id
        OR
        EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
        )
    );

    CREATE POLICY "tournament_players_delete_admin" ON public.tournament_players
    FOR DELETE USING (
        EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
        )
    );

    -- ===========================================
-- DIAGNÓSTICO DE ADMINISTRADOR
-- ===========================================

-- Verificar si existe la tabla profiles
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
) as profiles_table_exists;

-- Verificar columnas de la tabla profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar usuario específico
SELECT
    id,
    email,
    is_admin,
    created_at
FROM public.profiles
WHERE id = '32e07333-5000-4340-bd90-20c5c37d9042';

-- Verificar si hay usuarios admin
SELECT COUNT(*) as admin_users_count
FROM public.profiles
WHERE is_admin = true;

-- Probar consulta de política RLS manualmente
SELECT
    '32e07333-5000-4340-bd90-20c5c37d9042' as auth_uid,
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = '32e07333-5000-4340-bd90-20c5c37d9042'
        AND profiles.is_admin = true
    ) as is_admin_check;

-- Verificar permisos RLS actuales
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('rebuys', 'addons', 'tournament_players');

-- ===========================================
-- VERIFICACIÓN FINAL
-- ===========================================

-- Verificar que se crearon exactamente 4 políticas por tabla
SELECT
  tablename,
  COUNT(*) as total_policies,
  STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('rebuys', 'addons', 'tournament_players')
GROUP BY tablename
ORDER BY tablename;
