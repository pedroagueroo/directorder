-- Ejecutar en Supabase SQL Editor (o psql) si la base ya existía sin columnas multi-sucursal.
-- Ajustá el orden si alguna columna ya existe.

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS brand_id uuid,
  ADD COLUMN IF NOT EXISTS is_branch boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS menu_source_restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE SET NULL;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS brand_id uuid;

UPDATE public.restaurants SET brand_id = id WHERE brand_id IS NULL;
UPDATE public.restaurants SET menu_source_restaurant_id = id WHERE menu_source_restaurant_id IS NULL;

UPDATE public.users u
SET brand_id = r.brand_id
FROM public.restaurants r
WHERE u.restaurant_id = r.id AND u.brand_id IS NULL;
