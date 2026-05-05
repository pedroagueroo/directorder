-- Opcional: ejecutar en Supabase SQL Editor si la tabla ya existe sin esta columna.
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS delivery_geocode_suffix text;

COMMENT ON COLUMN public.restaurants.delivery_geocode_suffix IS
  'Sufijo para geocodificar direcciones de delivery. Ej: Mar del Plata, Buenos Aires, Argentina. NULL o vacío = validar solo formato (calle/número), sin API de mapas.';
