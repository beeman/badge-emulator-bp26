function openCardDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('solana-os-sd-card', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('snapshots')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function cardTransaction(database, mode, operation) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('snapshots', mode)
    const request = operation(transaction.objectStore('snapshots'))
    transaction.oncomplete = () => resolve(request.result)
    transaction.onabort = () => reject(transaction.error)
  })
}

async function loadCard() {
  const database = await openCardDatabase()
  try {
    return (await cardTransaction(database, 'readonly', (store) => store.get('card'))) ?? []
  } finally {
    database.close()
  }
}

function restoreCard(fs, entries) {
  // The firmware mounts the card by renaming this directory to /sdcard.
  fs.mkdirTree('/.sdcard')
  for (const { path, bytes } of entries) {
    const destination = '/.sdcard/' + path
    if (bytes === null) fs.mkdirTree(destination)
    else fs.writeFile(destination, bytes)
  }
}

function createCardSaver(fs, onSaveError) {
  let savedSignature
  let pending = Promise.resolve()

  function walk(root, parent = '') {
    const fullPath = parent ? root + '/' + parent : root
    return fs
      .readdir(fullPath)
      .filter((name) => name !== '.' && name !== '..')
      .sort()
      .flatMap((name) => {
        const path = parent ? parent + '/' + name : name
        const stat = fs.stat(root + '/' + path)
        if (fs.isDir(stat.mode)) return [{ path, directory: true }, ...walk(root, path)]
        return [{ path, size: stat.size, modified: stat.mtime.getTime() }]
      })
  }

  return function saveCard() {
    // Serialize saves so a restart can't load an older write in flight.
    pending = pending
      .then(async () => {
        const root = ['/sdcard', '/.sdcard'].find((path) => fs.analyzePath(path).exists)
        if (!root) return
        const entries = walk(root)
        const signature = JSON.stringify(entries)
        if (signature === savedSignature) return

        const snapshot = entries.map(({ path, directory }) => ({
          path,
          bytes: directory ? null : fs.readFile(root + '/' + path),
        }))
        const database = await openCardDatabase()
        try {
          await cardTransaction(database, 'readwrite', (store) => store.put(snapshot, 'card'))
          savedSignature = signature
          onSaveError(false)
        } finally {
          database.close()
        }
      })
      .catch(() => onSaveError(true))
    return pending
  }
}

globalThis.badgeCardStorage = { loadCard, restoreCard, createCardSaver }
