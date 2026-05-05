const { Client } = require('pg');

async function fixAuthFunctions() {
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

    // Create helper functions in PUBLIC schema (instead of auth)
    console.log('📦 Creando funciones helper en schema public...');
    
    await client.query(`
      create or replace function public.get_user_restaurant_id()
      returns uuid language sql stable security definer as $$
        select restaurant_id from public.users where id = auth.uid()
      $$;
    `);
    console.log('  ✅ public.get_user_restaurant_id()');

    await client.query(`
      create or replace function public.get_user_role()
      returns text language sql stable security definer as $$
        select role from public.users where id = auth.uid()
      $$;
    `);
    console.log('  ✅ public.get_user_role()');

    // Update tenant isolation policy to use public function
    console.log('\n🔒 Actualizando política de tenant isolation...');
    try {
      await client.query(`drop policy if exists "tenant_isolation" on public.orders;`);
      await client.query(`
        create policy "tenant_isolation" on public.orders
          using (restaurant_id = public.get_user_restaurant_id());
      `);
      console.log('  ✅ Policy actualizada para orders');
    } catch (e) { console.log(`  ⚠️  ${e.message.slice(0, 100)}`); }

    // Verify
    console.log('\n📊 Verificación:');
    const { rows: funcs } = await client.query(`
      SELECT routine_name FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' 
      AND routine_name LIKE 'get_user%'
    `);
    console.log(`   ✅ Funciones helper: ${funcs.map(f => f.routine_name).join(', ')}`);

    const { rows: pols } = await client.query(`
      SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
    `);
    console.log(`   ✅ ${pols.length} políticas RLS activas:`);
    pols.forEach(p => console.log(`      - ${p.policyname} (${p.tablename})`));

    console.log('\n🎉 ¡Funciones auth alternativas creadas correctamente!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada.');
  }
}

fixAuthFunctions();
