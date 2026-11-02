/** Uma versão publicada do app, como aparece em "Novidades". */
export interface ChangelogEntry {
  /** Igual ao `package.json` e à tag `vX.Y.Z`. */
  version: string
  /** Dia em que subiu, no formato do Postgres (exibido com `formatDate`). */
  date: string
  /** Frases curtas para quem usa o app: o que dá para fazer agora, sem nome de tabela nem de tela interna. */
  items: string[]
}

/**
 * O que mudou em cada versão, da mais nova para a mais antiga. A skill `publicar-versao` acrescenta a
 * entrada nova no topo junto com o número da versão; o teste confere que a primeira é a do `package.json`.
 * Fica no código (e não no banco) para abrir sem sinal e sem consulta.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.3.0',
    date: '2026-11-02',
    items: [
      'Sinopse: as edições podem ter um resumo da história, mostrado no detalhe. Quem cadastra uma edição nova pode escrever a sinopse, com as próprias palavras e sem contar o final.',
      'Novidades: esta página, que abre ao tocar no número da versão, no pé do menu.',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-11-02',
    items: [
      'Notas por estrela: dê de 1 a 5 estrelas a uma edição, no detalhe. A média de todo mundo aparece no detalhe, na página da série e na lista de séries, para ajudar a decidir se vale começar uma coleção.',
      'Avaliar uma edição que você tem marca o exemplar como lido.',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-11-02',
    items: [
      'Lista de desejos: guarde as edições que você quer comprar e mostre na loja, até sem sinal. Adicione pelo ISBN, pelo "Eu tenho?" ou pela página da série; ao cadastrar o exemplar, ele sai da lista sozinho.',
      'Edições que você não tem: na página da série, toque no cartão para ver os detalhes, pôr na lista de desejos ou adicionar à coleção.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-11-02',
    items: [
      'Primeira versão numerada. O app já cataloga a coleção pelo ISBN ou pelo código de barras e responde "Eu tenho?" em segundos, mesmo sem sinal.',
      'Séries com o que você tem e o que falta, "Chegou nas lojas" no Início e a vitrine das lojas.',
    ],
  },
]
