const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const SQL_PATH = path.join(__dirname, 'setup-supabase.sql')
const SQL = fs.readFileSync(SQL_PATH, 'utf8')

async function run() {
  const connectionString = process.env.SUPABASE_DB_URL
  if (!connectionString) {
    console.error('❌ Falta SUPABASE_DB_URL en variables de entorno.')
    console.error('Ejemplo:')
    console.error('  SUPABASE_DB_URL=postgresql://postgres:<PASSWORD>@db.<project-ref>.supabase.co:5432/postgres')
    process.exit(1)
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })
  
  try {
    console.log('Connecting to Supabase...')
    await client.connect()
    console.log('Connected! Executing schema...')
    await client.query(SQL)
    console.log('✅ Schema created successfully!')
    
    // Verify tables
    const { rows } = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `)
    console.log('Tables created:', rows.map(r => r.tablename).join(', '))
  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    await client.end()
  }
}

run()
