-- Apagar a própria conta (LGPD), pelo app.
--
-- As chaves para auth.users eram sem regra (NO ACTION), então apagar um usuário com qualquer exemplar,
-- edição, série ou chegada falhava, inclusive pelo painel. Agora:
--   * exemplares (copies) são da pessoa: vão junto (cascade);
--   * edições, séries e chegadas são do catálogo compartilhado: ficam, sem autor (set null). Edição sem
--     autor só o admin edita (editions_update_admin), o que é o esperado.
-- As capas no Storage não têm chave para auth.users e ficam com o catálogo.

alter table copies drop constraint copies_user_id_fkey,
  add constraint copies_user_id_fkey foreign key (user_id) references auth.users on delete cascade;

alter table editions drop constraint editions_created_by_fkey,
  add constraint editions_created_by_fkey foreign key (created_by) references auth.users on delete set null;

alter table works drop constraint works_created_by_fkey,
  add constraint works_created_by_fkey foreign key (created_by) references auth.users on delete set null;

alter table store_arrivals drop constraint store_arrivals_created_by_fkey,
  add constraint store_arrivals_created_by_fkey foreign key (created_by) references auth.users on delete set null;

-- security definer: o role authenticated não pode mexer em auth.users; a função roda como o dono
-- (postgres) e só apaga a linha de quem chamou.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
