-- Enlazar un usuario ya creado en Authentication con el local demo-burger.
-- 1. Supabase → Authentication → Users → copiá el UUID del usuario.
-- 2. Reemplazá AUTH_USER_ID abajo y el email si usaste otro.
-- 3. Ejecutá en SQL Editor.

INSERT INTO public.users (id, restaurant_id, brand_id, email, role, full_name)
SELECT
  'AUTH_USER_ID'::uuid,
  r.id,
  COALESCE(r.brand_id, r.id),
  'owner@demo-burger.local',
  'owner',
  'Dueño Demo'
FROM public.restaurants r
WHERE r.slug = 'demo-burger'
ON CONFLICT (id) DO UPDATE SET
  restaurant_id = EXCLUDED.restaurant_id,
  brand_id = EXCLUDED.brand_id,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;
