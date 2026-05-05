# Base de datos DirectOrder (Supabase / PostgreSQL)

Referencia para quien administra el proyecto en Supabase: tablas, columnas relevantes y migraciones.

## Instalación desde cero

El esquema completo (incluye multi-sucursal) está en:

- `scripts/setup-supabase.js` — script Node que ejecuta el SQL embebido (recrea tablas; **borra datos** si se usa tal cual).

Para entornos nuevos, conviene basarse en ese archivo o exportar el SQL del mismo.

## Bases ya creadas (sin multi-sucursal)

Si el proyecto se creó **antes** de incorporar sucursales compartidas, ejecutar **una vez** en el SQL Editor de Supabase:

- `scripts/migrate-multi-branch.sql`

Eso agrega columnas y rellena `brand_id` / `menu_source_restaurant_id` para filas existentes.

## Historial automático (audit logs)

Para que *cada vez que un usuario cree/edite/elimine* cosas en el menú o pedidos quede un historial guardado en Supabase, agregamos una tabla de auditoría y triggers.

- `scripts/migrate-audit-logging.sql` (para bases ya creadas)

En la app podés exportar ese historial con:

- JSON: `/api/audit-logs`
- Markdown (archivo listo para copiar/mandar): `/api/audit-logs?format=md`

---

## Tablas principales

### `public.restaurants`

| Columna | Tipo | Notas |
|--------|------|--------|
| `id` | uuid PK | |
| `slug` | text UNIQUE | URL pública del menú |
| `name`, `description`, `whatsapp`, `address` | text | |
| `logo_url`, `banner_url` | text | |
| `primary_color`, `secondary_color` | text | |
| `currency` | text | ej. ARS |
| `delivery_enabled`, `pickup_enabled`, `table_mode_enabled` | boolean | |
| `min_order_amount`, `delivery_fee` | numeric | |
| `avg_prep_minutes` | int | |
| `is_open` | boolean | |
| `kds_sound_new_order`, `kds_sound_status_change` | boolean | |
| **`brand_id`** | uuid | Misma marca = varias sucursales comparten este id |
| **`is_branch`** | boolean | Sucursal operativa (default true) |
| **`menu_source_restaurant_id`** | uuid FK → `restaurants(id)` | Menú compartido: apunta al restaurante “fuente” del catálogo |
| `created_at`, `updated_at` | timestamptz | |

### `public.users`

| Columna | Tipo | Notas |
|--------|------|--------|
| `id` | uuid PK | = `auth.users.id` |
| `restaurant_id` | uuid FK | Sucursal “principal” / legado |
| **`brand_id`** | uuid | Alineado con `restaurants.brand_id` de la marca |
| `email`, `role`, `full_name`, `avatar_url` | | |
| `created_at` | timestamptz | |

### Otras tablas

- **`categories`**, **`products`** — ligadas a `restaurant_id` (el menú editable vive en el restaurante **fuente** cuando hay menú compartido).
- **`orders`**, **`order_items`** — `restaurant_id` en pedidos es la **sucursal** que recibe el pedido.
- **`customers`**, **`tables`**, **`analytics_events`**, **`loyalty_points`** — según `scripts/setup-supabase.js`.

---

## Índices (resumen)

Definidos en `setup-supabase.js`, entre otros:

- `products_restaurant_idx`, `categories_restaurant_idx`
- `orders_restaurant_idx (restaurant_id, created_at DESC)`
- `analytics_events_date_idx`

---

## RLS y políticas

Habilitadas en tablas públicas; políticas de lectura/escritura están en el mismo script de setup. Revisar `scripts/setup-supabase.js` tras cambios de seguridad.

---

## Archivos relacionados en el repo

| Archivo | Propósito |
|---------|-----------|
| `scripts/setup-supabase.js` | Esquema completo (desarrollo / reset) |
| `scripts/migrate-multi-branch.sql` | Migración incremental multi-sucursal |
| `scripts/seed-supabase.js` | Datos demo (opcional) |
| `docs/DATABASE_CHANGES.md` | **Historial** de cambios de esquema por commit |

Para el historial automático al commitear, ver `docs/GITHOOKS.md`.
