-- Dados de teste. Os ids batem com USERS em lib.mjs; o do admin é o ADMIN_USER_ID de
-- src/features/admin/admin.ts (as políticas comparam com ele).
insert into auth.users (id, email) values
  ('1df84c70-a8b3-43b9-a528-cf50cac4946a', 'admin@teste.local'),
  ('00000000-0000-4000-8000-000000000001', 'leitor@teste.local');

insert into works (id, title) values
  ('00000000-0000-4000-8000-0000000000a1', 'Homem-Aranha 2099');

insert into editions (id, isbn13, title, publisher, volume, work_id, series_position) values
  ('00000000-0000-4000-8000-0000000000e1', '9786555123456', 'Homem-Aranha 2099: O Início', 'Panini', '1', '00000000-0000-4000-8000-0000000000a1', 1),
  ('00000000-0000-4000-8000-0000000000e2', '9786555123463', 'Homem-Aranha 2099 Vol. 2', 'Panini', '2', '00000000-0000-4000-8000-0000000000a1', 2),
  ('00000000-0000-4000-8000-0000000000e3', '9788542600000', 'Sandman Vol. 1', 'Panini', '1', null, null);

insert into copies (user_id, edition_id, read) values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000e1', true),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000e3', false);

insert into store_arrivals (store_id, edition_id, arrived_on, price)
select id, '00000000-0000-4000-8000-0000000000e2', current_date, 49.90 from stores where slug = 'lazarus';
