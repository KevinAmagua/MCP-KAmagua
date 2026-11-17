# Funcionalidad 02: CRUD de Carrito y Órdenes de Compra

## 1. Objetivo
Gestionar el ciclo de vida del carrito de compras del usuario (agregar ítems, actualizar cantidades, eliminar productos) y persistir la orden finalizada en Supabase.

## 2. Esquema de Base de Datos (Supabase)
Tabla: `orders`
- `id`: `uuid` (Primary Key, default: `gen_random_uuid()`)
- `created_at`: `timestamp with time zone` (default: `now()`)
- `user_id`: `uuid` (Foreign Key -> `auth.users.id`)
- `total`: `numeric(10,2)` (Not Null)
- `status`: `text` (default: `'completed'`) - Estado de la orden.

Tabla: `order_items`
- `id`: `uuid` (Primary Key, default: `gen_random_uuid()`)
- `order_id`: `uuid` (Foreign Key -> `orders.id`, On Delete Cascade)
- `product_id`: `uuid` (Foreign Key -> `products.id`)
- `quantity`: `integer` (Not Null)
- `unit_price`: `numeric(10,2)` (Not Null)

## 3. Flujo del CRUD del Carrito
- **Create (Agregar al carrito):** Si el producto ya existe en el estado global (`Zustand`), incrementar su cantidad sin superar el `stock` disponible. Si no existe, añadirlo con `quantity: 1`.
- **Read (Visualizar carrito):** Mostrar el listado de ítems seleccionados, subtotal por ítem, impuestos (si aplica) y total general.
- **Update (Modificar cantidad):** Botones `+` y `-` por cada ítem en el carrito. Si la cantidad llega a `0`, eliminar el producto.
- **Delete (Vaciar / Eliminar ítem):** Opción para quitar un producto individual o vaciar todo el carrito.
- **Checkout (Confirmar Orden):** Al pulsar "Finalizar Compra", insertar el registro en `orders`, insertar los detalles en `order_items`, descontar el stock en `products` y mostrar una animación de éxito con `LottieView`.