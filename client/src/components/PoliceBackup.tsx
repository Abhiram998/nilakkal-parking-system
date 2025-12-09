import React, { useState, useEffect } from 'react';

// Types
export type VehicleRecord = {
  plate: string;
  zone: string;
  timeIn: string;
  timeOut?: string | null;
};

type BackupSnapshot = {
  id: number;
  meta: {
    app: string;
    version: number;
    createdAt: string;
    recordCount: number;
  };
  data: VehicleRecord[];
};

interface PoliceBackupProps {
  getRecords: () => VehicleRecord[];
  onRestore: (records: VehicleRecord[]) => void;
  appName?: string;
}

const DB_VERSION = 1;
const STORE_NAME = 'backups';

export default function PoliceBackup({
  getRecords,
  onRestore,
  appName = "nilakkal-police"
}: PoliceBackupProps) {
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [status, setStatus] = useState<string>('');
  const [db, setDb] = useState<IDBDatabase | null>(null);

  const dbName = `${appName}-backup-db`;

  // Initialize IndexedDB
  useEffect(() => {
    const request = indexedDB.open(dbName, DB_VERSION);

    request.onerror = () => setStatus('Failed to open backup database.');
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      setDb(database);
      loadSnapshots(database);
    };
  }, [dbName]);

  const loadSnapshots = (database: IDBDatabase) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const result = request.result as BackupSnapshot[];
      // Sort newest first
      setSnapshots(result.sort((a, b) => 
        new Date(b.meta.createdAt).getTime() - new Date(a.meta.createdAt).getTime()
      ));
    };
  };

  const handleSaveSnapshot = () => {
    if (!db) return;
    setStatus('Saving snapshot...');

    const records = getRecords();
    const snapshot: Omit<BackupSnapshot, 'id'> = {
      meta: {
        app: appName,
        version: 1,
        createdAt: new Date().toISOString(),
        recordCount: records.length
      },
      data: records
    };

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(snapshot);

    request.onsuccess = () => {
      setStatus('Snapshot saved successfully.');
      loadSnapshots(db);
      alert('Backup snapshot saved successfully.');
    };

    request.onerror = () => {
      setStatus('Error saving snapshot.');
      alert('Failed to save snapshot.');
    };
  };

  const handleDelete = (id: number) => {
    if (!db || !confirm('Are you sure you want to delete this backup snapshot?')) return;

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      loadSnapshots(db);
      setStatus('Snapshot deleted.');
    };
  };

  const handleRestore = (snapshot: BackupSnapshot) => {
    if (confirm(`Restore backup from ${new Date(snapshot.meta.createdAt).toLocaleString()}? This will replace current data.`)) {
      try {
        validatePayload(snapshot.data);
        onRestore(snapshot.data);
        alert('Data restored successfully.');
      } catch (e) {
        alert((e as Error).message);
      }
    }
  };

  const validatePayload = (data: any[]) => {
    if (!Array.isArray(data)) throw new Error('Invalid data format: expected array');
    const isValid = data.every(item => item.plate && item.zone && item.timeIn);
    if (!isValid) throw new Error('Invalid data: missing required fields (plate, zone, timeIn)');
    return true;
  };

  const exportCSV = (snapshot: BackupSnapshot) => {
    const headers = ['plate', 'zone', 'timeIn', 'timeOut'];
    const rows = snapshot.data.map(r => 
      `"${r.plate}","${r.zone}","${r.timeIn}","${r.timeOut || ''}"`
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, `backup-${snapshot.id}.csv`, 'text/csv');
  };

  const exportJSON = (snapshot: BackupSnapshot) => {
    const jsonContent = JSON.stringify(snapshot, null, 2);
    downloadFile(jsonContent, `backup-${snapshot.id}.json`, 'application/json');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = JSON.parse(event.target?.result as string);
        
        // Basic validation of import structure
        if (!content.data || !Array.isArray(content.data)) {
          throw new Error('Invalid backup file format.');
        }
        validatePayload(content.data);

        // Save as new snapshot
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // Create new snapshot entry from imported data
        const newSnapshot: Omit<BackupSnapshot, 'id'> = {
          meta: {
            app: appName,
            version: content.meta?.version || 1,
            createdAt: content.meta?.createdAt || new Date().toISOString(),
            recordCount: content.data.length
          },
          data: content.data
        };

        const request = store.add(newSnapshot);
        request.onsuccess = () => {
          loadSnapshots(db);
          alert('Backup imported successfully as a new snapshot.');
          setStatus('Import successful.');
        };
      } catch (err) {
        alert('Failed to import: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="p-4 border rounded-lg bg-white/5 border-white/10 space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Police Backup System</h2>
          <p className="text-sm text-white/60">Local secure backup (IndexedDB)</p>
          {status && <p className="text-xs text-blue-400 mt-1">{status}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveSnapshot}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
          >
            Save Snapshot
          </button>
          <label className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-medium cursor-pointer transition-colors">
            Import JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {snapshots.length === 0 ? (
          <div className="text-center py-8 text-white/40 italic border border-dashed border-white/10 rounded">
            No backups found.
          </div>
        ) : (
          snapshots.map((snap) => (
            <div key={snap.id} className="p-3 bg-black/40 border border-white/10 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-white/30 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-400">#{snap.id}</span>
                  <span className="text-white font-medium">
                    {new Date(snap.meta.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-white/60 mt-1">
                  {snap.meta.recordCount} records • v{snap.meta.version}
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => exportCSV(snap)}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-xs text-white rounded border border-white/10"
                >
                  CSV
                </button>
                <button
                  onClick={() => exportJSON(snap)}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-xs text-white rounded border border-white/10"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleRestore(snap)}
                  className="px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-xs text-yellow-500 border border-yellow-500/30 rounded"
                >
                  Restore
                </button>
                <button
                  onClick={() => handleDelete(snap.id)}
                  className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-xs text-red-500 border border-red-500/30 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
