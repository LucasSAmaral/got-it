-- Série completa e total de números: o Lucas marca, na página da série, quantos números a série tem ao
-- todo e se ela terminou (não terá mais lançamentos). São independentes: um mangá que acabou no Japão
-- tem total conhecido, mas ainda sai aqui; série completa sem total é rara, mas não é erro.
-- O total se compara com a posição na série (series_position ou o volume), como a página agrupa.

alter table works
  add column total_volumes integer check (total_volumes > 0),
  add column completed boolean not null default false;

-- Só o admin altera séries. A política antiga deixava quem criou a série atualizar a linha, e a RLS
-- controla linhas, não colunas: com as colunas novas, um usuário poderia marcar como completa a série
-- que criou chamando a API direto. O app nunca fez update em works (série nova vem de get_or_create_work,
-- que só insere), então tirar a política não quebra nada. O admin também corrige o nome por aqui
-- (antes era só pelo painel; ver 20261112000000_fix_frieren_series_title.sql).
drop policy "works_update_own" on works;

create policy "works_update_admin" on works
  for update
  to authenticated
  using (auth.uid() = '1df84c70-a8b3-43b9-a528-cf50cac4946a')
  with check (auth.uid() = '1df84c70-a8b3-43b9-a528-cf50cac4946a');
