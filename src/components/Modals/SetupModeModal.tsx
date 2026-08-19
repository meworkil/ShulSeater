import React, { useState } from 'react';
import { Sparkles, FileText, Crown, Check, X, AlertTriangle, UserCheck, Trash2 } from 'lucide-react';
import { useI18n } from '../../utils/i18n';

interface SetupModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDefaultWithDignitaries: () => void;
  onSelectBlankManual: () => void;
  currentSeatsCount: number;
}

export const SetupModeModal: React.FC<SetupModeModalProps> = ({
  isOpen,
  onClose,
  onSelectDefaultWithDignitaries,
  onSelectBlankManual,
  currentSeatsCount
}) => {
  const { t } = useI18n();
  const [confirmBlank, setConfirmBlank] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 text-slate-800 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Synagogue Setup & Layout Options
              </h2>
              <p className="text-xs text-slate-500">
                Choose how you want your sanctuary and seating database configured.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option Cards */}
        <div className="space-y-3.5">
          {/* Option 1: Default Names and Places (Rabbi, Gabbai, etc.) */}
          <div
            onClick={() => {
              if (window.confirm('Initialize sanctuary with default places (Rabbi, Gabbaim, Chazan, President) and standard tables/shtenders?')) {
                onSelectDefaultWithDignitaries();
                onClose();
              }
            }}
            className="p-4 rounded-xl border-2 border-blue-500/40 hover:border-blue-600 bg-blue-50/40 hover:bg-blue-50/80 transition cursor-pointer space-y-2 group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  <Crown className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-sm text-blue-950 group-hover:text-blue-700">
                  Option 1: Default Names & Places (Rabbi, Gabbai, etc.)
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-200/80 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
                Pre-configured
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pl-8">
              Loads pre-configured sanctuary layout with honorary places for <strong>Rabbi (Mora D’Asra)</strong>, <strong>Gabbai Rishon & Gabbai Sheni</strong>, <strong>Chazan (Cantor)</strong>, <strong>President (Parnas)</strong>, along with multi-seater study tables and shtenders.
            </p>

            <div className="flex flex-wrap gap-1.5 pl-8 pt-1 text-[11px] text-blue-900 font-medium">
              <span className="bg-white/80 px-2 py-0.5 rounded border border-blue-200">👑 Rabbi's Place & Lectern</span>
              <span className="bg-white/80 px-2 py-0.5 rounded border border-blue-200">📜 Gabbaim at Bimah</span>
              <span className="bg-white/80 px-2 py-0.5 rounded border border-blue-200">🎤 Cantor's Amud</span>
              <span className="bg-white/80 px-2 py-0.5 rounded border border-blue-200">🪑 Tables & Shtenders</span>
            </div>
          </div>

          {/* Option 2: Blank Slate / Everything Manually Put In */}
          {!confirmBlank ? (
            <div
              onClick={() => setConfirmBlank(true)}
              className="p-4 rounded-xl border-2 border-slate-300 hover:border-slate-400 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer space-y-2 group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-slate-950">
                    Option 2: Blank Setup (Everything Manually Put In)
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold uppercase tracking-wider">
                  Clean Slate
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                Clears all demo seats, demo members, and reservations. Starts with a completely blank sanctuary floor plan so you can <strong>manually add every table, seat, attendee name, and section</strong> from scratch.
              </p>

              <div className="flex flex-wrap gap-1.5 pl-8 pt-1 text-[11px] text-slate-700 font-medium">
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">✦ 0 Pre-set seats</span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">✦ 100% Manual input</span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">✦ Clean member roster</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border-2 border-rose-400 bg-rose-50/70 space-y-3 shadow-xs animate-fade-in">
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Are you sure you want a completely blank setup?</span>
              </div>
              <p className="text-xs text-slate-700">
                This will reset the layout to an empty canvas with 0 seats, 0 reservations, and a fresh member roster ready for manual entry.
              </p>
              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmBlank(false)}
                  className="px-3 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectBlankManual();
                    setConfirmBlank(false);
                    onClose();
                  }}
                  className="px-3.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Yes, Start Completely Blank
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span>Current Seats: <strong>{currentSeatsCount}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
