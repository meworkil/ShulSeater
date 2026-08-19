import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  Users, 
  Calendar, 
  Printer, 
  CreditCard, 
  Mail, 
  Compass, 
  Download,
  Settings,
  BarChart3,
  Globe,
  Check,
  MonitorDown,
  Sparkles,
  Building,
  Edit2,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { ShulEvent } from '../types/shul';
import { ShulConfig } from '../utils/storage';
import { useI18n, LANGUAGES, Language } from '../utils/i18n';

// PWA Install Button Component
const PwaInstallButton = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const { t } = useI18n();

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  if (!installPrompt) return null;

  return (
    <button
      onClick={handleInstall}
      className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 text-[11px] font-bold transition shadow-xs cursor-pointer"
      title="Install as native Windows/Mac app"
    >
      <MonitorDown className="w-3.5 h-3.5 text-indigo-200" />
      <span className="hidden sm:inline">{t('install_app')}</span>
    </button>
  );
};

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  activeEvent: ShulEvent;
  events: ShulEvent[];
  onSelectEvent: (eventId: string) => void;
  isOffline: boolean;
  onOpenOfflineModal: () => void;
  onOpenSetupModal?: () => void;
  shulConfig?: ShulConfig;
  onOpenCongregationModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  activeEvent,
  events,
  onSelectEvent,
  isOffline,
  onOpenOfflineModal,
  onOpenSetupModal,
  shulConfig,
  onOpenCongregationModal
}) => {
  const { language, setLanguage, t, dir } = useI18n();
  const [showServicePicker, setShowServicePicker] = useState<boolean>(() => {
    const saved = localStorage.getItem('km_show_service_picker');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleServicePicker = () => {
    setShowServicePicker(prev => {
      const next = !prev;
      localStorage.setItem('km_show_service_picker', String(next));
      return next;
    });
  };

  const currentYearDisplay = shulConfig?.activeYear || 5787;
  const currentHebYearDisplay = shulConfig?.activeHebrewYear || 'תשפ״ז';
  const shulNameDisplay = shulConfig?.name || 'Congregation Beth Sholom';
  const shulHebNameDisplay = shulConfig?.hebrewName || 'קהילת בית שלום';

  return (
    <header className="bg-[#0F172A] text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm shrink-0 select-none">
      {/* Top High-Density Control Bar */}
      <div className="px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 text-xs">
        {/* Brand & Shul Identity */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div 
            onClick={onOpenCongregationModal}
            className="flex items-center space-x-2.5 rtl:space-x-reverse cursor-pointer hover:opacity-90 transition group"
            title="Click to edit Congregation Name & Year (שם הקהילה ושנה)"
          >
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-xs shadow-sm font-serif group-hover:scale-105 transition">
              ק
            </div>
            <div className="flex items-baseline space-x-2 rtl:space-x-reverse">
              <span className="font-bold text-sm tracking-tight text-white">{t('app_title')}</span>
              <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase bg-blue-950/80 border border-blue-800/60 px-1.5 py-0.5 rounded">
                Kovea Makom Pro
              </span>
            </div>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>

          {/* Congregation Name & Year Pill */}
          <div 
            onClick={onOpenCongregationModal}
            className="flex items-center space-x-2 rtl:space-x-reverse text-slate-300 text-xs cursor-pointer px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500 transition group"
            title="Click to change Congregation Name or Year (שם בית הכנסת ושנה)"
          >
            <Building className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-medium text-slate-200 group-hover:text-blue-300 transition">
              {language === 'he' || language === 'yi' ? shulHebNameDisplay : shulNameDisplay}
            </span>
            <span className="text-slate-400 font-serif text-[11px] hidden md:inline">
              ({shulHebNameDisplay})
            </span>
            {/* Year Badge */}
            <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
              <span>{currentYearDisplay}</span>
              <span>•</span>
              <span className="font-serif">{currentHebYearDisplay}</span>
              <Edit2 className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" />
            </span>
          </div>
        </div>

        {/* System Status, 5-Language Selector & Tools */}
        <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
          {/* Quick Shul & Year Edit Button */}
          {onOpenCongregationModal && (
            <button
              onClick={onOpenCongregationModal}
              className="flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1 rounded bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 border border-blue-700/60 text-[11px] font-bold transition shadow-xs cursor-pointer"
              title="Edit Congregation Name and Active Year (5787 • תשפ״ז)"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('congregation_year_btn')}</span>
            </button>
          )}

          {/* Setup / Reset Modes Selector Button */}
          {onOpenSetupModal && (
            <button
              onClick={onOpenSetupModal}
              className="flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition shadow-xs cursor-pointer"
              title="Setup Modes: Default Names & Places vs Blank Slate"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('setup_options_btn')}</span>
            </button>
          )}

          {/* 5-Language Selector */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded px-1.5 py-0.5">
            <Globe className="w-3.5 h-3.5 text-blue-400 mr-1 rtl:ml-1 shrink-0" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-[11px] font-bold text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                  {lang.flag} {lang.nativeName} ({lang.label})
                </option>
              ))}
            </select>
          </div>

          {/* DB & Offline Status Widget */}
          <div 
            onClick={onOpenOfflineModal}
            className="flex items-center space-x-2 rtl:space-x-reverse px-2.5 py-1 rounded bg-slate-800/90 border border-slate-700 text-slate-300 text-[11px] cursor-pointer hover:border-slate-600 transition"
            title="Database & Offline Storage Status"
          >
            <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
              <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-400 animate-ping' : 'bg-green-500'}`} />
              <span className="font-medium text-slate-200">{isOffline ? t('offline_badge') : t('online_badge')}</span>
            </div>
          </div>

          {/* PWA Install Button */}
          <PwaInstallButton />

          {/* Quick Yom Tov Offline Binder Export */}
          <button
            onClick={onOpenOfflineModal}
            className="flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition cursor-pointer"
            title={t('offline_hub_btn')}
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">{t('offline_hub_btn')}</span>
          </button>

          {/* Settings / Config Button */}
          <button
            onClick={onOpenOfflineModal}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Navigation & Event Bar */}
      <div className="px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90">
        {/* Left: Active Event Quick Switcher (Synchronized with Chosen Year & Date) */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {showServicePicker ? (
            <div className="flex items-center space-x-1.5 rtl:space-x-reverse bg-slate-800 border border-slate-700 hover:border-slate-600 rounded px-2.5 py-1 text-xs transition">
              <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-[10px] text-slate-400 uppercase font-bold hidden sm:inline">{t('switch_event')}</span>
              <select
                value={activeEvent.id}
                onChange={(e) => onSelectEvent(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1 max-w-[200px] sm:max-w-[280px] truncate"
                title={`Active Service: ${activeEvent.title} (${activeEvent.hebrewDate || currentHebYearDisplay})`}
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id} className="bg-slate-900 text-white">
                    {language === 'he' || language === 'yi' ? evt.hebrewTitle : evt.title} • {evt.hebrewDate || currentHebYearDisplay}
                  </option>
                ))}
              </select>
              {/* Synced Date Badge */}
              <span className="hidden xl:inline-block px-1.5 py-0.2 bg-blue-900/60 text-blue-300 border border-blue-700/50 text-[10px] font-bold rounded">
                {activeEvent.hebrewDate || currentHebYearDisplay}
              </span>
              {/* Optional hide button to remove picker from banner if preferred */}
              <button
                type="button"
                onClick={toggleServicePicker}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition cursor-pointer ml-1 rtl:mr-1"
                title="Hide Service Picker from Banner (or click to re-enable)"
              >
                <EyeOff className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={toggleServicePicker}
              className="flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer"
              title="Show Active Service Picker in Banner"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-semibold text-slate-200">
                {language === 'he' || language === 'yi' ? activeEvent.hebrewTitle : activeEvent.title}
              </span>
              <span className="text-[10px] text-blue-400 font-mono">({activeEvent.hebrewDate || currentHebYearDisplay})</span>
              <Eye className="w-3 h-3 text-slate-400 hover:text-slate-200 ml-1" />
            </button>
          )}
        </div>

        {/* Right: Navigation Tabs */}
        <nav className="flex items-center space-x-0.5 rtl:space-x-reverse overflow-x-auto py-0.5">
          {[
            { id: 'seating_map', label: t('tab_seating_map'), icon: Compass },
            { id: 'dashboard', label: t('tab_dashboard'), icon: BarChart3 },
            { id: 'member_portal', label: language === 'he' || language === 'yi' ? 'פורטל בחירת מקום ותשלום' : 'Member Portal & Pay', icon: ShieldCheck, highlight: true },
            { id: 'reservations', label: t('tab_reservations'), icon: Building2 },
            { id: 'layout_designer', label: t('tab_layout_designer'), icon: Layers },
            { id: 'members', label: t('tab_members'), icon: Users },
            { id: 'financials', label: t('tab_financials'), icon: CreditCard },
            { id: 'print_center', label: t('tab_print_center'), icon: Printer },
            { id: 'emails', label: t('tab_emails'), icon: Mail },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                    : tab.highlight
                    ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-700/50 hover:bg-emerald-900/60'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
