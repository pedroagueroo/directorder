const { Client } = require('pg');

async function migrateFunctions() {
  const client = new Client({
    host: 'db.wezrbbbrndfhnxznfxza.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '25jc15pe14vi',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Conectando...');
    await client.connect();
    console.log('✅ Conectado!\n');

    // 1. handle_updated_at function
    console.log('📦 Creando funciones y triggers...');
    await client.query(`
      create or replace function public.handle_updated_at()
      returns trigger language plpgsql as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$;
    `);
    console.log('  ✅ handle_updated_at()');

    // 2. Triggers for updated_at
    try {
      await client.query(`create trigger tr_orders_updated before update on public.orders for each row execute function public.handle_updated_at();`);
      console.log('  ✅ Trigger tr_orders_updated');
    } catch (e) { console.log(`  ⚠️  ${e.message.slice(0, 80)}`); }

    try {
      await client.query(`create trigger tr_products_updated before update on public.products for each row execute function public.handle_updated_at();`);
      console.log('  ✅ Trigger tr_products_updated');
    } catch (e) { console.log(`  ⚠️  ${e.message.slice(0, 80)}`); }

    // 3. increment_sold_count function
    await client.query(`
      create or replace function public.increment_sold_count()
      returns trigger language plpgsql as $$
      begin
        if new.status = 'delivered' and old.status != 'delivered' then
          update public.products p
          set sold_count = sold_count + oi.quantity
          from public.order_items oi
          where oi.order_id = new.id and oi.product_id = p.id;
        end if;
        return new;
      end;
      $$;
    `);
    console.log('  ✅ increment_sold_count()');

    try {
      await client.query(`create trigger tr_sold_count after update on public.orders for each row execute function public.increment_sold_count();`);
      console.log('  ✅ Trigger tr_sold_count');
    } catch (e) { console.log(`  ⚠️  ${e.message.slice(0, 80)}`); }

    // 4. update_customer_stats function
    await client.query(`
      create or replace function public.update_customer_stats()
      returns trigger language plpgsql as $$
      begin
        if new.status = 'delivered' and old.status != 'delivered' and new.customer_id is not null then
          update public.customers
          set total_orders = total_orders + 1,
              total_spent  = total_spent + new.total,
              last_order_at = now(),
              loyalty_points = loyalty_points + floor(new.total / 100)::int
          where id = new.customer_id;
        end if;
        return new;
      end;
      $$;
    `);
    console.log('  ✅ update_customer_stats()');

    try {
      await client.query(`create trigger tr_customer_stats after update on public.orders for each row execute function public.update_customer_stats();`);
      console.log('  ✅ Trigger tr_customer_stats');
    } catch (e) { console.log(`  ⚠️  ${e.message.slice(0, 80)}`); }

    // 5. RLS Policies - public access
    console.log('\n🔒 Configurando políticas de acceso público...');
    const policies = [
      { table: 'restaurants', name: 'public_restaurants', sql: `create policy "public_restaurants" on public.restaurants for select using (true);` },
      { table: 'orders', name: 'public_orders_insert', sql: `create policy "public_orders_insert" on public.orders for insert with check (true);` },
      { table: 'order_items', name: 'public_order_items_insert', sql: `create policy "public_order_items_insert" on public.order_items for insert with check (true);` },
      { table: 'customers', name: 'public_customers_insert', sql: `create policy "public_customers_insert" on public.customers for insert with check (true);` },
      { table: 'customers', name: 'public_customers_select', sql: `create policy "public_customers_select" on public.customers for select using (true);` },
      { table: 'analytics_events', name: 'public_analytics_insert', sql: `create policy "public_analytics_insert" on public.analytics_events for insert with check (true);` },
    ];

    for (const pol of policies) {
      try {
        await client.query(pol.sql);
        console.log(`  ✅ ${pol.name} (${pol.table})`);
      } catch (e) { console.log(`  ⚠️  ${e.message.slice(0, 80)}`); }
    }

    // 6. Seed demo restaurant
    console.log('\n🌱 Insertando datos demo...');
    
    // Check if demo-burger already exists
    const { rows: existing } = await client.query(`SELECT id FROM public.restaurants WHERE slug = 'demo-burger'`);
    
    let rid;
    if (existing.length > 0) {
      rid = existing[0].id;
      console.log('  ⚠️  Restaurante demo-burger ya existe, usando existente');
    } else {
      const { rows: [r] } = await client.query(`
        INSERT INTO public.restaurants (slug, name, description, whatsapp, primary_color, secondary_color, is_open)
        VALUES ('demo-burger', 'Burger House', NULL, '+5491100000000', '#c0392b', '#e74c3c', true)
        RETURNING id;
      `);
      rid = r.id;
      console.log('  ✅ Restaurante demo creado (El Candil Burger House)');
    }

    // Categories
    const categories = [
      { name: 'Hamburguesas', emoji: '🍔', sort: 0 },
      { name: 'Acompañamientos', emoji: '🍟', sort: 1 },
      { name: 'Bebidas', emoji: '🥤', sort: 2 },
      { name: 'Postres', emoji: '🍰', sort: 3 },
    ];

    const catMap = {};
    for (const cat of categories) {
      const { rows } = await client.query(`
        INSERT INTO public.categories (restaurant_id, name, emoji, sort_order) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
        RETURNING id;
      `, [rid, cat.name, cat.emoji, cat.sort]);
      
      if (rows.length > 0) {
        catMap[cat.name] = rows[0].id;
      }
    }
    
    // If categories already existed, fetch them
    if (Object.keys(catMap).length < categories.length) {
      const { rows: existingCats } = await client.query(`SELECT id, name FROM public.categories WHERE restaurant_id = $1`, [rid]);
      existingCats.forEach(c => catMap[c.name] = c.id);
    }
    console.log(`  ✅ ${Object.keys(catMap).length} categorías`);

    // Products
    const products = [
      { cat: 'Hamburguesas', name: 'Hamburguesa Clásica', desc: 'Carne 150g, lechuga, tomate, cebolla y aderezo especial', price: 4500, featured: true, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80' },
      { cat: 'Hamburguesas', name: 'Hamburguesa Doble', desc: 'Doble carne 300g, doble cheddar, bacon crocante y BBQ ahumada', price: 6200, featured: true, compare: 7000, img: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=500&q=80' },
      { cat: 'Hamburguesas', name: 'Veggie Burger', desc: 'Medallón de garbanzos, palta, rúcula y salsa de mostaza', price: 4800, img: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=500&q=80' },
      { cat: 'Hamburguesas', name: 'Burger Cheddar Extreme', desc: 'Carne 200g bañada en cheddar fundido con aros de cebolla', price: 5500, featured: true, img: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=500&q=80' },
      { cat: 'Acompañamientos', name: 'Papas Fritas', desc: 'Porción generosa de papas crocantes con sal marina', price: 2200, img: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80' },
      { cat: 'Acompañamientos', name: 'Papas con Cheddar y Bacon', desc: 'Papas crocantes cubiertas con cheddar y bacon desmenuzado', price: 3200, featured: true, img: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=500&q=80' },
      { cat: 'Acompañamientos', name: 'Aros de Cebolla', desc: 'Aros crocantes rebozados con salsa BBQ', price: 2500, img: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=500&q=80' },
      { cat: 'Bebidas', name: 'Coca Cola 500ml', desc: 'Coca Cola bien fría', price: 1500, img: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=500&q=80' },
      { cat: 'Bebidas', name: 'Agua Mineral', desc: 'Agua mineral sin gas 500ml', price: 1000 },
      { cat: 'Bebidas', name: 'Cerveza Artesanal IPA', desc: 'Cerveza IPA artesanal de la casa, 473ml', price: 3200, img: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=500&q=80' },
      { cat: 'Postres', name: 'Brownie con Helado', desc: 'Brownie tibio de chocolate con helado de vainilla y dulce de leche', price: 3500, featured: true, img: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=500&q=80' },
      { cat: 'Postres', name: 'Cheesecake de Frutos Rojos', desc: 'New York cheesecake con coulis de frutos rojos', price: 3200, img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=500&q=80' },
    ];

    // Check if products already exist
    const { rows: existingProducts } = await client.query(`SELECT COUNT(*) as c FROM public.products WHERE restaurant_id = $1`, [rid]);
    
    if (parseInt(existingProducts[0].c) === 0) {
      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        await client.query(`
          INSERT INTO public.products (restaurant_id, category_id, name, description, price, compare_price, is_featured, image_url, tags, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [rid, catMap[p.cat], p.name, p.desc, p.price, p.compare || null, p.featured || false, p.img || null, '{}', i]);
      }
      console.log(`  ✅ ${products.length} productos creados con imágenes reales de Unsplash`);
    } else {
      console.log(`  ⚠️  Ya existen ${existingProducts[0].c} productos, saltado`);
    }

    // Final verification
    console.log('\n📊 Verificación final:');
    const { rows: tables } = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
    console.log(`   📋 ${tables.length} tablas: ${tables.map(t => t.table_name).join(', ')}`);
    
    const { rows: funcs } = await client.query(`SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'`);
    console.log(`   ⚙️  ${funcs.length} funciones: ${funcs.map(f => f.routine_name).join(', ')}`);

    const { rows: triggers } = await client.query(`SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public'`);
    console.log(`   🔫 ${triggers.length} triggers: ${triggers.map(t => t.trigger_name).join(', ')}`);

    const { rows: prods } = await client.query(`SELECT COUNT(*) as c FROM public.products WHERE restaurant_id = $1`, [rid]);
    console.log(`   🍔 ${prods[0].c} productos en Demo Burger`);

    console.log('\n🎉 ¡Base de datos 100% lista!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada.');
  }
}

migrateFunctions();
