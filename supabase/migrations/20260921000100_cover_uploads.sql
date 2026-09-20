-- Bucket para as fotos de capa enviadas no cadastro manual de uma edição.
-- Público para leitura (a capa é dado de catálogo, compartilhado); só
-- usuário autenticado escreve.

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

create policy "covers_read_public" on storage.objects
  for select
  to public
  using (bucket_id = 'covers');

create policy "covers_insert_authenticated" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'covers');
