import React, { useState } from 'react';
import { Crown, UserCheck, Plus, Sparkles, BookOpen, Mic, Building, Check } from 'lucide-react';
import { Seat, LayoutElement, SectionType, SeatTier } from '../../types/shul';
import { useI18n } from '../../utils/i18n';

interface DignitariesManagerProps {
  activeSectionId: SectionType;
  existingSeats: Seat[];
  existingElements: LayoutElement[];
  onAddDignitaries: (newSeats: Seat[], newElements: LayoutElement[], message: string) => void;
}

export interface DignitaryRole {
  roleId: string;
  title: string;
  hebrewTitle: string;
  defaultName: string;
  defaultHebrewName: string;
  codePrefix: string;
  rowName: string;
  tier: SeatTier;
  price: number;
  icon: string;
  hasLectern: boolean;
  lecternLabel?: string;
  lecternHebrew?: string;
  xOffset: number;
  yOffset: number;
}

const DEFAULT_ROLES: DignitaryRole[] = [
  {
    roleId: 'rabbi',
    title: "Rabbi (Mora D'Asra)",
    hebrewTitle: 'הרב מרא דאתרא',
    defaultName: 'Rabbi',
    defaultHebrewName: 'הרב',
    codePrefix: 'RABBI',
    rowName: 'Mizrach',
    tier: 'mizrach',
    price: 500,
    icon: '👑',
    hasLectern: true,
    lecternLabel: "Rabbi's Lectern",
    lecternHebrew: 'עמוד הרב',
    xOffset: 270,
    yOffset: 40
  },
  {
    roleId: 'gabbai_rishon',
    title: 'Gabbai Rishon (First Gabbai)',
    hebrewTitle: 'ראש הגבאים',
    defaultName: 'Gabbai 1',
    defaultHebrewName: 'גבאי ראשון',
    codePrefix: 'GAB-1',
    rowName: 'Bimah',
    tier: 'vip',
    price: 360,
    icon: '📜',
    hasLectern: false,
    xOffset: 375,
    yOffset: 390
  },
  {
    roleId: 'gabbai_sheni',
    title: 'Gabbai Sheni (Second Gabbai)',
    hebrewTitle: 'גבאי שני',
    defaultName: 'Gabbai 2',
    defaultHebrewName: 'גבאי שני',
    codePrefix: 'GAB-2',
    rowName: 'Bimah',
    tier: 'vip',
    price: 360,
    icon: '📜',
    hasLectern: false,
    xOffset: 595,
    yOffset: 390
  },
  {
    roleId: 'chazan',
    title: "Chazan (Cantor / Ba'al Tefillah)",
    hebrewTitle: 'שליח ציבור / חזן',
    defaultName: 'Chazan',
    defaultHebrewName: 'חזן',
    codePrefix: 'CHAZAN',
    rowName: 'Amud',
    tier: 'vip',
    price: 360,
    icon: '🎤',
    hasLectern: true,
    lecternLabel: "Chazan's Amud",
    lecternHebrew: 'עמוד החזן',
    xOffset: 480,
    yOffset: 95
  },
  {
    roleId: 'president',
    title: 'President (Parnas HaChodesh / Nasi)',
    hebrewTitle: 'נשיא הקהילה / פרנס',
    defaultName: 'President',
    defaultHebrewName: 'נשיא',
    codePrefix: 'PRES',
    rowName: 'Mizrach',
    tier: 'mizrach',
    price: 500,
    icon: '🏛️',
    hasLectern: false,
    xOffset: 670,
    yOffset: 80
  },
  {
    roleId: 'rosh_yeshiva',
    title: 'Rosh Yeshiva / Maggid Shiur',
    hebrewTitle: 'ראש הישיבה / מגיד שיעור',
    defaultName: 'Rosh Yeshiva',
    defaultHebrewName: 'ראש הישיבה',
    codePrefix: 'RY',
    rowName: 'Dais',
    tier: 'vip',
    price: 400,
    icon: '🎓',
    hasLectern: true,
    lecternLabel: "Maggid Shiur Podium",
    lecternHebrew: 'עמוד מגיד שיעור',
    xOffset: 200,
    yOffset: 80
  }
];

export const DignitariesManager: React.FC<DignitariesManagerProps> = ({
  activeSectionId,
  existingSeats,
  existingElements,
  onAddDignitaries
}) => {
  const { t, language } = useI18n();
  const isHeb = language === 'he' || language === 'yi';

  // Custom Dignitary Form State
  const [selectedRole, setSelectedRole] = useState<string>('rabbi');
  const [customName, setCustomName] = useState<string>('Rabbi');
  const [customHebrewName, setCustomHebrewName] = useState<string>('הרב');
  const [customCode, setCustomCode] = useState<string>('RABBI-01');
  const [customTier, setCustomTier] = useState<SeatTier>('mizrach');
  const [customPrice, setCustomPrice] = useState<number>(500);
  const [includeLectern, setIncludeLectern] = useState<boolean>(true);

  // When role changes, update default values
  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    const r = DEFAULT_ROLES.find(x => x.roleId === roleId);
    if (r) {
      setCustomName(r.defaultName);
      setCustomHebrewName(r.defaultHebrewName);
      setCustomCode(`${r.codePrefix}-01`);
      setCustomTier(r.tier);
      setCustomPrice(r.price);
      setIncludeLectern(r.hasLectern);
    }
  };

  // Add all default leadership places with 1-click
  const handleAddAllDefaultDignitaries = () => {
    const newSeats: Seat[] = [];
    const newElements: LayoutElement[] = [];
    const now = Date.now();

    DEFAULT_ROLES.forEach((r, idx) => {
      const seatId = `seat-dig-${r.roleId}-${now}-${idx}`;
      
      // If it has a lectern/amud/podium
      if (r.hasLectern) {
        newElements.push({
          id: `elem-dig-${r.roleId}-${now}-${idx}`,
          type: r.roleId === 'rabbi' ? 'rabbi_podium' : 'chazan_amud',
          label: r.lecternLabel || `${r.title} Lectern`,
          hebrewLabel: r.lecternHebrew,
          sectionId: activeSectionId,
          x: r.xOffset,
          y: r.yOffset,
          width: 50,
          height: 35,
          color: '#78350f'
        });
      }

      newSeats.push({
        id: seatId,
        code: `${r.codePrefix}-01`,
        sectionId: activeSectionId,
        row: r.rowName,
        number: 1,
        x: r.xOffset + 5,
        y: r.yOffset + (r.hasLectern ? 45 : 0),
        tier: r.tier,
        price: r.price,
        status: 'reserved',
        reservedForMemberName: r.defaultName,
        reservedForHebrewName: r.defaultHebrewName,
        hasShtender: true
      });
    });

    onAddDignitaries(
      newSeats,
      newElements,
      'Added all default leadership places (Rabbi, Gabbaim, Chazan, President, Rosh Yeshiva)!'
    );
  };

  // Add individual selected dignitary seat
  const handleAddSingleDignitary = () => {
    const r = DEFAULT_ROLES.find(x => x.roleId === selectedRole) || DEFAULT_ROLES[0];
    const now = Date.now();
    const newSeats: Seat[] = [];
    const newElements: LayoutElement[] = [];

    if (includeLectern && r.hasLectern) {
      newElements.push({
        id: `elem-dig-${r.roleId}-${now}`,
        type: r.roleId === 'rabbi' ? 'rabbi_podium' : 'chazan_amud',
        label: r.lecternLabel || `${r.title} Lectern`,
        hebrewLabel: r.lecternHebrew,
        sectionId: activeSectionId,
        x: r.xOffset,
        y: r.yOffset,
        width: 50,
        height: 35,
        color: '#78350f'
      });
    }

    newSeats.push({
      id: `seat-dig-${r.roleId}-${now}`,
      code: customCode.trim() || `${r.codePrefix}-01`,
      sectionId: activeSectionId,
      row: r.rowName,
      number: 1,
      x: r.xOffset + 5,
      y: r.yOffset + (includeLectern && r.hasLectern ? 45 : 0),
      tier: customTier,
      price: customPrice,
      status: 'reserved',
      reservedForMemberName: customName.trim() || r.defaultName,
      reservedForHebrewName: customHebrewName.trim() || r.defaultHebrewName,
      hasShtender: true
    });

    onAddDignitaries(
      newSeats,
      newElements,
      `Added ${customName || r.title} (${customCode}) to layout!`
    );
  };

  return (
    <div className="bg-white border-2 border-amber-600/30 rounded-lg p-4 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs font-bold text-slate-900 uppercase tracking-wider">
          <span className="w-5 h-5 rounded bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
            👑
          </span>
          <h3>{isHeb ? 'מקומות כבוד ורבנים (רב, גבאים, חזן, נשיא)' : 'Default Names & Places (Rabbi, Gabbai, Chazan, President)'}</h3>
        </div>
        
        <button
          type="button"
          onClick={handleAddAllDefaultDignitaries}
          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition shadow-xs flex items-center space-x-1.5 rtl:space-x-reverse cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          <span>{isHeb ? '+ הוסף את כל מקומות הכבוד (בלחיצה אחת)' : '+ Add All Leadership Places (1-Click)'}</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-600">
        {isHeb
          ? 'הוספת מקומות של כבוד להנהגת בית הכנסת (רב, גבאים, שליח ציבור, נשיא) עם שמות ברירת מחדל או שמות מותאמים אישית.'
          : 'Insert designated honorary seats for Synagogue leadership (Rabbi, Gabbaim, Cantor, President) with default titles or custom names.'}
      </p>

      {/* Role Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {DEFAULT_ROLES.map((role) => (
          <button
            key={role.roleId}
            type="button"
            onClick={() => handleRoleSelect(role.roleId)}
            className={`p-2 rounded-lg border text-left rtl:text-right transition cursor-pointer flex flex-col justify-between ${
              selectedRole === role.roleId
                ? 'bg-amber-50 border-amber-600 ring-1 ring-amber-600 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="text-lg mb-1">{role.icon}</div>
            <div className="text-xs font-bold text-slate-900 truncate">
              {isHeb ? role.hebrewTitle.split('/')[0].trim() : role.title.split('(')[0].trim()}
            </div>
            <div className="text-[10px] text-slate-500 font-serif truncate">
              {isHeb ? role.defaultHebrewName : role.hebrewTitle}
            </div>
          </button>
        ))}
      </div>

      {/* Customizer for Selected Dignitary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
        <div>
          <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
            {isHeb ? 'שם מוצג באנגלית' : 'Display Title / Name'}
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Rabbi, Gabbai 1"
            className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold text-slate-900"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
            {isHeb ? 'שם / תואר בעברית' : 'Hebrew Name / Title'}
          </label>
          <input
            type="text"
            dir="rtl"
            value={customHebrewName}
            onChange={(e) => setCustomHebrewName(e.target.value)}
            placeholder="שם בעברית"
            className="w-full bg-white border border-slate-300 rounded p-1.5 font-serif text-slate-900 text-right"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
            {isHeb ? 'קוד ורמת מחיר' : 'Seat Code & Tier'}
          </label>
          <div className="flex space-x-1.5 rtl:space-x-reverse">
            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              className="w-1/2 bg-white border border-slate-300 rounded p-1.5 font-bold text-center text-xs"
            />
            <select
              value={customTier}
              onChange={(e) => setCustomTier(e.target.value as any)}
              className="w-1/2 bg-white border border-slate-300 rounded p-1.5 text-xs font-semibold capitalize"
            >
              <option value="mizrach">{isHeb ? 'מזרח' : 'Mizrach'}</option>
              <option value="vip">{isHeb ? 'VIP' : 'VIP'}</option>
              <option value="premium">{isHeb ? 'פרימיום' : 'Premium'}</option>
              <option value="standard">{isHeb ? 'רגיל' : 'Standard'}</option>
            </select>
          </div>
        </div>

        <div className="flex items-end space-x-2 rtl:space-x-reverse">
          {DEFAULT_ROLES.find(r => r.roleId === selectedRole)?.hasLectern && (
            <label className="flex items-center space-x-1.5 rtl:space-x-reverse text-xs text-slate-700 font-medium cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={includeLectern}
                onChange={(e) => setIncludeLectern(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-amber-600"
              />
              <span>{isHeb ? '+ עמוד / פודיום' : '+ Lectern / Amud'}</span>
            </label>
          )}

          <button
            type="button"
            onClick={handleAddSingleDignitary}
            className="flex-1 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1 rtl:space-x-reverse cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              {isHeb
                ? `הצב ${customHebrewName || 'מקום'}`
                : `Place ${customName || 'Seat'}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
