-- Lista de desejos: edições que a pessoa quer comprar, para mostrar ao atendente na loja ou mandar pelo
-- canal da loja. Cada desejo é uma edição (um ISBN); lista simples, sem prioridade nem observação.
-- Privada como copies: cada pessoa só vê e mexe nos próprios desejos.

create table wishes (
  id uuid primary key default gen_random_uuid(),
  -- cascade: apagar a conta (delete_my_account) leva os desejos junto, como os exemplares.
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  -- cascade: se o admin apagar uma edição do catálogo, o desejo por ela deixa de fazer sentido.
  edition_id uuid not null references editions on delete cascade,
  created_at timestamptz not null default now(),
  -- A mesma edição duas vezes na lista não faz sentido (ao contrário de copies, em que dois exemplares
  -- são legítimos). O índice da unique também serve à consulta por usuário.
  unique (user_id, edition_id)
);

alter table wishes enable row level security;

-- Sem update: um desejo só entra ou sai. No Supabase, anon e authenticated já têm privilégio de tabela
-- por padrão; o que barra update (de todos) e qualquer acesso do anon é a RLS sem política para isso.
grant select, insert, delete on wishes to authenticated;

create policy "wishes_select_own" on wishes
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "wishes_insert_own" on wishes
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "wishes_delete_own" on wishes
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Ao cadastrar o exemplar, o desejo pela mesma edição sai sozinho. Fica no banco (e não no app) para
-- valer em qualquer tela que cria exemplar: cadastro, página da série e as que vierem. security invoker:
-- quem insere o exemplar é o dono, e a política wishes_delete_own já deixa apagar o próprio desejo.
create function remove_wish_on_copy()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from wishes where user_id = new.user_id and edition_id = new.edition_id;
  return new;
end;
$$;

create trigger copies_remove_wish
  after insert on copies
  for each row
  execute function remove_wish_on_copy();
