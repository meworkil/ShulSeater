import React, { useState } from 'react';
import { 
  Printer, 
  Tag, 
  BookOpen, 
  FileText, 
  Crown, 
  Check, 
  Sliders,
  Filter,
  Download
} from 'lucide-react';
import { Seat, ShulSection, ShulEvent, Member } from '../../types/shul';
import { generateLabelQRUrl } from '../../utils/hebrewCalendar';
import { ShulConfig } from '../../utils/storage';

interface PrintManagerProps {
  seats: Seat[];
  sections: ShulSection[];
  activeEvent: ShulEvent;
  members: Member[];
  shulConfig: ShulConfig;
}

export const PrintManager: React.FC<PrintManagerProps> = ({
  seats,
  sections,
  activeEvent,
  members,
  shulConfig
}) => {
  const [printFormat, setPrintFormat] = useState<'avery_labels' | 'shtender_placards' | 'table_tents' | 'gabbai_binder'>('shtender_placards');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [onlyReserved, setOnlyReserved] = useState(true);
  const [includeQR, setIncludeQR] = useState(true);
  const [includeHebrew, setIncludeHebrew] = useState(true);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  // Filtered printable seats
  const printableSeats = seats.filter(s => {
    const matchesSection = filterSection === 'all' || s.sectionId === filterSection;
    const matchesStatus = onlyReserved ? s.status === 'reserved' : true;
    return matchesSection && matchesStatus;
  });

  // Alphabetical list for Gabbai Binder
  const alphabeticalMembers = [...printableSeats]
    .filter(s => s.reservedForMemberName)
    .sort((a, b) => (a.reservedForMemberName || '').localeCompare(b.reservedForMemberName || ''));

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 text-slate-800 font-sans">
      {/* Top Controls Bar (Hidden in Print) */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <Printer className="w-4 h-4 text-blue-600" />
              Printable Seat Labels, Placards & Gabbai Binder
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              High-resolution print engine for Avery stickers, Shtender placards, and emergency offline binders for {activeEvent.title}.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Current Format ({printableSeats.length} Items)</span>
          </button>
        </div>

        {/* Format Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'shtender_placards', label: '🪑 Shtender Placards', desc: 'Framed card with Hebrew name' },
            { id: 'avery_labels', label: '🏷️ Avery Labels (5160)', desc: 'Standard 3-column sticker sheets' },
            { id: 'table_tents', label: '📐 Folded Table Tents', desc: 'Double-sided for Beis Midrash tables' },
            { id: 'gabbai_binder', label: '📖 Gabbai Yom Tov Binder', desc: 'Alphabetical & numerical usher roster' }
          ].map(fmt => (
            <button
              key={fmt.id}
              onClick={() => setPrintFormat(fmt.id as any)}
              className={`p-2.5 rounded-lg border text-left transition ${
                printFormat === fmt.id
                  ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="font-bold text-xs block text-slate-900">{fmt.label}</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">{fmt.desc}</span>
            </button>
          ))}
        </div>

        {/* Filters and Customization Toggles */}
        <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-bold text-[10px] uppercase">Section:</span>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Sanctuary Sections</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center space-x-1.5 text-slate-700 font-medium cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={onlyReserved}
              onChange={(e) => setOnlyReserved(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-600 bg-slate-50 border-slate-300"
            />
            <span>Only Reserved Seats (Skip Empty)</span>
          </label>

          <label className="flex items-center space-x-1.5 text-slate-700 font-medium cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={includeHebrew}
              onChange={(e) => setIncludeHebrew(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-600 bg-slate-50 border-slate-300"
            />
            <span>Include Hebrew Names (שם בעברית)</span>
          </label>

          <label className="flex items-center space-x-1.5 text-slate-700 font-medium cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={includeQR}
              onChange={(e) => setIncludeQR(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-600 bg-slate-50 border-slate-300"
            />
            <span>Include Verification QR Code</span>
          </label>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINT PREVIEW AREA (Formatted cleanly for print media and onscreen viewing) */}
      {/* ========================================================================= */}
      <div className="bg-white text-slate-950 p-6 sm:p-8 rounded-lg border border-slate-200 shadow-xs min-h-[600px] print:p-0 print:m-0 print:shadow-none print:border-none">
        
        {/* FORMAT 1: ELEGANT SHTENDER & CHAIR PLACARDS */}
        {printFormat === 'shtender_placards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
            {printableSeats.map((seat) => (
              <div
                key={seat.id}
                className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/60 flex flex-col justify-between relative overflow-hidden page-break-inside-avoid min-h-[150px]"
              >
                {/* Top Corner Shul Crest & Yom Tov Greeting */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-1 text-[10px] text-slate-600 font-serif">
                  <span className="font-bold text-slate-800">{shulConfig.name.split('-')[0]}</span>
                  <span className="font-semibold text-blue-800">לשנה טובה תכתבו</span>
                </div>

                {/* Center Names */}
                <div className="text-center py-2 space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-950 font-serif">
                    {seat.reservedForMemberName || 'Reserved for Congregant'}
                  </h4>
                  {includeHebrew && seat.reservedForHebrewName && (
                    <p className="text-xs font-serif text-slate-700 font-semibold dir-rtl">
                      {seat.reservedForHebrewName}
                    </p>
                  )}
                </div>

                {/* Bottom Row: Seat Code & QR */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 text-[10px]">
                  <div>
                    <span className="text-slate-400 block uppercase tracking-wider text-[8px]">Seat</span>
                    <strong className="text-sm font-mono font-black text-slate-900">{seat.code}</strong>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 block text-[9px]">
                      Row {seat.row} • {seat.sectionId.replace('_', ' ').toUpperCase()}
                    </span>
                    {seat.hasShtender && (
                      <span className="text-[9px] font-bold text-blue-700">📖 Shtender Included</span>
                    )}
                  </div>

                  {includeQR && (
                    <img
                      src={generateLabelQRUrl(seat.code, seat.reservedForMemberName || 'Seat', activeEvent.id)}
                      alt="QR"
                      className="w-8 h-8 shrink-0 ml-1.5"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FORMAT 2: AVERY ADHESIVE LABELS (30 Per Sheet - 3 x 10) */}
        {printFormat === 'avery_labels' && (
          <div className="grid grid-cols-3 gap-2.5 print:grid-cols-3 print:gap-2">
            {printableSeats.map((seat) => (
              <div
                key={seat.id}
                className="border border-slate-300 rounded p-2 text-[10px] flex flex-col justify-between min-h-[85px] page-break-inside-avoid"
              >
                <div className="flex justify-between items-center text-[9px] font-semibold text-slate-600">
                  <span>{shulConfig.name.split('-')[0]}</span>
                  <span className="font-mono font-bold text-slate-950 text-xs">{seat.code}</span>
                </div>

                <div className="text-center my-0.5">
                  <div className="font-bold text-slate-950 truncate text-[11px]">
                    {seat.reservedForMemberName || 'Reserved'}
                  </div>
                  {includeHebrew && seat.reservedForHebrewName && (
                    <div className="text-[10px] font-serif text-slate-700 dir-rtl truncate">
                      {seat.reservedForHebrewName}
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-[8px] text-slate-500 border-t border-slate-200 pt-0.5">
                  <span>Row {seat.row} • #{seat.number}</span>
                  <span>{activeEvent.hebrewTitle.split(' ')[0]}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FORMAT 3: FOLDED TABLE TENTS (For Beis Midrash tables) */}
        {printFormat === 'table_tents' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
            {printableSeats.map((seat) => (
              <div
                key={seat.id}
                className="border border-slate-300 rounded-xl p-5 flex flex-col justify-between min-h-[240px] page-break-inside-avoid bg-slate-50/50 shadow-xs"
              >
                {/* Upside Down Face (For folding tent top) */}
                <div className="rotate-180 border-b border-dashed border-slate-300 pb-2.5 text-center opacity-70">
                  <span className="text-[10px] font-serif uppercase tracking-widest text-slate-600">{shulConfig.name}</span>
                  <h4 className="text-xs font-bold text-slate-800">{seat.reservedForMemberName || 'Reserved'}</h4>
                  <span className="font-mono text-xs font-bold text-blue-700">{seat.code}</span>
                </div>

                <div className="py-1.5 text-center text-[9px] text-slate-400 font-mono">
                  - - - - - - - - - - FOLD ALONG CENTER LINE - - - - - - - - - -
                </div>

                {/* Right Side Up Face (Main Front View) */}
                <div className="text-center pt-1.5 space-y-1">
                  <span className="text-[10px] font-serif uppercase tracking-wider text-blue-800 font-bold">
                    {activeEvent.title}
                  </span>
                  <h3 className="text-base font-bold font-serif text-slate-950">
                    {seat.reservedForMemberName || 'Reserved for Congregant'}
                  </h3>
                  {includeHebrew && seat.reservedForHebrewName && (
                    <p className="text-xs font-serif text-slate-700 font-semibold dir-rtl">
                      {seat.reservedForHebrewName}
                    </p>
                  )}
                  <div className="inline-block mt-1 px-2.5 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-xs">
                    Seat: {seat.code} (Row {seat.row})
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FORMAT 4: GABBAI MASTER YOM TOV SEATING BINDER */}
        {printFormat === 'gabbai_binder' && (
          <div className="space-y-6">
            {/* Binder Cover Header */}
            <div className="text-center border-b border-slate-300 pb-3 space-y-0.5">
              <span className="text-xs font-serif font-bold text-blue-800 uppercase tracking-widest">
                בס״ד • Official Gabbai & Usher Master Seating Binder
              </span>
              <h2 className="text-xl font-serif font-black text-slate-950">{shulConfig.name}</h2>
              <p className="text-xs text-slate-600">
                {activeEvent.title} ({activeEvent.hebrewTitle}) • {activeEvent.timeRange}
              </p>
              <p className="text-[10px] font-mono text-slate-400">
                Generated for Yom Tov Offline Use • Total Assigned Seats: {alphabeticalMembers.length}
              </p>
            </div>

            {/* Section 1: Alphabetical Member Roster */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider bg-slate-900 text-white p-2 rounded mb-2">
                1. Alphabetical Congregant Seat Directory (A - Z)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {alphabeticalMembers.map((seat) => (
                  <div key={seat.id} className="p-2 border border-slate-200 rounded flex justify-between items-center bg-slate-50">
                    <div>
                      <strong className="block text-slate-950 text-xs">{seat.reservedForMemberName}</strong>
                      {seat.reservedForHebrewName && (
                        <span className="text-[10px] font-serif text-slate-700 dir-rtl block">
                          {seat.reservedForHebrewName}
                        </span>
                      )}
                    </div>
                    <div className="text-right font-mono font-bold text-blue-700 text-xs">
                      {seat.code}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Numerical Seat Order Roster */}
            <div className="pt-3 page-break-before-always">
              <h3 className="text-xs font-bold uppercase tracking-wider bg-slate-900 text-white p-2 rounded mb-2">
                2. Numerical Floor Plan Walkthrough (By Section & Row)
              </h3>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 uppercase text-[10px]">
                  <tr>
                    <th className="p-2 border border-slate-300">Seat Code</th>
                    <th className="p-2 border border-slate-300">Section</th>
                    <th className="p-2 border border-slate-300">Row / #</th>
                    <th className="p-2 border border-slate-300">Assigned Congregant</th>
                    <th className="p-2 border border-slate-300">Hebrew Name</th>
                    <th className="p-2 border border-slate-300">Shtender</th>
                  </tr>
                </thead>
                <tbody>
                  {printableSeats.map((seat) => (
                    <tr key={seat.id} className="border-b border-slate-200">
                      <td className="p-2 border border-slate-300 font-mono font-bold">{seat.code}</td>
                      <td className="p-2 border border-slate-300 capitalize">{seat.sectionId.replace('_', ' ')}</td>
                      <td className="p-2 border border-slate-300">Row {seat.row} - #{seat.number}</td>
                      <td className="p-2 border border-slate-300 font-semibold">{seat.reservedForMemberName || '— Open —'}</td>
                      <td className="p-2 border border-slate-300 font-serif text-slate-700">{seat.reservedForHebrewName || '—'}</td>
                      <td className="p-2 border border-slate-300">{seat.hasShtender ? 'YES' : 'NO'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
