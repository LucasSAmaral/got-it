import type { CollectionItem } from '../types/catalog'

/** Cópia local da coleção do usuário, para consultar sem sinal. Guardada no IndexedDB. */
export interface Mirror {
  items: CollectionItem[]
  savedAt: string
}

const DB_NAME = 'got-it'
const STORE = 'mirror'
const KEY = 'collection'

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

export async function saveMirror(items: CollectionItem[]): Promise<void> {
  const mirror: Mirror = { items, savedAt: new Date().toISOString() }
  await run('readwrite', (store) => store.put(mirror, KEY))
}

/** Devolve null se não há cópia ou se o IndexedDB não está disponível (ex.: navegação privada). */
export async function loadMirror(): Promise<Mirror | null> {
  try {
    return ((await run<Mirror | undefined>('readonly', (store) => store.get(KEY))) ?? null) as Mirror | null
  } catch {
    return null
  }
}

export async function clearMirror(): Promise<void> {
  try {
    await run('readwrite', (store) => store.delete(KEY))
  } catch {
    // sem IndexedDB não há nada para limpar
  }
}
