# Funcionalidad 01: CRUD de catálogo de productos

Fuente: esquema `public` consultado con el MCP de Supabase (solo lectura, 2026-11-17) y código de `src/app/sell.tsx`. Auditoría completa y propuesta de RLS: [`03-productos-esquema-y-auditoria.md`](03-productos-esquema-y-auditoria.md).

## 1. Objetivo

Crear, listar, editar y eliminar productos desde la pantalla **Vender** (`src/app/sell.tsx`) usando Supabase PostgREST con el anon key del cliente Expo (SDK 58). El catálogo debe ser legible por cualquier visitante.

## 2. Esquema real: `public.products`

| Columna | Tipo | Nullable | Default | Restricciones |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | No | `gen_random_uuid()` | `PRIMARY KEY (id)` |
| `created_at` | `timestamptz` | No | `timezone('utc', now())` | — |
| `name` | `text` | No | — | — |
| `description` | `text` | Sí | — | — |
| `price` | `numeric(10,2)` | No | — | `CHECK (price >= 0)` |
| `stock` | `integer` | No | `0` | `CHECK (stock >= 0)` |
| `category` | `text` | No | — | — |
| `image_url` | `text` | Sí | — | — |

- No existe columna de propietario (`seller_id` / `user_id`) ni FK hacia `auth.users`.
- Es referenciada por `order_items.product_id` (`order_items_product_id_fkey`, `ON DELETE RESTRICT`).
- Índices: solo `products_pkey`. No hay triggers ni columna `updated_at`.
- RLS habilitado (no forzado). Había 6 filas al momento de la auditoría.

## 3. Permisos actuales (RLS + grants)

| Política | Roles | Comando | `USING` | `WITH CHECK` |
| --- | --- | --- | --- | --- |
| `Permitir gestión de productos` | `anon`, `authenticated` | `ALL` | `true` | `true` |
| `Permitir lectura pública de productos` | `public` | `SELECT` | `true` | — |

Las políticas son `PERMISSIVE` y se combinan con `OR`. Además, `anon` y `authenticated` tienen grants de tabla `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES` y `TRIGGER`. Resultado efectivo: **cualquier persona con la anon key puede crear, editar y borrar cualquier producto, sin iniciar sesión** (RLS no protege `TRUNCATE`).

## 4. Implementación en la app

| Operación | Ubicación | Detalle |
| --- | --- | --- |
| Read | `sell.tsx:67-80` | `select` de las 8 columnas, ordenado por `created_at DESC`. Búsqueda local por nombre/descripción/categoría en `sell.tsx:86-92`. |
| Create | `sell.tsx:115-151` | Envía `name`, `description`, `price`, `stock`, `category`, `image_url`; `id` y `created_at` los genera la BD. |
| Update | `sell.tsx:148-150` | `update(payload).eq('id', editingId)`; sin filtro de propietario. |
| Delete | `sell.tsx:162-179` | `delete().eq('id', product.id)` tras confirmación; sin filtro de propietario. |

La pantalla dice «Tus productos» (`sell.tsx:304`), pero no llama a `supabase.auth.getUser()` ni filtra por vendedor: muestra y modifica **todos** los productos. El cliente se crea en `src/lib/supabase.ts` con sesión persistida, pero `sell.tsx` no la consulta.

## 5. Validaciones

- App: nombre y categoría obligatorios; `price` finito y `>= 0` (acepta coma decimal); `stock` entero `>= 0` vía `parseInt`; `description` e `image_url` se envían como `null` si están vacíos.
- BD: `NOT NULL` en las columnas correspondientes, `price >= 0`, `stock >= 0`. No hay `CHECK` ni tabla de categorías; `image_url` es texto libre.
- Nota: PostgREST devuelve `numeric(10,2)` como string; el tipo `number | string` de `Product` lo tolera al mostrar, pero conviene enviar el precio como string para evitar pérdida de precisión.

## 6. Diferencias y riesgos (resumen)

| # | Riesgo | Severidad |
| --- | --- | --- |
| 1 | Política `ALL ... true` para `anon`: escritura pública del catálogo | Crítica |
| 2 | `products` sin propietario; imposible aplicar `auth.uid() = seller_id` | Alta |
| 3 | Sin verificación de sesión en la app | Alta |
| 4 | `SELECT` público sigue devolviendo todo tras endurecer RLS; hace falta `.eq('seller_id', user.id)` | Alta |
| 5 | Grants de `TRUNCATE`/`REFERENCES`/`TRIGGER` a roles públicos | Alta |
| 6 | `numeric` como `number` y `parseInt` en `stock` | Media |
| 7 | `price >= 0` en BD vs. documentación anterior que decía `> 0` | Media |
| 8 | Categoría e `image_url` sin validación en BD | Media |
| 9 | Borrado físico falla si el producto tiene ventas (`ON DELETE RESTRICT`) | Media |
| 10 | Sin `updated_at`, unicidad de nombre ni índices adicionales | Baja |
| 11 | Lint preexistente en `sell.tsx:83` (`set-state-in-effect`) | Media |

Detalle y SQL sugerido en [`03-productos-esquema-y-auditoria.md`](03-productos-esquema-y-auditoria.md).

## 7. SQL pendiente

Propuesta lista en [`docs/migrations/20261117120000_restrict_products_rls.sql`](migrations/20261117120000_restrict_products_rls.sql): agregar `seller_id`, backfill, default `auth.uid()`, `NOT NULL`, FK, índice, eliminar la política `ALL`, crear políticas por operación para vendedores, conservar `SELECT` público y reducir grants. Requiere decidir el propietario de las 6 filas existentes antes de ejecutarla.

**Estado: la migración NO está aplicada.** La única migración registrada en el proyecto remoto es `20261116172704_allow_public_product_management`.

## 8. Verificación local

- `npx expo lint`: 2 errores y 1 warning preexistentes (`sell.tsx:83`, `use-color-scheme.web.ts:11`, BOM en `supabase.ts`).
- `npx tsc --noEmit`: 1 error preexistente en `src/components/app-tabs.web.tsx:38`.
- No se modificó código de la app ni se aplicaron cambios en la base de datos.
