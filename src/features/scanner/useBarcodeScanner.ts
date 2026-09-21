import { BrowserMultiFormatOneDReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, ChecksumException, DecodeHintType, FormatException, NotFoundException } from '@zxing/library'
import { useEffect, useRef, useState } from 'react'
import { interpretBarcode, type AcceptedScan } from '../../lib/barcode'

export type ScannerStatus = 'iniciando' | 'lendo' | 'erro'

// Sem TRY_HARDER de propósito: no @zxing/browser 0.2.1 ele gira a imagem com um canvas temporário
// que nunca é criado, o leitor lança erro no primeiro frame sem código e para de ler.
const HINTS = new Map<DecodeHintType, unknown>([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]]])

/** Frame sem código legível: o esperado enquanto a pessoa ainda está enquadrando. */
function isExpectedMiss(error: unknown): boolean {
  return error instanceof NotFoundException || error instanceof ChecksumException || error instanceof FormatException
}

function messageForError(error: unknown): string {
  const name = error instanceof Error ? error.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Precisamos da sua permissão para usar a câmera. Libere o acesso nas configurações do navegador.'
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'Não encontramos uma câmera neste aparelho.'
  }
  if (name === 'NotReadableError') {
    return 'A câmera está ocupada por outro aplicativo.'
  }
  return 'Não deu para abrir a câmera agora.'
}

/**
 * Liga a câmera traseira e devolve o primeiro código de gibi que der para ler.
 * Leituras incompletas ou de códigos que não são de gibi viram aviso e a câmera continua ligada.
 */
export function useBarcodeScanner(active: boolean, onDetected: (result: AcceptedScan) => void) {
  // O Dialog do MUI monta o conteúdo num portal, depois do primeiro commit. Uma ref comum ainda
  // seria null quando o efeito roda, e o ZXing criaria um <video> solto, fora da tela.
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const onDetectedRef = useRef(onDetected)
  const [status, setStatus] = useState<ScannerStatus>('iniciando')
  const [errorMessage, setErrorMessage] = useState('')
  const [warning, setWarning] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  useEffect(() => {
    if (!active || !container) return

    setStatus('iniciando')
    setErrorMessage('')
    setWarning('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('erro')
      setErrorMessage('A câmera só funciona em uma conexão segura (https) ou em localhost.')
      return
    }

    // Cada execução cria o próprio <video>: o stop() do ZXing zera o srcObject do elemento que
    // recebeu, e um stop() atrasado (StrictMode, tentar de novo) apagaria o stream da execução seguinte.
    const video = document.createElement('video')
    video.muted = true
    video.setAttribute('playsinline', 'true')
    video.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block'
    container.appendChild(video)

    let controls: IScannerControls | undefined
    let cancelled = false
    let handled = false

    const reader = new BrowserMultiFormatOneDReader(HINTS)

    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        video,
        (result, error, scanControls) => {
          // Qualquer outro erro faz o ZXing parar de ler e limpar o vídeo por conta própria.
          if (error && !isExpectedMiss(error)) {
            if (cancelled || handled) return
            handled = true
            setStatus('erro')
            setErrorMessage('A leitura parou de repente.')
            return
          }
          if (!result || handled || cancelled) return
          const scan = interpretBarcode(result.getText())
          if (scan.kind === 'invalido') {
            setWarning(scan.reason)
            return
          }
          handled = true
          setWarning('')
          scanControls.stop()
          navigator.vibrate?.(60)
          onDetectedRef.current(scan)
        },
      )
      .then((scannerControls) => {
        if (cancelled) {
          scannerControls.stop()
          return
        }
        controls = scannerControls
        setStatus('lendo')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setStatus('erro')
        setErrorMessage(messageForError(error))
      })

    return () => {
      cancelled = true
      controls?.stop()
      video.remove()
    }
  }, [active, attempt, container])

  return {
    videoContainerRef: setContainer,
    status,
    errorMessage,
    warning,
    retry: () => setAttempt((value) => value + 1),
  }
}
