/**
 * Crea (o re-enlaza) el dueño de prueba para el local demo-burger:
 * - Usuario en auth (email confirmado)
 * - Fila en public.users apuntando al restaurante slug `demo-burger`
 *
 * Requisitos:
 * 1. Variables en .env.local (o entorno): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * 2. Que exista el restaurante demo-burger (ej. npm run seed:demo o scripts/seed-supabase.js)
 *
 * Credenciales por defecto (sobrescribibles):
 *   DEMO_OWNER_EMAIL    default: owner@demo-burger.local
 *   DEMO_OWNER_PASSWORD default: DemoBurger123!
 *   DEMO_OWNER_NAME     default: Dueño Demo
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

function loadEnvFiles() {
  const root = path.join(__dirname, '..')
  for (const name of ['.env.local', '.env']) {
    const p = path.join(root, name)
    if (!fs.existsSync(p)) continue
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = val
    }
  }
}

async function findAuthUserByEmail(adminClient, email) {
  const target = email.toLowerCase()
  let page = 1
  const perPage = 200
  for (;;) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const found = data.users.find((u) => (u.email || '').toLowerCase() === target)
    if (found) return found
    if (data.users.length < perPage) return null
    page += 1
  }
}

async function main() {
  loadEnvFiles()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const email = (process.env.DEMO_OWNER_EMAIL || 'owner@demo-burger.local').trim().toLowerCase()
  const password = process.env.DEMO_OWNER_PASSWORD || 'DemoBurger123!'
  const fullName = (process.env.DEMO_OWNER_NAME || 'Dueño Demo').trim()

  if (!url || !serviceKey) {
    console.error(
      'Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local (service role: Supabase → Settings → API).'
    )
    process.exit(1)
  }

  if (password.length < 6) {
    console.error('DEMO_OWNER_PASSWORD debe tener al menos 6 caracteres.')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('id, brand_id, slug, name')
    .eq('slug', 'demo-burger')
    .maybeSingle()

  if (restError) {
    console.error('Error leyendo restaurants:', restError.message)
    process.exit(1)
  }
  if (!restaurant) {
    console.error(
      'No existe el restaurante con slug "demo-burger". Ejecutá antes el seed (npm run seed:demo o scripts/seed-supabase.js).'
    )
    process.exit(1)
  }

  const brandId = restaurant.brand_id || restaurant.id

  let userId
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createError) {
    const msg = createError.message || ''
    if (/already|registered|duplicate/i.test(msg)) {
      const existing = await findAuthUserByEmail(supabase, email)
      if (!existing) {
        console.error('No se pudo crear el usuario y no se encontró por email:', createError.message)
        process.exit(1)
      }
      userId = existing.id
      const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
        password,
        user_metadata: { full_name: fullName },
      })
      if (updErr) {
        console.warn('Usuario ya existía; no se pudo actualizar contraseña:', updErr.message)
      } else {
        console.log('Usuario auth ya existía: contraseña y nombre actualizados.')
      }
    } else {
      console.error('createUser:', createError.message)
      process.exit(1)
    }
  } else {
    userId = created.user.id
    console.log('Usuario auth creado.')
  }

  const { error: upsertError } = await supabase.from('users').upsert(
    {
      id: userId,
      restaurant_id: restaurant.id,
      brand_id: brandId,
      email,
      role: 'owner',
      full_name: fullName,
    },
    { onConflict: 'id' }
  )

  if (upsertError) {
    console.error('Error en public.users:', upsertError.message)
    process.exit(1)
  }

  console.log('')
  console.log('✅ Listo. Podés iniciar sesión en /login con:')
  console.log('   Email:    ', email)
  console.log('   Password: ', password)
  console.log('   Local:    ', restaurant.name, `(/${restaurant.slug})`)
  console.log('')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
