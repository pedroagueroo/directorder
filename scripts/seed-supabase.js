const { Client } = require('pg')

const SEED_SQL = `
-- Demo restaurant
INSERT INTO public.restaurants (slug, name, description, whatsapp, primary_color, secondary_color, is_open, delivery_enabled, pickup_enabled, table_mode_enabled, avg_prep_minutes)
VALUES ('demo-burger', 'Burger House', 'Las mejores hamburguesas de la ciudad', '+5492235049768', '#c0392b', '#e74c3c', true, true, true, true, 25)
ON CONFLICT (slug) DO NOTHING;

-- Get demo restaurant id
DO $$
DECLARE
  rid uuid;
BEGIN
  SELECT id INTO rid FROM public.restaurants WHERE slug = 'demo-burger';
  
  -- Categories
  INSERT INTO public.categories (restaurant_id, name, emoji, sort_order, is_active) VALUES
    (rid, 'Hamburguesas', '🍔', 0, true),
    (rid, 'Acompañamientos', '🍟', 1, true),
    (rid, 'Bebidas', '🥤', 2, true),
    (rid, 'Postres', '🍰', 3, true);
  
  -- Products
  INSERT INTO public.products (restaurant_id, category_id, name, description, price, is_featured, is_available, is_active, image_url, sort_order) VALUES
    (rid, (SELECT id FROM public.categories WHERE restaurant_id = rid AND name = 'Hamburguesas' LIMIT 1),
     'Hamburguesa Clásica', 'Carne 150g, lechuga, tomate, cebolla y aderezo especial', 4500, true, true, true,
     'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80', 0),
    
    (rid, (SELECT id FROM public.categories WHERE restaurant_id = rid AND name = 'Hamburguesas' LIMIT 1),
     'Hamburguesa Doble', 'Doble carne 300g, doble cheddar, bacon crocante y BBQ ahumada', 6200, true, true, true,
     'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=500&q=80', 1),
    
    (rid, (SELECT id FROM public.categories WHERE restaurant_id = rid AND name = 'Hamburguesas' LIMIT 1),
     'Veggie Burger', 'Medallón de garbanzos, palta, rúcula y salsa de mostaza', 4800, false, true, true,
     'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=500&q=80', 2),
    
    (rid, (SELECT id FROM public.categories WHERE restaurant_id = rid AND name = 'Hamburguesas' LIMIT 1),
     'Burger Cheddar Extreme', 'Carne 200g bañada en cheddar fundido con aros de cebolla', 5500, true, true, true,
     'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=500&q=80', 3),
    
    (rid, (SELECT id FROM public.categories WHERE restaurant_id = rid AND name = 'Acompañamientos' LIMIT 1),
     'Papas Fritas', 'Porción generosa de papas crocantes con sal marina', 2200, false, true, true,
     'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80', 4),
    
    (rid, (SELECT id FROM public.categories WHERE restaurant_id = rid AND name = 'Acompañamientos' LIMIT 1),
     'Papas con Cheddar y Bacon', 'Papas crocantes cubiertas con cheddar y bacon desmenuzado', 3200, true, true, true,
     'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=500&q=80', 5),
    
    (rid, (SELECT id FROM public.categories WHERE restaurant_id = rid AND name = 'Acompañamientos' LIMIT 1),
     'Aros de Cebolla', 'Aros crocantes rebozados con salsa BBQ', 2500, false, true, true,
     'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=500&q=80', 6),
    
    (rid, (SELECT id FROM public.categories WHERE restaurant_id = rid AND name = 'Bebidas' LIMIT 1),
     'Coca Cola 500ml', 'Coca-Cola sabor original, 500 ml', 1500, false, true, true,
     'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80', 7),
    
    (rid, (SELECT id FROM public.categories WHERE restaurant_id = rid AND name = 'Bebidas' LIMIT 1),
     'Agua Mineral', 'Agua mineral sin gas 500ml', 1000, false, true, true,
     'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=500&q=80', 8),
    
    (rid, (SELECT id FROM public.categories WHERE restaurant_id = rid AND name = 'Bebidas' LIMIT 1),
     'Cerveza Artesanal IPA', 'Cerveza IPA artesanal de la casa, 473ml', 3200, false, true, true,
     'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=500&q=80', 9),
    
    (rid, (SELECT id FROM public.categories WHERE restaurant_id = rid AND name = 'Postres' LIMIT 1),
     'Brownie con Helado', 'Brownie tibio de chocolate con helado de vainilla y dulce de leche', 3500, true, true, true,
     'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=500&q=80', 10),
    
    (rid, (SELECT id FROM public.categories WHERE restaurant_id = rid AND name = 'Postres' LIMIT 1),
     'Cheesecake de Frutos Rojos', 'New York cheesecake con coulis de frutos rojos', 3200, false, true, true,
     'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=500&q=80', 11);
END $$;
`

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:25jc15pe14vi@db.wezrbbbrndfhnxznfxza.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('Connecting...')
    await client.connect()
    console.log('Seeding demo data...')
    await client.query(SEED_SQL)
    console.log('✅ Demo data seeded!')

    // Verify
    const { rows: cats } = await client.query(`SELECT name FROM public.categories ORDER BY sort_order`)
    console.log('Categories:', cats.map(r => r.name).join(', '))
    const { rows: prods } = await client.query(`SELECT name, price FROM public.products ORDER BY sort_order`)
    console.log('Products:', prods.length, 'items')
    prods.forEach(p => console.log(`  - ${p.name}: $${p.price}`))
  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    await client.end()
  }
}

run()
