import type { CollectionItem, WishItem } from '../types/catalog'

/** Cópia local de uma lista do usuário (coleção ou lista de desejos), para consultar sem sinal. Guardada no IndexedDB. */
export interface Mirror<T = CollectionItem> {
  items: T[]
  savedAt: string
}

const DB_NAME = 'got-it'
const STORE = 'mirror'
const KEY = 'collection'
// Mesmo object store, outra chave: não precisa de versão nova do banco (onupgradeneeded).
const WISHES_KEY = 'wishes'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(STORE, mode)
      const request = action(transaction.objectStore(STORE))
      transaction.oncomplete = () => resolve(request.result)
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } finally {
    database.close()
  }
}

async function save<T>(key: string, items: T[]): Promise<void> {
  const mirror: Mirror<T> = { items, savedAt: new Date().toISOString() }
  await run('readwrite', (store) => store.put(mirror, key))
}

/** Devolve null se não há cópia ou se o IndexedDB não está disponível (ex.: navegação privada). */
async function load<T>(key: string): Promise<Mirror<T> | null> {
  try {
    return ((await run<Mirror<T> | undefined>('readonly', (store) => store.get(key))) ?? null) as Mirror<T> | null
  } catch {
    return null
  }
}

export const saveMirror = (items: CollectionItem[]) => save(KEY, items)
export const loadMirror = () => load<CollectionItem>(KEY)
export const saveWishesMirror = (items: WishItem[]) => save(WISHES_KEY, items)
export const loadWishesMirror = () => load<WishItem>(WISHES_KEY)

/** Apaga as duas cópias (coleção e lista de desejos). Chamado ao sair ou quando a sessão é revogada. */
export async function clearMirror(): Promise<void> {
  try {
    await run('readwrite', (store) => store.clear())
  } catch {
    // sem IndexedDB não há nada para limpar
  }
}
