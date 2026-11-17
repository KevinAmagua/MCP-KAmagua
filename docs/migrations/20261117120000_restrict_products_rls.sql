alter table public.products
  add column if not exists seller_id uuid;

do $$
declare
  v_seller uuid;
begin
  select id
    into v_seller
    from auth.users
   where email = 'admin@tu-dominio.com';

  if v_seller is null then
    raise exception 'No se encontró el usuario vendedor con email admin@tu-dominio.com; completa el backfill antes de continuar';
  end if;

  update public.products
     set seller_id = v_seller
   where seller_id is null;
end $$;

alter table public.products
  alter column seller_id set default auth.uid();

alter table public.products
  alter column seller_id set not null;

alter table public.products
  add constraint products_seller_id_fkey
  foreign key (seller_id) references auth.users(id) on delete restrict;

create index if not exists products_seller_id_created_at_idx
  on public.products (seller_id, created_at desc);

drop policy if exists "Permitir gestión de productos" on public.products;

drop policy if exists "Permitir lectura pública de productos" on public.products;

create policy "Permitir lectura pública de productos"
  on public.products
  for select
  to public
  using (true);

create policy "Vendedores pueden insertar sus productos"
  on public.products
  for insert
  to authenticated
  with check (seller_id = (select auth.uid()));

create policy "Vendedores pueden actualizar sus productos"
  on public.products
  for update
  to authenticated
  using (seller_id = (select auth.uid()))
  with check (seller_id = (select auth.uid()));

create policy "Vendedores pueden eliminar sus productos"
  on public.products
  for delete
  to authenticated
  using (seller_id = (select auth.uid()));

revoke all on public.products from anon, authenticated;

grant select on public.products to anon;

grant select, insert, update, delete on public.products to authenticated;
