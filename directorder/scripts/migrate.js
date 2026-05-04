const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const client = new Client({
    host: 'db.wezrbbbrndfhnxznfxza.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '25jc15pe14vi',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Conectando a Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado exitosamente!\n');

    // Read the schema SQL
    const schemaPath = path.join(__dirname, '..', '..', 'docs', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Split into individual statements for better error handling
    // Remove comments and split by semicolons
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📦 Ejecutando ${statements.length} sentencias SQL...\n`);

    let success = 0;
    let errors = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      // Skip empty or comment-only statements
      const cleanStmt = stmt.replace(/--.*$/gm, '').trim();
      if (!cleanStmt) continue;

      try {
        await client.query(cleanStmt + ';');
        success++;
        // Show progress for key operations
        if (cleanStmt.toLowerCase().includes('create table')) {
          const tableName = cleanStmt.match(/create table\s+\S+\.(\S+)/i);
          console.log(`  ✅ Tabla creada: ${tableName ? tableName[1] : 'unknown'}`);
        } else if (cleanStmt.toLowerCase().includes('create index')) {
          console.log(`  ✅ Índice creado`);
        } else if (cleanStmt.toLowerCase().includes('create or replace function')) {
          const funcName = cleanStmt.match(/function\s+\S+\.(\S+)/i);
          console.log(`  ✅ Función creada: ${funcName ? funcName[1] : 'unknown'}`);
        } else if (cleanStmt.toLowerCase().includes('create trigger')) {
          const trigName = cleanStmt.match(/trigger\s+(\S+)/i);
          console.log(`  ✅ Trigger creado: ${trigName ? trigName[1] : 'unknown'}`);
        } else if (cleanStmt.toLowerCase().includes('create policy')) {
          const polName = cleanStmt.match(/policy\s+"([^"]+)"/i);
          console.log(`  ✅ Política RLS: ${polName ? polName[1] : 'unknown'}`);
        } else if (cleanStmt.toLowerCase().includes('enable row level security')) {
          const tblName = cleanStmt.match(/table\s+\S+\.(\S+)/i);
          console.log(`  🔒 RLS habilitado: ${tblName ? tblName[1] : 'unknown'}`);
        } else if (cleanStmt.toLowerCase().includes('insert into')) {
          console.log(`  🌱 Seed data insertado`);
        } else {
          console.log(`  ✅ Sentencia ${i+1} ejecutada`);
        }
      } catch (err) {
        errors++;
        // Check if it's a "already exists" type error - that's OK
        if (err.message.includes('already exists')) {
          console.log(`  ⚠️  Ya existe (saltado): ${err.message.slice(0, 80)}`);
        } else {
          console.log(`  ❌ Error en sentencia ${i+1}: ${err.message.slice(0, 120)}`);
        }
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 Resultado: ${success} exitosas, ${errors} con errores`);

    // Verify tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log(`\n📋 Tablas en schema public:`);
    result.rows.forEach(r => console.log(`   📄 ${r.table_name}`));
    console.log(`\n🎉 Total: ${result.rows.length} tablas creadas!`);

    // Enable realtime for orders and order_items
    console.log('\n🔄 Habilitando Realtime para orders y order_items...');
    try {
      await client.query(`
        alter publication supabase_realtime add table public.orders;
      `);
      console.log('  ✅ Realtime habilitado para orders');
    } catch (e) {
      console.log(`  ⚠️  orders realtime: ${e.message.slice(0, 80)}`);
    }
    try {
      await client.query(`
        alter publication supabase_realtime add table public.order_items;
      `);
      console.log('  ✅ Realtime habilitado para order_items');
    } catch (e) {
      console.log(`  ⚠️  order_items realtime: ${e.message.slice(0, 80)}`);
    }

    console.log('\n🚀 ¡Migración completa!');

  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada.');
  }
}

migrate();
