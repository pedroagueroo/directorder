# Cambios en la base de datos (registro para Supabase)

Este archivo sirve para **compartir con quien administra la base** (por ejemplo tu amigo) qué tocó el esquema o las migraciones en cada cambio.

## Cómo se actualiza

- **Automático:** si tenés activados los git hooks (ver `docs/GITHOOKS.md`), cada **commit** que modifique archivos de base de datos agrega una entrada abajo con el hash y la lista de archivos.
- **Manual:** podés pegar aquí cualquier SQL que ejecuten en Supabase y la fecha.

---

## Historial

<!-- ENTRIES_START -->

### 2026-05-05 — Estado inicial documentado (multi-sucursal)

**Contexto:** Esquema en `scripts/setup-supabase.js` incluye columnas multi-sucursal en `restaurants` y `users`. Bases creadas **antes** de eso deben aplicar `scripts/migrate-multi-branch.sql` en el SQL Editor de Supabase.

**Columnas agregadas (resumen):**

- `restaurants.brand_id` (uuid)
- `restaurants.is_branch` (boolean, default true)
- `restaurants.menu_source_restaurant_id` (uuid, FK a `restaurants.id`, ON DELETE SET NULL)
- `users.brand_id` (uuid)

**Migración SQL incremental:** `scripts/migrate-multi-branch.sql`

---

<!-- ENTRIES_END -->
