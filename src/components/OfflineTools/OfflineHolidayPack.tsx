import React, { useState } from 'react';
import { 
  X, 
  Wifi, 
  WifiOff, 
  Printer, 
  Download, 
  ShieldCheck, 
  BookOpen, 
  Save, 
  Layers, 
  Check, 
  Database,
  Building,
  Settings
} from 'lucide-react';
import { ShulConfig, exportFullBackupJSON, saveConfig } from '../../utils/storage';
import { ShulEvent, Seat, Member } from '../../types/shul';

interface OfflineHolidayPackProps {
  isOpen: boolean;
  onClose: () => void;
  isOffline: boolean;
  shulConfig: ShulConfig;
  onUpdateConfig: (config: ShulConfig) => void;
  activeEvent: ShulEvent;
  seats: Seat[];
  members: Member[];
}

export const OfflineHolidayPack: React.FC<OfflineHolidayPackProps> = ({
  isOpen,
  onClose,
  isOffline,
  shulConfig,
  onUpdateConfig,
  activeEvent,
  seats,
  members
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'offline_pack' | 'shul_settings'>('offline_pack');
  const [configForm, setConfigForm] = useState<ShulConfig>(shulConfig);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleDownloadBackup = () => {
    const jsonContent = exportFullBackupJSON();
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `shul_yomtov_emergency_backup_${activeEvent.id}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig(configForm);
    onUpdateConfig(configForm);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-800">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              {activeTab === 'offline_pack' ? <ShieldCheck className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {activeTab === 'offline_pack' ? 'High-Traffic Yom Tov & Offline Hub' : 'Synagogue Settings & Administration'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {activeTab === 'offline_pack' ? 'Offline readiness for Rosh Hashanah & Yom Kippur' : 'Congregation details, 501(c)(3) EIN & Leadership'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab(activeTab === 'offline_pack' ? 'shul_settings' : 'offline_pack')}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 shadow-xs"
            >
              {activeTab === 'offline_pack' ? '⚙️ Shul Settings' : '⚡ Offline Pack'}
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {savedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 flex items-center space-x-2 font-semibold">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Synagogue settings updated successfully!</span>
            </div>
          )}

          {activeTab === 'offline_pack' ? (
            <div className="space-y-4">
              {/* Status Banner */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Full Offline PWA Local Storage Active</h4>
                    <p className="text-slate-500 text-[10px]">
                      All {seats.length} seats, floor plans, and {members.length} members are cached locally on this device.
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-emerald-700 bg-emerald-100 font-bold text-[10px] uppercase">
                  100% Cached
                </span>
              </div>

              {/* Gabbai Yom Tov Emergency Checklist */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  Gabbai & Usher Pre-Yom Tov Physical Pack
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <strong className="text-slate-900 block text-xs font-bold">1. Print Master Seating Binder</strong>
                    <p className="text-slate-500 text-[10px]">
                      Complete A-Z member index & numerical seat lists for ushers when electronics are not used.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        window.print();
                      }}
                      className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 mt-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Master Binder</span>
                    </button>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <strong className="text-slate-900 block text-xs font-bold">2. Download Standalone Backup JSON</strong>
                    <p className="text-slate-500 text-[10px]">
                      Save complete snapshot to USB drive to load instantly onto any backup laptop or tablet.
                    </p>
                    <button
                      onClick={handleDownloadBackup}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 mt-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Offline Snapshot</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 text-[11px] leading-relaxed">
                💡 <strong>High-Traffic Tip:</strong> Before Kol Nidre and Rosh Hashanah morning, print 2 copies of the Master Binder: one for the Front Entrance Welcome Desk and one for the Central Bimah Gabbai station.
              </div>
            </div>
          ) : (
            /* Synagogue Settings Form */
            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Synagogue Legal Name</label>
                  <input
                    type="text"
                    value={configForm.name}
                    onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Hebrew Name (שם בית הכנסת)</label>
                  <input
                    type="text"
                    value={configForm.hebrewName}
                    onChange={(e) => setConfigForm({ ...configForm, hebrewName: e.target.value })}
                    dir="rtl"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-serif text-right text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Rabbi / Mara D'Asra</label>
                  <input
                    type="text"
                    value={configForm.rabbiName}
                    onChange={(e) => setConfigForm({ ...configForm, rabbiName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">President / Parnas</label>
                  <input
                    type="text"
                    value={configForm.presidentName}
                    onChange={(e) => setConfigForm({ ...configForm, presidentName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Synagogue Physical Address</label>
                <input
                  type="text"
                  value={configForm.address}
                  onChange={(e) => setConfigForm({ ...configForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Office Phone</label>
                  <input
                    type="text"
                    value={configForm.phone}
                    onChange={(e) => setConfigForm({ ...configForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Office Email</label>
                  <input
                    type="email"
                    value={configForm.email}
                    onChange={(e) => setConfigForm({ ...configForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">501(c)(3) EIN Tax ID</label>
                  <input
                    type="text"
                    value={configForm.taxId}
                    onChange={(e) => setConfigForm({ ...configForm, taxId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2.5 border-t border-slate-200">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Save Synagogue Details
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
