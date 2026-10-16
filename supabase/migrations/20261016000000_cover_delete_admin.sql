-- Trocar a capa de uma edição pelo admin envia um arquivo novo (nome com data, sem sobrescrever) e
-- deixava o antigo sobrando no bucket. O app agora apaga a capa antiga depois de salvar a nova, pela
-- API do Storage — que precisa de permissão de DELETE em storage.objects.
--
-- Só o admin: hoje só ele troca a capa de uma edição existente (políticas de `editions`), e a capa é
-- compartilhada no catálogo, então ninguém mais deveria poder apagá-la. Mesmo UUID de
-- `editions_update_admin` e de ADMIN_USER_ID (src/features/admin/admin.ts).
--
-- Ordem de aplicação indiferente: sem esta política o app só não consegue apagar (avisa no console)
-- e a edição continua salva normalmente.
create policy "covers_delete_admin" on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'covers' and auth.uid() = '1df84c70-a8b3-43b9-a528-cf50cac4946a');
