/** Condição do exemplar — usado no cadastro e na edição do exemplar. */
export const CONDITIONS = ['Ótimo', 'Bom', 'Regular']

/**
 * Formatos de edição — usado no cadastro manual e na edição pelo painel de admin. "Mangá" era "Tankôbon"
 * até 2026-11-12: ninguém reconhecia o termo, e os mangás iam para "Especial" ou sem formato.
 */
export const FORMATS = ['Banca', 'Encadernado', 'Mangá', 'Especial']

/** Editoras sugeridas no campo de editora mesmo antes de alguém cadastrar uma edição delas. */
export const COMMON_PUBLISHERS = [
  'Panini',
  'Mythos',
  'JBC',
  'NewPOP',
  'Pipoca & Nanquim',
  'Devir',
  'Conrad',
  'DarkSide',
  'Veneta',
  'Nemo',
  'Comix Zone',
  'Mino',
  'Skript',
  'Eaglemoss',
  'Salvat',
]

/**
 * De/para do nome que a editora registrou na CBL (campo `publisher` da BrasilAPI) para o nome usado no catálogo,
 * quando o registro usa a razão social. A chave é o nome inteiro, em minúsculas. Vistos em 2026-11-22.
 */
export const PUBLISHER_ALIASES: Record<string, string> = {
  'editora planeta deagostini do brasil ltda': 'Eaglemoss',
  'japorama editora e comunicação': 'JBC',
}
