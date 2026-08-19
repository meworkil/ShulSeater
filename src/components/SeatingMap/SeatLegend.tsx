import React from 'react';
import { useI18n } from '../../utils/i18n';

interface SeatLegendProps {
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterTier: string;
  setFilterTier: (tier: string) => void;
  stats: {
    total: number;
    available: number;
    reserved: number;
    mizrach: number;
    shtenders: number;
  };
}

export const SeatLegend: React.FC<SeatLegendProps> = ({
  filterStatus,
  setFilterStatus,
  filterTier,
  setFilterTier,
  stats
}) => {
  const { t, language } = useI18n();
  const isHeb = language === 'he' || language === 'yi';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
      {/* Status Badges with Quick Filters */}
      <div className="flex flex-wrap items-center gap-1.5 rtl:space-x-reverse">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 rtl:mr-0 rtl:ml-1">
          {isHeb ? 'סטטוס:' : 'Status:'}
        </span>
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-2 py-1 rounded text-xs font-semibold border transition cursor-pointer ${
            filterStatus === 'all'
              ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          {isHeb ? `הכל (${stats.total})` : `All (${stats.total})`}
        </button>
        
        <button
          onClick={() => setFilterStatus('available')}
          className={`px-2 py-1 rounded text-xs font-semibold border transition flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer ${
            filterStatus === 'available'
              ? 'bg-blue-50 text-blue-700 border-blue-400 ring-1 ring-blue-400'
              : 'bg-white text-slate-700 border-slate-300 hover:border-blue-300'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-xs bg-white border border-slate-300 inline-block shadow-xs" />
          <span>{isHeb ? `פנוי (${stats.available})` : `Available (${stats.available})`}</span>
        </button>

        <button
          onClick={() => setFilterStatus('reserved')}
          className={`px-2 py-1 rounded text-xs font-semibold border transition flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer ${
            filterStatus === 'reserved'
              ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 border border-blue-600 inline-block" />
          <span>{isHeb ? `שמור (${stats.reserved})` : `Reserved (${stats.reserved})`}</span>
        </button>
      </div>

      {/* Seat Tiers & Indicators */}
      <div className="flex flex-wrap items-center gap-3 text-xs rtl:space-x-reverse">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {isHeb ? 'מקרא סיווג:' : 'Classification:'}
        </span>
        
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-slate-700">
          <span className="w-3.5 h-3.5 rounded-xs bg-slate-900 text-white flex items-center justify-center text-[8px] font-bold">
            {isHeb ? 'מ' : 'M'}
          </span>
          <span className="font-medium text-xs">{isHeb ? 'כותל המזרח' : 'Mizrach Wall'}</span>
        </div>

        <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-slate-700">
          <span className="w-3.5 h-3.5 rounded-xs bg-amber-400 border border-amber-500 text-slate-950 flex items-center justify-center text-[8px] font-bold">!</span>
          <span className="font-medium text-xs">{isHeb ? 'יתרת תשלום חובה' : 'Dues Balance'}</span>
        </div>

        <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-slate-700">
          <span className="w-3.5 h-3.5 rounded-xs bg-white border border-slate-300 flex items-center justify-center text-[9px]">📖</span>
          <span className="font-medium text-xs">{isHeb ? `סטנדר (${stats.shtenders})` : `Shtender (${stats.shtenders})`}</span>
        </div>

        <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-slate-700">
          <span className="w-3.5 h-3.5 rounded-xs bg-slate-100 border border-slate-300 flex items-center justify-center text-[9px]">♿</span>
          <span className="font-medium text-xs">{isHeb ? 'נגיש לנכים' : 'Accessible'}</span>
        </div>
      </div>
    </div>
  );
};
