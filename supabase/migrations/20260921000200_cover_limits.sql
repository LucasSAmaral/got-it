-- O app agora reduz a capa para ~800 px em JPEG antes de enviar (dezenas de KB). O limite abaixo
-- é a garantia no servidor: sem ele, qualquer usuário autenticado ainda pode enviar arquivos
-- enormes ou de outro tipo direto pela API do Storage, sem passar pelo app.
--
-- Aplicar DEPOIS de publicar a versão do app que reduz a imagem: uma versão antiga do app
-- (PWA ainda sem atualizar) enviaria a foto crua do celular e teria o envio recusado.

update storage.buckets
set file_size_limit = 1048576,                  -- 1 MB; a capa reduzida fica bem abaixo disso
    allowed_mime_types = array['image/jpeg']
where id = 'covers';
