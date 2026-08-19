import React, { useState, useEffect } from 'react';
import { X, Building, Calendar, Sparkles, Check, Crown, ShieldCheck } from 'lucide-react';
import { ShulConfig, saveConfig } from '../../utils/storage';
import { getHebrewYearString } from '../../utils/hebrewCalendar';
import { useI18n } from '../../utils/i18n';

interface CongregationYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  shulConfig: ShulConfig;
  onUpdateConfig: (config: ShulConfig) => void;
}

const COMMON_YEARS = [
  { year: 5786, hebrew: 'תשפ״ו', secular: '2025-2026' },
  { year: 5787, hebrew: 'תשפ״ז', secular: '2026-2027', current: true },
  { year: 5788, hebrew: 'תשפ״ח', secular: '2027-2028' },
  { year: 5789, hebrew: 'תשפ״ט', secular: '2028-2029' },
  { year: 5790, hebrew: 'תש״צ', secular: '2029-2030' }
];

export const CongregationYearModal: React.FC<CongregationYearModalProps> = ({
  isOpen,
  onClose,
  shulConfig,
  onUpdateConfig
}) => {
  const { t, dir } = useI18n();

  const [form, setForm] = useState<ShulConfig>(shulConfig);
  const [customYearInput, setCustomYearInput] = useState<string>(String(shulConfig.activeYear || 5787));
  const [successNotice, setSuccessNotice] = useState(false);

  useEffect(() => {
    setForm(shulConfig);
    setCustomYearInput(String(shulConfig.activeYear || 5787));
  }, [shulConfig, isOpen]);

  if (!isOpen) return null;

  const handleYearChange = (yearNum: number) => {
    const heb = getHebrewYearString(yearNum);
    const secStart = yearNum - 3761;
    const secStr = `${secStart}-${secStart + 1}`;
    setForm(prev => ({
      ...prev,
      activeYear: yearNum,
      activeHebrewYear: heb,
      secularYear: secStr
    }));
    setCustomYearInput(String(yearNum));
  };

  const handleCustomYearChange = (val: string) => {
    setCustomYearInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 5000 && num <= 6000) {
      const heb = getHebrewYearString(num);
      const secStart = num - 3761;
      setForm(prev => ({
        ...prev,
        activeYear: num,
        activeHebrewYear: heb,
        secularYear: `${secStart}-${secStart + 1}`
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig(form);
    onUpdateConfig(form);
    setSuccessNotice(true);
    setTimeout(() => {
      setSuccessNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-800">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm font-serif text-lg">
              ק
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white uppercase">
                {t('congregation_year_title')}
              </h3>
              <p className="text-[11px] text-blue-200">
                {t('congregation_year_subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast */}
        {successNotice && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-xs font-bold flex items-center space-x-2 animate-fade-in">
            <Check className="w-4 h-4" />
            <span>{t('year_saved_toast')}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {/* Quick Year Selection Pill Bar */}
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-blue-950 font-bold text-xs flex items-center space-x-1.5 rtl:space-x-reverse">
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>{t('quick_year_switch')}</span>
              </label>
              <span className="text-[11px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">
                {form.activeYear} • {form.activeHebrewYear} ({form.secularYear})
              </span>
            </div>

            {/* Year Quick Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {COMMON_YEARS.map(y => {
                const isSelected = form.activeYear === y.year;
                return (
                  <button
                    key={y.year}
                    type="button"
                    onClick={() => handleYearChange(y.year)}
                    className={`py-2 px-2 rounded-lg border text-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="text-xs font-bold">{y.year}</div>
                    <div className="text-[11px] font-serif font-semibold">{y.hebrew}</div>
                    <div className={`text-[9px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {y.secular}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Year Entry */}
            <div className="pt-2 border-t border-blue-200/60 flex items-center gap-2">
              <span className="text-[11px] text-blue-900 font-medium shrink-0">
                {t('enter_custom_year')}:
              </span>
              <input
                type="number"
                min="5000"
                max="6000"
                value={customYearInput}
                onChange={e => handleCustomYearChange(e.target.value)}
                className="w-24 bg-white border border-blue-300 rounded px-2 py-1 text-slate-900 font-bold text-xs"
                placeholder="5787"
              />
              <span className="text-[11px] font-serif font-bold text-blue-800">
                = {form.activeHebrewYear}
              </span>
            </div>
          </div>

          {/* Congregation Name (English & Hebrew) */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-slate-700 font-bold text-[11px] uppercase tracking-wider mb-1">
                {t('congregation_name_en')}
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-2.5 rtl:left-auto rtl:right-2.5 top-2.5" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 pl-9 pr-3 rtl:pl-3 rtl:pr-9 text-slate-900 text-xs font-semibold focus:bg-white focus:border-blue-600 focus:outline-none transition"
                  placeholder="e.g. Congregation Beth Sholom"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-[11px] uppercase tracking-wider mb-1">
                {t('congregation_name_he')}
              </label>
              <input
                type="text"
                dir="rtl"
                required
                value={form.hebrewName}
                onChange={e => setForm({ ...form, hebrewName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 text-xs font-serif font-semibold text-right focus:bg-white focus:border-blue-600 focus:outline-none transition"
                placeholder="קהילת בית שלום"
              />
            </div>
          </div>

          {/* Leadership & Tax Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-slate-700 font-bold text-[11px] uppercase tracking-wider mb-1">
                {t('rabbi_title')}
              </label>
              <input
                type="text"
                value={form.rabbiName}
                onChange={e => setForm({ ...form, rabbiName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder="Rabbi Yaakov Stern"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold text-[11px] uppercase tracking-wider mb-1">
                {t('president_title')}
              </label>
              <input
                type="text"
                value={form.presidentName}
                onChange={e => setForm({ ...form, presidentName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder="Mr. David Levy"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold text-[11px] uppercase tracking-wider mb-1">
                {t('tax_id_label')}
              </label>
              <input
                type="text"
                value={form.taxId}
                onChange={e => setForm({ ...form, taxId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 text-xs font-mono focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder="13-5892104"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold text-[11px] uppercase tracking-wider mb-1">
                Office Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
                placeholder="office@bethsholomny.org"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{t('save_congregation_details')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
