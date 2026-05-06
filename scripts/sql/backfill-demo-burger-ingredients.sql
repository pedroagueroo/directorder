-- Ejecutar una vez en SQL Editor si los productos demo ya existen sin ingredientes.
-- Actualiza TODOS los productos del menú seed del local slug demo-burger (12 ítems).

DO $$
DECLARE
  rid uuid;
BEGIN
  SELECT id INTO rid FROM public.restaurants WHERE slug = 'demo-burger';
  IF rid IS NULL THEN
    RAISE NOTICE 'No hay restaurant con slug demo-burger';
    RETURN;
  END IF;

  -- Hamburguesas
  UPDATE public.products SET ingredients = ARRAY['Pan','Medallón de carne 150g','Queso cheddar','Lechuga','Tomate','Cebolla','Aderezo']::text[]
  WHERE restaurant_id = rid AND name = 'Hamburguesa Clásica';

  UPDATE public.products SET ingredients = ARRAY['Pan','Doble medallón de carne','Doble cheddar','Bacon','Cebolla caramelizada','Salsa BBQ']::text[]
  WHERE restaurant_id = rid AND name = 'Hamburguesa Doble';

  UPDATE public.products SET ingredients = ARRAY['Pan','Medallón veggie (garbanzos)','Palta','Rúcula','Brotes','Salsa de mostaza']::text[]
  WHERE restaurant_id = rid AND name = 'Veggie Burger';

  UPDATE public.products SET ingredients = ARRAY['Pan','Carne 200g','Cheddar fundido','Aros de cebolla','Bacon','Salsa house']::text[]
  WHERE restaurant_id = rid AND name = 'Burger Cheddar Extreme';

  -- Acompañamientos
  UPDATE public.products SET ingredients = ARRAY['Papas','Sal marina','Aceite','Corte fino','Salsa ketchup (opcional)']::text[]
  WHERE restaurant_id = rid AND name = 'Papas Fritas';

  UPDATE public.products SET ingredients = ARRAY['Papas','Cheddar fundido','Bacon','Cebolla verde','Crema agria (opcional)']::text[]
  WHERE restaurant_id = rid AND name = 'Papas con Cheddar y Bacon';

  UPDATE public.products SET ingredients = ARRAY['Aros de cebolla','Rebozado','Salsa BBQ','Perejil']::text[]
  WHERE restaurant_id = rid AND name = 'Aros de Cebolla';

  -- Bebidas
  UPDATE public.products SET ingredients = ARRAY['Bebida 500 ml','Hielo','Vaso','Pajita (opcional)']::text[]
  WHERE restaurant_id = rid AND name = 'Coca Cola 500ml';

  UPDATE public.products SET ingredients = ARRAY['Agua mineral 500 ml','Hielo (opcional)','Vaso']::text[]
  WHERE restaurant_id = rid AND name = 'Agua Mineral';

  UPDATE public.products SET ingredients = ARRAY['Cerveza 473 ml','Copa helada','Espuma','Rodaja de limón (opcional)']::text[]
  WHERE restaurant_id = rid AND name = 'Cerveza Artesanal IPA';

  -- Postres
  UPDATE public.products SET ingredients = ARRAY['Brownie chocolate','Helado vainilla','Dulce de leche','Cacao en polvo']::text[]
  WHERE restaurant_id = rid AND name = 'Brownie con Helado';

  UPDATE public.products SET ingredients = ARRAY['Base galleta','Crema cheesecake','Coulis frutos rojos','Frutillas frescas']::text[]
  WHERE restaurant_id = rid AND name = 'Cheesecake de Frutos Rojos';
END $$;
