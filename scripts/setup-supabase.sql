-- Drop existing tables
DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.loyalty_points CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.tables CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.restaurants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  logo_url text,
  banner_url text,
  primary_color text DEFAULT '#e85d04',
  secondary_color text DEFAULT '#f48c06',
  whatsapp text,
  address text,
  currency text DEFAULT 'ARS',
  delivery_enabled boolean DEFAULT true,
  pickup_enabled boolean DEFAULT true,
  table_mode_enabled boolean DEFAULT false,
  min_order_amount numeric(10,2) DEFAULT 0,
  delivery_fee numeric(10,2) DEFAULT 0,
  avg_prep_minutes int DEFAULT 20,
  delivery_geocode_suffix text,
  is_open boolean DEFAULT true,
  kds_sound_new_order boolean DEFAULT true,
  kds_sound_status_change boolean DEFAULT true,
  brand_id uuid,
  is_branch boolean DEFAULT true,
  menu_source_restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  restaurant_id uuid REFERENCES public.restaurants ON DELETE CASCADE,
  brand_id uuid,
  email text,
  role text NOT NULL DEFAULT 'owner',
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants ON DELETE CASCADE,
  name text NOT NULL,
  emoji text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  compare_price numeric(10,2),
  image_url text,
  tags text[] DEFAULT '{}',
  ingredients text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  is_available boolean DEFAULT true,
  is_active boolean DEFAULT true,
  stock int,
  prep_minutes int DEFAULT 10,
  sort_order int DEFAULT 0,
  sold_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.tables (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants ON DELETE CASCADE,
  name text NOT NULL,
  qr_code text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  total_orders int DEFAULT 0,
  total_spent numeric(10,2) DEFAULT 0,
  loyalty_points int DEFAULT 0,
  tier text DEFAULT 'regular',
  last_order_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers ON DELETE SET NULL,
  table_id uuid REFERENCES public.tables ON DELETE SET NULL,
  order_number serial,
  status text NOT NULL DEFAULT 'pending',
  type text NOT NULL DEFAULT 'pickup',
  customer_name text,
  customer_phone text,
  delivery_address text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(10,2) DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  source text DEFAULT 'web',
  payment_method text DEFAULT 'cash',
  payment_received boolean DEFAULT false,
  payment_confirmed_at timestamptz,
  estimated_ready_at timestamptz,
  accepted_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders ON DELETE CASCADE,
  product_id uuid REFERENCES public.products ON DELETE SET NULL,
  product_name text NOT NULL,
  product_price numeric(10,2) NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  notes text,
  subtotal numeric(10,2) GENERATED ALWAYS AS (product_price * quantity) STORED
);

CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants ON DELETE CASCADE,
  event text NOT NULL,
  properties jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers ON DELETE CASCADE,
  points int NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX products_restaurant_idx ON public.products(restaurant_id);
CREATE INDEX categories_restaurant_idx ON public.categories(restaurant_id);
CREATE INDEX orders_restaurant_idx ON public.orders(restaurant_id, created_at DESC);
CREATE INDEX analytics_events_date_idx ON public.analytics_events(restaurant_id, created_at DESC);

-- Audit trail (historial de cambios)
CREATE TABLE public.audit_logs (
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

-- Tablas que tienen restaurant_id directo
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

-- public.restaurants (usa brand_id)
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

-- public.order_items (no tiene restaurant_id directo)
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

-- Triggers de auditoria
CREATE TRIGGER trg_audit_restaurants
AFTER INSERT OR UPDATE OR DELETE ON public.restaurants
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_restaurants();

CREATE TRIGGER trg_audit_categories
AFTER INSERT OR UPDATE OR DELETE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_restaurant_related();

CREATE TRIGGER trg_audit_products
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_restaurant_related();

CREATE TRIGGER trg_audit_orders
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_restaurant_related();

CREATE TRIGGER trg_audit_customers
AFTER INSERT OR UPDATE OR DELETE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_restaurant_related();

CREATE TRIGGER trg_audit_tables
AFTER INSERT OR UPDATE OR DELETE ON public.tables
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_restaurant_related();

CREATE TRIGGER trg_audit_analytics_events
AFTER INSERT OR UPDATE OR DELETE ON public.analytics_events
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_restaurant_related();

CREATE TRIGGER trg_audit_order_items
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_order_items();

-- Functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER tr_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "public_restaurants_read" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "public_categories_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "public_products_read" ON public.products FOR SELECT USING (true);

-- Anon insert policies
CREATE POLICY "anon_orders_insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_order_items_insert" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_analytics_insert" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_orders_read" ON public.orders FOR SELECT USING (true);
CREATE POLICY "anon_order_items_read" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "anon_orders_update" ON public.orders FOR UPDATE USING (true);

-- Auth user policies
CREATE POLICY "users_all" ON public.users USING (true) WITH CHECK (true);
CREATE POLICY "customers_all" ON public.customers USING (true) WITH CHECK (true);
CREATE POLICY "restaurants_all" ON public.restaurants USING (true) WITH CHECK (true);
CREATE POLICY "categories_all" ON public.categories USING (true) WITH CHECK (true);
CREATE POLICY "products_all" ON public.products USING (true) WITH CHECK (true);
CREATE POLICY "orders_all" ON public.orders USING (true) WITH CHECK (true);
CREATE POLICY "order_items_all" ON public.order_items USING (true) WITH CHECK (true);
CREATE POLICY "analytics_all" ON public.analytics_events USING (true) WITH CHECK (true);
CREATE POLICY "loyalty_all" ON public.loyalty_points USING (true) WITH CHECK (true);
CREATE POLICY "audit_select_brand" ON public.audit_logs
FOR SELECT TO authenticated
USING (
  brand_id = (SELECT u.brand_id FROM public.users u WHERE u.id = auth.uid())
);
CREATE POLICY "audit_insert_any" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
