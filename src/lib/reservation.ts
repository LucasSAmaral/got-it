interface ReservedEdition {
  title: string
  publisher: string | null
  volume: string | null
  isbn13: string | null
}

/**
 * Texto pronto para pedir a reserva de uma chegada: título, editora, volume e ISBN, para a loja achar o
 * gibi sem perguntar de volta. Pergunta "ainda tem?" porque a vitrine não sabe o que esgotou.
 */
export function reservationMessage(edition: ReservedEdition, storeName: string): string {
  const details = [edition.publisher, edition.volume && `vol. ${edition.volume}`, edition.isbn13 && `ISBN ${edition.isbn13}`]
    .filter(Boolean)
    .join(', ')
  const item = details ? `${edition.title} (${details})` : edition.title
  return `Olá! Vi no Tem esse? que chegou na ${storeName}: ${item}. Ainda tem? Queria reservar.`
}

/** Conversa no WhatsApp com a mensagem já escrita. `phone` só com dígitos e DDI, como em `stores.whatsapp`. */
export function whatsappUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

/** Direct do Instagram. Não aceita texto pronto: a página copia a mensagem antes de abrir. */
export function instagramUrl(handle: string): string {
  return `https://ig.me/m/${handle}`
}
