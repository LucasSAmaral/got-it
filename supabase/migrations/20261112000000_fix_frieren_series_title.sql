-- Correção de dados: um usuário criou a série "friren" (tudo minúsculo, com erro de digitação) num
-- cadastro que não chegou a gravar a edição, e depois "Frieren E A Jornada Para O Além". O app agora
-- capitaliza nome novo em minúsculas (capitalizeSeriesTitle) e não sugere série sem edição; isto arruma
-- o que ficou de antes. Pelo id, para não pegar outra série; em outro banco (teste local) não faz nada.

-- Só apaga se continuar sem edição (editions.work_id é a única referência a works).
delete from works w
where w.id = 'df6a3b8d-c8f9-426d-9d87-a08805e91f02'
  and not exists (select 1 from editions e where e.work_id = w.id);

-- Conectivos minúsculos no meio do nome, como capitalizeSeriesTitle faria.
update works
set title = 'Frieren e a Jornada para o Além'
where id = 'c1742142-fc0a-49db-bb78-3936f52e12e8';
