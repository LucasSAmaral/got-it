/** Lado maior da capa depois de reduzida. O cartão mostra a capa em ~76 px de altura (~230 px em tela 3x). */
export const COVER_MAX_SIDE = 800
export const COVER_QUALITY = 0.82

/** Escala para caber em `max` no lado maior, sem ampliar. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

/**
 * Reduz a foto da capa e a converte para JPEG. Uma foto de celular tem alguns MB; a capa reduzida
 * fica na casa das dezenas de KB. JPEG e não WebP porque o canvas do Safari não gera WebP.
 */
export async function shrinkCover(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    // O navegador aplica a orientação EXIF (foto de celular "deitada") ao decodificar e ao desenhar.
    await image.decode()

    const { width, height } = fitWithin(image.naturalWidth, image.naturalHeight, COVER_MAX_SIDE)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas indisponível')

    // JPEG não tem transparência: sem um fundo, um PNG transparente viraria preto.
    context.fillStyle = '#fff'
    context.fillRect(0, 0, width, height)
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, width, height)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('sem resultado'))), 'image/jpeg', COVER_QUALITY)
    })
  } catch {
    throw new Error('Não deu para processar a foto da capa. Tente outra imagem.')
  } finally {
    URL.revokeObjectURL(url)
  }
}
