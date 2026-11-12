-- Correção de dados: o formato "Tankôbon" virou "Mangá" no app (src/features/register/constants.ts),
-- porque ninguém reconhecia o termo. Os três mangás do catálogo tinham ido para "Especial" ou sem formato;
-- conferidos pelo Lucas em 2026-11-12. Pelo id; em outro banco (teste local) não faz nada.
update editions
set format = 'Mangá'
where id in (
  '607e6a81-c950-4690-810a-9015690ab71f', -- Berserk Vol 1 (Berserk: Edição de Luxo), Panini
  '78db20fe-2414-48f7-b31b-b109cab8e243', -- Sanctuary, JBC
  'cdd7c606-3889-4740-823f-b03639e5c569'  -- Vol 3 (Frieren e a Jornada para o Além), Panini
);
