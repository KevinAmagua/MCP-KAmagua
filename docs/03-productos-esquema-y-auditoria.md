# Productos: esquema real, auditoría de `sell.tsx` y propuesta de RLS

Fuente: MCP de Supabase, consultas de solo lectura del schema `public` (2026-11-17). No se aplicaron cambios en la base de datos.

Las 5 tablas base de `public` son: `order_items`, `orders`, `products`, `tareas` y `universidad_tareas`.

## 1. Esquema real de `public.products`

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

- `products` **no tiene columna de propietario** (`user_id` / `seller_id`) ni FK hacia `auth.users`.
- `products` es referenciada por `order_items.product_id` mediante `order_items_product_id_fkey` con `ON DELETE RESTRICT`.
- RLS: **habilitado** (no forzado). Índices: solo `products_pkey`. Sin triggers.
- Grants de tabla: `anon` y `authenticated` tienen `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES` y `TRIGGER`. RLS **no** protege `TRUNCATE`.

### Políticas RLS actuales de `products`

| Política | Roles | Comando | `USING` | `WITH CHECK` |
| --- | --- | --- | --- | --- |
| `Permitir gestión de productos` | `anon`, `authenticated` | `ALL` | `true` | `true` |
| `Permitir lectura pública de productos` | `public` | `SELECT` | `true` | — |

Las políticas `PERMISSIVE` se combinan con `OR`. En la práctica, `anon` y `authenticated` pueden **SELECT, INSERT, UPDATE y DELETE** cualquier fila. La política `SELECT` pública es redundante con el `ALL` para esos roles, pero es la que debe conservarse si el catálogo sigue siendo público.

## 2. Resto del schema `public`

### `tareas` (RLS habilitado)

| Columna | Tipo | Nullable | Default |
| --- | --- | --- | --- |
| `id` | `bigint` identity `BY DEFAULT` | No | — |
| `user_id` | `uuid` | No | — |
| `titulo` | `text` | No | — |
| `descripcion` | `text` | Sí | — |
| `created_at` | `timestamptz` | No | `timezone('utc', now())` |

- PK: `tareas_pkey (id)`.
- FK: `tareas_user_id_fkey (user_id) → auth.users(id) ON DELETE CASCADE`.
- Políticas: `SELECT`, `INSERT`, `UPDATE`, `DELETE` con `auth.uid() = user_id` (4 políticas, roles `public`).

### `universidad_tareas` (RLS habilitado)

| Columna | Tipo | Nullable | Default |
| --- | --- | --- | --- |
| `id` | `bigint` identity `BY DEFAULT` | No | — |
| `created_at` | `timestamptz` | No | `timezone('utc', now())` |
| `user_id` | `uuid` | No | — |
| `materia` | `text` | No | — |
| `titulo` | `text` | No | — |
| `descripcion` | `text` | Sí | — |

- PK: `universidad_tareas_pkey (id)`.
- FK: `universidad_tareas_user_id_fkey (user_id) → auth.users(id) ON DELETE CASCADE`.
- Políticas: 4 para roles `authenticated` (`SELECT/INSERT/UPDATE/DELETE` con `auth.uid() = user_id`) y 3 duplicadas para roles `public` (`SELECT/UPDATE/DELETE` con la misma condición).

### `orders` (RLS habilitado)

| Columna | Tipo | Nullable | Default | Restricciones |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | No | `gen_random_uuid()` | `PRIMARY KEY (id)` |
| `created_at` | `timestamptz` | No | `timezone('utc', now())` | — |
| `user_id` | `uuid` | **Sí** | — | FK `→ auth.users(id) ON DELETE SET NULL` |
| `total` | `numeric(10,2)` | No | — | `CHECK (total >= 0)` |
| `status` | `text` | No | `'completed'` | — |

- Políticas: `Permitir lectura de órdenes` (`SELECT`, `true`, roles `public`) y `Permitir inserción de órdenes a usuarios` (`INSERT`, `true`, roles `public`).

### `order_items` (RLS habilitado)

| Columna | Tipo | Nullable | Default | Restricciones |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | No | `gen_random_uuid()` | `PRIMARY KEY (id)` |
| `order_id` | `uuid` | No | — | FK `→ orders(id) ON DELETE CASCADE` |
| `product_id` | `uuid` | No | — | FK `→ products(id) ON DELETE RESTRICT` |
| `quantity` | `integer` | No | — | `CHECK (quantity > 0)` |
| `unit_price` | `numeric(10,2)` | No | — | `CHECK (unit_price >= 0)` |

- Políticas: `Permitir lectura de items de orden` (`SELECT`, `true`, roles `public`) y `Permitir inserción de items de orden` (`INSERT`, `true`, roles `public`).

## 3. Auditoría de `src/app/sell.tsx`

### Coincidencia del CRUD con `products`

| Operación | Ubicación | Resultado |
| --- | --- | --- |
| Read | `loadProducts()` (`sell.tsx:67-80`) | Coincide: selecciona exactamente las 8 columnas y ordena por `created_at DESC`. |
| Create | `saveProduct()` (`sell.tsx:138-151`) | Coincide: envía `name`, `description`, `price`, `stock`, `category`, `image_url`; `id`/`created_at` los genera la BD. |
| Update | `saveProduct()` (`sell.tsx:148-150`) | Coincide a nivel de columnas, pero filtra solo por `id`, sin propietario. |
| Delete | `confirmDelete()` (`sell.tsx:162-179`) | Coincide a nivel de columnas, pero filtra solo por `id`, sin propietario. |

**Conclusión:** el CRUD coincide con la estructura actual de `products`. No coincide con un modelo multi-vendedor: la pantalla dice "Tus productos" (`sell.tsx:304`) pero lista, edita y borra **todos** los productos.

### Diferencias y riesgos

| # | Diferencia / riesgo | Severidad | Detalle |
| --- | --- | --- | --- |
| 1 | RLS de escritura abierta | Crítica | `Permitir gestión de productos` es `ALL ... true` para `anon` y `authenticated`. Cualquier persona con la anon key puede modificar precios, stock o borrar el catálogo. |
| 1b | Grants peligrosos | Alta | `anon` y `authenticated` también tienen `TRUNCATE`, `REFERENCES` y `TRIGGER` sobre `products`. RLS no cubre `TRUNCATE`. La migración propuesta revoca y vuelve a otorgar solo lo necesario. |
| 2 | Sin propietario en `products` | Alta | No hay `seller_id`; no es posible aplicar `auth.uid() = seller_id` ni saber qué productos son "tuyos". |
| 3 | Sin verificación de sesión en la app | Alta | `saveProduct()` y `confirmDelete()` no llaman a `supabase.auth.getUser()`. Al endurecer RLS, un usuario anónimo recibirá un error genérico en lugar de un flujo de login. |
| 4 | `SELECT` público en la pantalla de ventas | Alta | Aun con RLS por propietario, la política de lectura pública seguiría devolviendo todo; `sell.tsx` debe agregar `.eq('seller_id', user.id)` si quiere ver solo los suyos. |
| 5 | `numeric` tratado como `number` | Media | PostgREST devuelve `numeric` como string; el tipo `number \| string` lo tolera al mostrar, pero insertar `number` puede perder precisión en montos grandes. Conviene enviar strings (`"12.50"`) o almacenar centavos como `integer`. |
| 6 | Regla de precio `>= 0` vs. `> 0` | Media | La BD y la app aceptan precio `0`. La documentación inicial pedía "mayor a 0"; hay que decidir la regla de negocio antes de agregar un `CHECK (price > 0)`. |
| 7 | Validación de `stock` con `parseInt` | Media | `Number.parseInt('1.5', 10)` devuelve `1`; el usuario podría enviar un entero distinto al texto ingresado sin aviso. |
| 8 | `category` sin restricción | Media | Los chips son solo UI; el campo "Otra categoría" permite texto libre y la BD no tiene `CHECK` ni tabla de categorías. |
| 9 | `image_url` sin validación | Baja | Es `text` libre; no hay `CHECK` de formato ni integración con Storage en `sell.tsx`. |
| 10 | Borrado físico bloqueado por ventas | Media | `order_items_product_id_fkey ... ON DELETE RESTRICT`: eliminar un producto con historial fallará. Falta borrado lógico (`is_active`) o archivado. |
| 11 | Sin `updated_at`, unicidad ni índices | Baja | No hay auditoría de cambios, se permiten nombres duplicados y no hay índice por `category`, `created_at` ni futuro `seller_id`. |
| 12 | Stock sin control transaccional | Media | No hay trigger ni RPC que descuente stock al vender; `sell.tsx` y cualquier cliente con la anon key pueden escribir `stock` directamente, sin control de concurrencia. |
| 13 | Lint: `set-state-in-effect` | Media | `npx expo lint` marca `sell.tsx:83`: `loadProducts(false)` actualiza `loading` dentro de un `useEffect`. Es un error preexistente en el archivo auditado. |

### Riesgos adicionales fuera del alcance de esta propuesta

`orders` y `order_items` también tienen políticas `SELECT/INSERT ... true` para roles `public`. Un usuario podría leer todas las órdenes o insertar items ajenos. Deben endurecerse en una migración separada.

## 4. SQL que faltaría

### 4.1 Propuesta principal (RLS + propietario)

Ver `docs/migrations/20261117120000_restrict_products_rls.sql`. Resumen: agregar `seller_id`, hacer backfill, crear FK/default/índice, eliminar la política `ALL`, crear políticas `INSERT/UPDATE/DELETE` por `auth.uid()`, mantener `SELECT` público para el catálogo y revocar/volver a otorgar grants mínimos (`TRUNCATE`, `REFERENCES` y `TRIGGER` quedan fuera).

**Requisito previo:** decidir el propietario de las 6 filas existentes. El archivo propuesto usa un email de ejemplo (`admin@tu-dominio.com`) solo como marcador de posición y falla explícitamente si no existe; reemplázalo por el correo real o carga un mapeo antes de ejecutarlo. No se usan IDs generados hardcodeados.

### 4.2 Ajustes opcionales sugeridos (no incluidos en la migración propuesta)

```sql
-- Solo si el precio no puede ser 0
alter table public.products drop constraint if exists products_price_check;
alter table public.products
  add constraint products_price_check check (price > 0);

-- Auditoría de cambios
alter table public.products
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end $$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Categorías controladas (ejemplo; idealmente una tabla categories + FK)
alter table public.products
  add constraint products_category_check
  check (category in ('Tecnología', 'Accesorios', 'Calzado', 'Hogar', 'Textiles'));
```

### 4.3 Cambios de aplicación necesarios después de aplicar la migración

- Obtener `user = (await supabase.auth.getUser()).data.user` antes de `loadProducts`, `saveProduct` y `confirmDelete`.
- Agregar `.eq('seller_id', user.id)` en `loadProducts()` para que "Tus productos" muestre solo los propios.
- Enviar `price` como string con formato fijo y validar `stock` con `Number(...)` + `Number.isInteger(...)`.
- Manejar errores `42501` / "row-level security policy" con un mensaje de permisos o redirección a login.

## 5. Estado de ejecución

- Consultas MCP ejecutadas: solo `SELECT` / listado de esquema y migraciones.
- Reverificación: el esquema continúa idéntico; las 5 tablas y sus políticas no cambiaron. Única migración aplicada en remoto: `20261116172704_allow_public_product_management`.
- Migración propuesta: **no aplicada**.
- Documentación: este documento, `docs/01-funcionalidad-productos.md` (actualizado al esquema real) y `docs/migrations/20261117120000_restrict_products_rls.sql`.
- `npx expo lint`: 2 errores y 1 warning preexistentes (`sell.tsx:83`, `use-color-scheme.web.ts:11`, BOM en `supabase.ts`). No se corrigió código de la app.
- `npx tsc --noEmit`: 1 error preexistente en `src/components/app-tabs.web.tsx:38` (incompatibilidad de `ref` en `Pressable`). No relacionado con la documentación ni con la migración propuesta.
