import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase/server'

function safeJson(val: unknown) {
  try {
    return JSON.stringify(val)
  } catch {
    return null
  }
}

function logToMarkdownLine(log: any) {
  const when = log?.created_at ? String(log.created_at) : ''
  const op = log?.operation ? String(log.operation) : ''
  const table = log?.table_name ? String(log.table_name) : ''
  const recordId = log?.record_id ? String(log.record_id) : ''

  // Intento de “titulo” humano desde cambios (si existen)
  const changes = log?.changes ?? null
  const newRow = changes?.new ?? null
  const oldRow = changes?.old ?? null
  const title =
    newRow?.name ||
    newRow?.slug ||
    newRow?.order_number ||
    oldRow?.name ||
    oldRow?.slug ||
    oldRow?.order_number ||
    ''

  const changesPreview = safeJson(changes)?.slice(0, 180) ?? ''
  const titlePart = title ? ` — ${String(title)}` : ''

  return `- ${when} · ${op} · ${table} · ${recordId}${titlePart}${changesPreview ? ` · ${changesPreview}${changesPreview.length >= 180 ? '…' : ''}` : ''}`
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const format = url.searchParams.get('format') ?? 'json' // json | md
  const limit = Number(url.searchParams.get('limit') ?? '200')

  const userId = cookies().get('auth-user-id')?.value
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createServerSupabase()

  const { data: user } = await supabase
    .from('users')
    .select('brand_id')
    .eq('id', userId)
    .single()

  const brandId = user?.brand_id
  if (!brandId) {
    return NextResponse.json({ error: 'No se pudo resolver tu marca.' }, { status: 400 })
  }

  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('created_at, table_name, record_id, operation, changes')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(Math.max(1, Math.min(500, limit)))

  if (error) {
    return NextResponse.json({ error: 'No se pudo cargar historial.' }, { status: 500 })
  }

  if (format === 'md') {
    const header = `# Historial de cambios (DirectOrder)\n\nMarca: ${String(brandId)}\n\nGenerado en: ${new Date().toISOString()}\n\n`
    const body = (logs ?? []).map(logToMarkdownLine).join('\n')
    return new NextResponse(header + body + '\n', {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    })
  }

  return NextResponse.json(logs ?? [])
}

