// mm/src/utils/fileStore.js
// Stores File blobs in IndexedDB so we can recover after navigating to Register/Login.


const DB_NAME = 'mm_workflow_db';
const DB_VERSION = 2; // bump version so onupgradeneeded runs if DB already exists
const STORE = 'workflow_files';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      // Ensure the store exists
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// Save/update one file record
export async function saveWorkflowFile(record) {
  if (!record?.id) throw new Error('saveWorkflowFile requires record.id');
  if (!record?.file) throw new Error('saveWorkflowFile requires record.file');

  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put({
    id: record.id,
    name: record.name || record.file?.name || 'file',
    tag: record.tag || 'Main Manuscript',
    type: record.file?.type || '',
    size: record.file?.size || 0,
    file: record.file, // File object stored in IndexedDB
    savedAt: Date.now(),
  });

  await txDone(tx);
  db.close();
}

// Remove one by id
export async function removeWorkflowFile(id) {
  if (!id) return;
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
  db.close();
}

// Load all stored files
export async function loadWorkflowFiles() {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);

  const req = store.getAll();
  const items = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  await txDone(tx);
  db.close();

  return (items || []).map((x) => ({
    id: x.id,
    name: x.name,
    tag: x.tag,
    file: x.file,
    type: x.type,
    size: x.size,
    savedAt: x.savedAt,
  }));
}

// Clear everything
export async function clearWorkflowFiles() {
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).clear();
  await txDone(tx);
  db.close();
}
