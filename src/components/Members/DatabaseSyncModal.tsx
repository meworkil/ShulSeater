import React, { useState } from 'react';
import { X, Upload, Download, RefreshCw, CheckCircle, Database, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Member } from '../../types/shul';
import { exportMembersToCSV, exportFullBackupJSON, importFullBackupJSON } from '../../utils/storage';

interface DatabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onImportMembers: (newMembers: Member[]) => void;
  onFullRestore: () => void;
}

export const DatabaseSyncModal: React.FC<DatabaseSyncModalProps> = ({
  isOpen,
  onClose,
  members,
  onImportMembers,
  onFullRestore
}) => {
  if (!isOpen) return null;

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Export CSV
  const handleDownloadCSV = () => {
    const csvContent = exportMembersToCSV(members);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `shul_members_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Full JSON Backup
  const handleDownloadBackupJSON = () => {
    const jsonContent = exportFullBackupJSON();
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `synagogue_full_seating_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import CSV Handler
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length <= 1) {
          throw new Error('CSV file contains no data rows.');
        }

        const newMembers: Member[] = [];
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 3) {
            newMembers.push({
              id: cols[0] || `mem-imp-${Date.now()}-${i}`,
              firstName: cols[1] || 'Congregant',
              lastName: cols[2] || `Family ${i}`,
              hebrewName: cols[3] || `${cols[1]} ${cols[2]}`,
              email: cols[4] || `member${i}@shul.org`,
              phone: cols[5] || '(555) 000-0000',
              address: 'Synagogue Member Address',
              membershipTier: (cols[6] as any) || 'Family',
              membershipStatus: 'active',
              annualDuesAmount: Number(cols[8]) || 1800,
              duesPaidAmount: Number(cols[9]) || 1800,
              isDuesPaid: (Number(cols[9]) || 1800) >= (Number(cols[8]) || 1800),
              assignedSeatIds: [],
              familyMembers: [],
              joinedYear: 2026
            });
          }
        }

        onImportMembers(newMembers);
        setImportStatus(`Successfully imported ${newMembers.length} members from file!`);
        setIsProcessing(false);
      } catch (err: any) {
        setImportStatus(`Import error: ${err.message}`);
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  // Import Full JSON Backup
  const handleJSONBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = importFullBackupJSON(text);
        if (success) {
          setImportStatus('Full sanctuary and seating database restored successfully!');
          onFullRestore();
        } else {
          setImportStatus('Invalid backup file format.');
        }
        setIsProcessing(false);
      } catch (err: any) {
        setImportStatus(`Restore error: ${err.message}`);
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-800">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Member Database Sync & Integration
              </h3>
              <p className="text-[11px] text-slate-500">
                Sync with ShulCloud, Chaverware, QuickBooks or Excel CSV
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {importStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 flex items-center space-x-2 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Sync Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Export Member CSV */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs">Export Roster CSV</h4>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Download formatted CSV containing full member profiles, Hebrew names, and dues records.
              </p>
              <button
                onClick={handleDownloadCSV}
                className="w-full py-1.5 rounded bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold transition flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export ({members.length} Members)</span>
              </button>
            </div>

            {/* 2. Import Member CSV */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
                <Upload className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs">Import ShulCloud / CSV</h4>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Upload existing synagogue roster from ShulCloud, Chaverware or custom spreadsheet.
              </p>
              <label className="w-full py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Choose CSV File</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* 3. Full Sanctuary Backup JSON */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
                <Database className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs">Full Sanctuary Backup</h4>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Complete snapshot of all floor plans, seats, reservations, dues and configuration.
              </p>
              <button
                onClick={handleDownloadBackupJSON}
                className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-900 text-white font-bold transition flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Full Backup</span>
              </button>
            </div>

            {/* 4. Restore Sanctuary Backup */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs">Restore Full Backup</h4>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Restore database and floor layout onto any tablet, laptop, or Gabbai workstation.
              </p>
              <label className="w-full py-1.5 rounded bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Select Backup JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleJSONBackupUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
