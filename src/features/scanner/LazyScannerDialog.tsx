import { lazy, Suspense } from 'react'
import type { ComponentProps } from 'react'
import type { ScannerDialog } from './ScannerDialog'

/** O ZXing é pesado: só baixa quando a câmera é aberta de fato. */
const ScannerDialogLazy = lazy(() =>
  import('./ScannerDialog').then((module) => ({ default: module.ScannerDialog })),
)

export function LazyScannerDialog(props: ComponentProps<typeof ScannerDialog>) {
  if (!props.open) return null
  return (
    <Suspense fallback={null}>
      <ScannerDialogLazy {...props} />
    </Suspense>
  )
}
