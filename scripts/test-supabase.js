const { Client } = require('pg')

const CONN = 'postgresql://postgres:25jc15pe14vi@db.wezrbbbrndfhnxznfxza.supabase.co:5432/postgres'

async function run() {
  const client = new Client({ connectionString: CONN, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('✅ Conectado a Supabase PostgreSQL\n')

  // ═══════════════════════════════════════════════
  // 1. READ — Leer restaurante demo
  // ═══════════════════════════════════════════════
  console.log('━━━ TEST 1: READ ━━━')
  const { rows: [restaurant] } = await client.query(
    `SELECT id, slug, name, is_open, primary_color FROM restaurants WHERE slug = 'demo-burger'`
  )
  console.log('  Restaurante:', restaurant.name, `(${restaurant.slug})`)
  console.log('  Abierto:', restaurant.is_open, '| Color:', restaurant.primary_color)
  const rid = restaurant.id

  // Contar datos
  const { rows: [counts] } = await client.query(`
    SELECT 
      (SELECT count(*) FROM categories WHERE restaurant_id = $1) as cats,
      (SELECT count(*) FROM products WHERE restaurant_id = $1) as prods,
      (SELECT count(*) FROM orders WHERE restaurant_id = $1) as orders
  `, [rid])
  console.log(`  Categorías: ${counts.cats} | Productos: ${counts.prods} | Pedidos: ${counts.orders}`)
  console.log('  ✅ READ OK\n')

  // ═══════════════════════════════════════════════
  // 2. UPDATE — Cambiar nombre del restaurante
  // ═══════════════════════════════════════════════
  console.log('━━━ TEST 2: UPDATE ━━━')
  await client.query(
    `UPDATE restaurants SET name = 'Burger House 🔥', description = 'Test de Supabase exitoso!' WHERE id = $1`, [rid]
  )
  const { rows: [updated] } = await client.query(`SELECT name, description FROM restaurants WHERE id = $1`, [rid])
  console.log('  Nombre actualizado:', updated.name)
  console.log('  Descripción:', updated.description)
  console.log('  ✅ UPDATE OK\n')

  // ═══════════════════════════════════════════════
  // 3. CREATE — Insertar un producto de prueba
  // ═══════════════════════════════════════════════
  console.log('━━━ TEST 3: CREATE ━━━')
  const { rows: [cat] } = await client.query(
    `SELECT id FROM categories WHERE restaurant_id = $1 AND name = 'Bebidas' LIMIT 1`, [rid]
  )
  const { rows: [newProd] } = await client.query(`
    INSERT INTO products (restaurant_id, category_id, name, description, price, is_available, is_active, sort_order)
    VALUES ($1, $2, 'Limonada Casera 🍋', 'Limonada fresca con menta y jengibre', 1800, true, true, 99)
    RETURNING id, name, price
  `, [rid, cat.id])
  console.log('  Producto creado:', newProd.name, '- $' + newProd.price)
  console.log('  ID:', newProd.id)
  console.log('  ✅ CREATE OK\n')

  // ═══════════════════════════════════════════════
  // 4. CREATE ORDER — Simular un pedido completo
  // ═══════════════════════════════════════════════
  console.log('━━━ TEST 4: CREATE ORDER ━━━')
  const { rows: [order] } = await client.query(`
    INSERT INTO orders (restaurant_id, customer_name, customer_phone, type, subtotal, total, status, source, payment_method)
    VALUES ($1, 'Juan Pérez', '+5492235551234', 'delivery', 8700, 8700, 'pending', 'web', 'cash')
    RETURNING id, order_number, customer_name, total, status
  `, [rid])
  console.log('  Pedido #' + order.order_number, '- Cliente:', order.customer_name)
  console.log('  Total: $' + order.total, '| Estado:', order.status)

  // Agregar items al pedido
  await client.query(`
    INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity) VALUES
      ($1, $2, 'Limonada Casera 🍋', 1800, 2),
      ($1, NULL, 'Hamburguesa Clásica', 4500, 1)
  `, [order.id, newProd.id])

  const { rows: items } = await client.query(
    `SELECT product_name, quantity, subtotal FROM order_items WHERE order_id = $1`, [order.id]
  )
  items.forEach(i => console.log(`    • ${i.quantity}x ${i.product_name} = $${i.subtotal}`))
  console.log('  ✅ ORDER OK\n')

  // ═══════════════════════════════════════════════
  // 5. UPDATE ORDER STATUS — Simular flujo cocina
  // ═══════════════════════════════════════════════
  console.log('━━━ TEST 5: ORDER STATUS FLOW ━━━')
  const statuses = ['preparing', 'ready', 'delivered']
  for (const status of statuses) {
    await client.query(`UPDATE orders SET status = $1 WHERE id = $2`, [status, order.id])
    const { rows: [o] } = await client.query(`SELECT status, accepted_at, ready_at, delivered_at, updated_at FROM orders WHERE id = $1`, [order.id])
    console.log(`  → ${status}: updated_at=${o.updated_at ? '✓' : '✗'}`)
  }
  console.log('  ✅ STATUS FLOW OK\n')

  // ═══════════════════════════════════════════════
  // 6. CLEANUP — Limpiar datos de prueba
  // ═══════════════════════════════════════════════
  console.log('━━━ TEST 6: CLEANUP ━━━')
  await client.query(`DELETE FROM orders WHERE id = $1`, [order.id])
  await client.query(`DELETE FROM products WHERE id = $1`, [newProd.id])
  await client.query(
    `UPDATE restaurants SET name = 'Burger House', description = 'Las mejores hamburguesas de la ciudad' WHERE id = $1`, [rid]
  )
  console.log('  Pedido de prueba eliminado')
  console.log('  Producto de prueba eliminado')
  console.log('  Nombre restaurante restaurado')
  console.log('  ✅ CLEANUP OK\n')

  // ═══════════════════════════════════════════════
  // RESULTADO FINAL
  // ═══════════════════════════════════════════════
  console.log('══════════════════════════════════════')
  console.log('  🎉 TODOS LOS TESTS PASARON')
  console.log('  Supabase PostgreSQL funciona perfecto')
  console.log('══════════════════════════════════════')

  await client.end()
}

run().catch(err => { console.error('❌ FALLÓ:', err.message); process.exit(1) })
