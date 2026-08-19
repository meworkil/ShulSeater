import React, { useState } from 'react';
import { Plus, UserPlus, Hash, DollarSign, MapPin, Check } from 'lucide-react';
import { Seat, SectionType, SeatTier, SeatStatus } from '../../types/shul';
import { useI18n } from '../../utils/i18n';

interface ManualSeatAdderProps {
  activeSectionId: SectionType;
  existingSeats: Seat[];
  onAddManualSeat: (seat: Seat, message: string) => void;
}

export const ManualSeatAdder: React.FC<ManualSeatAdderProps> = ({
  activeSectionId,
  existingSeats,
  onAddManualSeat
}) => {
  const { t, language } = useI18n();
  const [code, setCode] = useState('M-א-01');
  const [row, setRow] = useState('א');
  const [number, setNumber] = useState(1);
  const [tier, setTier] = useState<SeatTier>('standard');
  const [price, setPrice] = useState(180);
  const [status, setStatus] = useState<SeatStatus>('available');
  const [occupantName, setOccupantName] = useState('');
  const [hebrewName, setHebrewName] = useState('');
  const [hasShtender, setHasShtender] = useState(false);
  const [isAccessible, setIsAccessible] = useState(false);
  
  // Coordinates
  const [xPos, setXPos] = useState(200);
  const [yPos, setYPos] = useState(200);

  const handleAddSeat = (e: React.FormEvent) => {
    e.preventDefault();

    const secSeats = existingSeats.filter(s => s.sectionId === activeSectionId);
    let finalX = xPos;
    let finalY = yPos;

    // Auto-calculate position if left default
    if (finalX === 200 && finalY === 200 && secSeats.length > 0) {
      const lastSeat = secSeats[secSeats.length - 1];
      finalX = lastSeat.x + 55;
      finalY = lastSeat.y;
      if (finalX > 850) {
        finalX = 120;
        finalY = lastSeat.y + 75;
      }
    }

    const newSeat: Seat = {
      id: `seat-manual-${Date.now()}`,
      code: code.trim() || `S-${Date.now().toString().slice(-4)}`,
      sectionId: activeSectionId,
      row: row.trim() || 'א',
      number: Number(number) || 1,
      x: Number(finalX),
      y: Number(finalY),
      tier,
      price: Number(price) || 0,
      status,
      reservedForMemberName: occupantName.trim() || undefined,
      reservedForHebrewName: hebrewName.trim() || undefined,
      hasShtender,
      isAccessible
    };

    onAddManualSeat(newSeat, `Added manual seat "${newSeat.code}"!`);

    // Increment number and code for fast successive entry
    const nextNum = Number(number) + 1;
    setNumber(nextNum);
    const numStr = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    setCode(`${row}-${numStr}`);
    setOccupantName('');
    setHebrewName('');
  };

  const isHeb = language === 'he' || language === 'yi';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-xs text-xs">
      {/* Header */}
      <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
        <span className="w-5 h-5 rounded bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
          ✍
        </span>
        <h3>{isHeb ? 'הוספת מושב ידנית (הגדרה מפורטת)' : 'Manual Seat Input (Custom Details)'}</h3>
      </div>
      <p className="text-[11px] text-slate-500">
        {isHeb
          ? 'הוספה ידנית של מושב יחיד עם שורה מותאמת (א, ב, ג או A, B, C), פרטי מתפלל, מחיר ומיקום.'
          : 'Manually add an individual seat with custom row (Hebrew א, ב, ג or Latin A, B, C), occupant details, pricing, and placement.'}
      </p>

      <form onSubmit={handleAddSeat} className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-slate-700 font-bold text-[10px] uppercase mb-0.5">
              {isHeb ? 'קוד מושב *' : 'Seat Code *'}
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={isHeb ? 'לדוג׳ א-01' : 'e.g. א-01, M-A-01'}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-[10px] uppercase mb-0.5">
              {isHeb ? 'שם שורה' : 'Row Label'}
            </label>
            <input
              type="text"
              value={row}
              onChange={(e) => {
                const val = e.target.value;
                setRow(val);
                const numStr = number < 10 ? `0${number}` : `${number}`;
                setCode(`${val}-${numStr}`);
              }}
              placeholder={isHeb ? 'א, ב, מזרח' : 'e.g. א, ב, A, Mizrach'}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-slate-900"
            />
            {/* Quick Row Chips */}
            <div className="flex gap-1 mt-1 flex-wrap">
              {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'A', 'B', 'C'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRow(r);
                    const numStr = number < 10 ? `0${number}` : `${number}`;
                    setCode(`${r}-${numStr}`);
                  }}
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold cursor-pointer transition ${
                    row === r ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-[10px] uppercase mb-0.5">
              {isHeb ? 'מספר מושב' : 'Seat #'}
            </label>
            <input
              type="number"
              min={1}
              value={number}
              onChange={(e) => {
                const num = Number(e.target.value);
                setNumber(num);
                const numStr = num < 10 ? `0${num}` : `${num}`;
                setCode(`${row}-${numStr}`);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-center text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-[10px] uppercase mb-0.5">
              {isHeb ? 'דרגת מחיר' : 'Tier'}
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-semibold text-slate-900 capitalize text-xs"
            >
              <option value="mizrach">{isHeb ? 'מזרח' : 'Mizrach'}</option>
              <option value="vip">{isHeb ? 'VIP' : 'VIP'}</option>
              <option value="premium">{isHeb ? 'פרימיום' : 'Premium'}</option>
              <option value="standard">{isHeb ? 'רגיל' : 'Standard'}</option>
              <option value="accessible">{isHeb ? 'נגיש' : 'Accessible'}</option>
            </select>
          </div>
        </div>

        {/* Occupant Details & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-slate-700 font-bold text-[10px] uppercase mb-0.5">
              {isHeb ? 'שם מתפלל (אופציונלי)' : 'Occupant / Attendee Name (Optional)'}
            </label>
            <input
              type="text"
              value={occupantName}
              onChange={(e) => {
                setOccupantName(e.target.value);
                if (e.target.value.trim() && status === 'available') {
                  setStatus('reserved');
                }
              }}
              placeholder={isHeb ? 'לדוג׳ משה כהן' : 'e.g. Moshe Cohen'}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-[10px] uppercase mb-0.5">
              {isHeb ? 'שם בעברית מלא לתפילה' : 'Hebrew Name (שם בעברית)'}
            </label>
            <input
              type="text"
              dir="rtl"
              value={hebrewName}
              onChange={(e) => setHebrewName(e.target.value)}
              placeholder="לדוג׳ משה בן ראובן"
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-serif text-slate-900 text-right"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-[10px] uppercase mb-0.5">
              {isHeb ? 'סטטוס ומחיר ($)' : 'Status & Price ($)'}
            </label>
            <div className="flex space-x-1.5 rtl:space-x-reverse">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-1/2 bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-xs"
              >
                <option value="available">{isHeb ? 'פנוי' : 'Available'}</option>
                <option value="reserved">{isHeb ? 'שמור' : 'Reserved'}</option>
                <option value="makom_kavua">{isHeb ? 'מקום קבוע' : 'Makom Kavua'}</option>
                <option value="blocked">{isHeb ? 'חסום' : 'Blocked'}</option>
              </select>

              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-1/2 bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-center text-xs"
                placeholder={isHeb ? 'מחיר' : 'Price'}
              />
            </div>
          </div>
        </div>

        {/* Checkboxes & Submit */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <label className="flex items-center space-x-1.5 rtl:space-x-reverse text-xs text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={hasShtender}
                onChange={(e) => setHasShtender(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600"
              />
              <span>{isHeb ? '+ כולל סטנדר' : '+ Has Shtender'}</span>
            </label>

            <label className="flex items-center space-x-1.5 rtl:space-x-reverse text-xs text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={isAccessible}
                onChange={(e) => setIsAccessible(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600"
              />
              <span>{isHeb ? '♿ מותאם נגישות' : '♿ Accessible'}</span>
            </label>
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isHeb ? `הוסף מושב (${code})` : `Add Manual Seat (${code})`}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
