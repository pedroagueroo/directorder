-- Historial automático de cambios (audit trail)
-- Pegá y ejecutá esto en Supabase (SQL Editor) sobre una base que ya existe.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Tabla de auditoría
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid,
  brand_id uuid,
  restaurant_id uuid,
  table_name text NOT NULL,
  record_id uuid,
  operation text NOT NULL, -- INSERT / UPDATE / DELETE
  changes jsonb
);

-- 2) Función para tablas que tienen `restaurant_id` (categories, products, orders, etc.)
CREATE OR REPLACE FUNCTION public.fn_audit_log_restaurant_related()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_rest uuid := COALESCE(NEW.restaurant_id, OLD.restaurant_id);
  v_brand uuid := (SELECT r.brand_id FROM public.restaurants r WHERE r.id = v_rest);
  v_record uuid := COALESCE(NEW.id, OLD.id);
  v_changes jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object('old', NULL, 'new', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := jsonb_build_object('old', to_jsonb(OLD), 'new', NULL);
  ELSE
    v_changes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  END IF;

  INSERT INTO public.audit_logs (
    actor_user_id,
    brand_id,
    restaurant_id,
    table_name,
    record_id,
    operation,
    changes
  )
  VALUES (
    v_actor,
    v_brand,
    v_rest,
    TG_TABLE_NAME,
    v_record,
    TG_OP,
    v_changes
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Función específica para `public.restaurants`
CREATE OR REPLACE FUNCTION public.fn_audit_log_restaurants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_rest uuid := COALESCE(NEW.id, OLD.id);
  v_brand uuid := COALESCE(NEW.brand_id, OLD.brand_id, (SELECT r.brand_id FROM public.restaurants r WHERE r.id = v_rest));
  v_record uuid := v_rest;
  v_changes jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object('old', NULL, 'new', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := jsonb_build_object('old', to_jsonb(OLD), 'new', NULL);
  ELSE
    v_changes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  END IF;

  INSERT INTO public.audit_logs (
    actor_user_id,
    brand_id,
    restaurant_id,
    table_name,
    record_id,
    operation,
    changes
  )
  VALUES (
    v_actor,
    v_brand,
    v_rest,
    TG_TABLE_NAME,
    v_record,
    TG_OP,
    v_changes
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 4) Función específica para `public.order_items` (no tiene restaurant_id directo)
CREATE OR REPLACE FUNCTION public.fn_audit_log_order_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_order uuid := COALESCE(NEW.order_id, OLD.order_id);
  v_rest uuid := (SELECT o.restaurant_id FROM public.orders o WHERE o.id = v_order);
  v_brand uuid := (SELECT r.brand_id FROM public.restaurants r WHERE r.id = v_rest);
  v_record uuid := COALESCE(NEW.id, OLD.id);
  v_changes jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_changes := jsonb_build_object('old', NULL, 'new', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_changes := jsonb_build_object('old', to_jsonb(OLD), 'new', NULL);
  ELSE
    v_changes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  END IF;

  INSERT INTO public.audit_logs (
    actor_user_id,
    brand_id,
    restaurant_id,
    table_name,
    record_id,
    operation,
    changes
  )
  VALUES (
    v_actor,
    v_brand,
    v_rest,
    TG_TABLE_NAME,
    v_record,
    TG_OP,
    v_changes
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 5) RLS para que solo vean su marca (y que el trigger pueda insertar)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_select_brand" ON public.audit_logs;
CREATE POLICY "audit_select_brand" ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  brand_id = (SELECT u.brand_id FROM public.users u WHERE u.id = auth.uid())
);

DROP POLICY IF EXISTS "audit_insert_any" ON public.audit_logs;
CREATE POLICY "audit_insert_any" ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6) Triggers
DROP TRIGGER IF EXISTS trg_audit_restaurants ON public.restaurants;
CREATE TRIGGER trg_audit_restaurants
AFTER INSERT OR UPDATE OR DELETE ON public.restaurants
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_restaurants();

-- Tablas con restaurant_id directo
DROP TRIGGER IF EXISTS trg_audit_categories ON public.categories;
CREATE TRIGGER trg_audit_categories
AFTER INSERT OR UPDATE OR DELETE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_restaurant_related();

DROP TRIGGER IF EXISTS trg_audit_products ON public.products;
CREATE TRIGGER trg_audit_products
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_restaurant_related();

DROP TRIGGER IF EXISTS trg_audit_orders ON public.orders;
CREATE TRIGGER trg_audit_orders
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_restaurant_related();

DROP TRIGGER IF EXISTS trg_audit_customers ON public.customers;
CREATE TRIGGER trg_audit_customers
AFTER INSERT OR UPDATE OR DELETE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_restaurant_related();

DROP TRIGGER IF EXISTS trg_audit_tables ON public.tables;
CREATE TRIGGER trg_audit_tables
AFTER INSERT OR UPDATE OR DELETE ON public.tables
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_restaurant_related();

DROP TRIGGER IF EXISTS trg_audit_analytics_events ON public.analytics_events;
CREATE TRIGGER trg_audit_analytics_events
AFTER INSERT OR UPDATE OR DELETE ON public.analytics_events
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_restaurant_related();

DROP TRIGGER IF EXISTS trg_audit_order_items ON public.order_items;
CREATE TRIGGER trg_audit_order_items
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_order_items();

