import React from 'react';
import { Sparkles, Building, BookOpen, Users, Layers, Crown, Trash2, ArrowRight } from 'lucide-react';
import { Seat, LayoutElement, ShulSection, SectionType } from '../../types/shul';
import { useI18n } from '../../utils/i18n';

interface QuickLayoutWizardProps {
  activeSectionId: SectionType;
  sections: ShulSection[];
  onApplyLayout: (newSeats: Seat[], newElements: LayoutElement[], message: string) => void;
}

export const QuickLayoutWizard: React.FC<QuickLayoutWizardProps> = ({
  activeSectionId,
  sections,
  onApplyLayout
}) => {
  const { t, language } = useI18n();

  const handleApplyPreset = (preset: 'standard_sanctuary' | 'beit_midrash_tables' | 'chavrusa_room' | 'shtiebl' | 'blank') => {
    const now = Date.now();
    const currentSec = sections.find(s => s.id === activeSectionId) || sections[0];
    const prefix = currentSec?.name.substring(0, 1).toUpperCase() || 'M';

    const newSeats: Seat[] = [];
    const newElements: LayoutElement[] = [];

    if (preset === 'standard_sanctuary') {
      // 1. Aron Kodesh (Ark) at North
      newElements.push({
        id: `elem-ark-${now}`,
        type: 'aron_kodesh',
        label: 'Aron Kodesh (Holy Ark)',
        hebrewLabel: 'ארון הקודש',
        sectionId: activeSectionId,
        x: 420,
        y: 40,
        width: 220,
        height: 70,
        color: '#d97706'
      });

      // 2. Chazan Amud
      newElements.push({
        id: `elem-amud-${now}`,
        type: 'chazan_amud',
        label: "Chazan's Amud",
        hebrewLabel: 'עמוד החזן',
        sectionId: activeSectionId,
        x: 480,
        y: 130,
        width: 100,
        height: 40,
        color: '#2563eb'
      });

      // 3. Rabbi & Honorary Seats at Mizrach
      newSeats.push({
        id: `seat-rabbi-${now}`,
        code: 'RABBI-1',
        sectionId: activeSectionId,
        row: 'Mizrach',
        number: 1,
        x: 350,
        y: 130,
        tier: 'mizrach',
        price: 500,
        status: 'reserved',
        reservedForMemberName: 'Rabbi (Mora D’Asra)',
        reservedForHebrewName: 'הרב מרא דאתרא',
        hasShtender: true
      });
      newSeats.push({
        id: `seat-pres-${now}`,
        code: 'PRES-1',
        sectionId: activeSectionId,
        row: 'Mizrach',
        number: 2,
        x: 610,
        y: 130,
        tier: 'mizrach',
        price: 450,
        status: 'reserved',
        reservedForMemberName: 'President / Parnas',
        reservedForHebrewName: 'נשיא הקהילה',
        hasShtender: true
      });

      // 4. Central Bimah & Gabbai Seats
      newElements.push({
        id: `elem-bimah-${now}`,
        type: 'bimah',
        label: 'Central Bimah (Shulchan Kria)',
        hebrewLabel: 'בימה מרכזית לקריאת התורה',
        sectionId: activeSectionId,
        x: 410,
        y: 330,
        width: 240,
        height: 120,
        color: '#059669'
      });

      newSeats.push({
        id: `seat-gab1-${now}`,
        code: 'GAB-1',
        sectionId: activeSectionId,
        row: 'Bimah',
        number: 1,
        x: 430,
        y: 300,
        tier: 'vip',
        price: 360,
        status: 'reserved',
        reservedForMemberName: 'Gabbai Rishon',
        reservedForHebrewName: 'גבאי ראשון',
        hasShtender: true
      });
      newSeats.push({
        id: `seat-gab2-${now}`,
        code: 'GAB-2',
        sectionId: activeSectionId,
        row: 'Bimah',
        number: 2,
        x: 590,
        y: 300,
        tier: 'vip',
        price: 360,
        status: 'reserved',
        reservedForMemberName: 'Gabbai Sheni',
        reservedForHebrewName: 'גבאי שני',
        hasShtender: true
      });

      // 5. Left & Right Pew Blocks (Rows א, ב, ג, ד, ה, ו)
      const rowLetters = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
      rowLetters.forEach((rLetter, rIdx) => {
        const y = 200 + rIdx * 80;
        // Left Block (Seats 1-4)
        for (let c = 1; c <= 4; c++) {
          newSeats.push({
            id: `seat-L-${rLetter}-${c}-${now}`,
            code: `${prefix}-${rLetter}-${c < 10 ? '0' + c : c}`,
            sectionId: activeSectionId,
            row: rLetter,
            number: c,
            x: 80 + (c - 1) * 65,
            y,
            tier: rIdx === 0 ? 'premium' : 'standard',
            price: rIdx === 0 ? 250 : 180,
            status: 'available',
            hasShtender: true
          });
        }
        // Right Block (Seats 5-8)
        for (let c = 5; c <= 8; c++) {
          newSeats.push({
            id: `seat-R-${rLetter}-${c}-${now}`,
            code: `${prefix}-${rLetter}-${c < 10 ? '0' + c : c}`,
            sectionId: activeSectionId,
            row: rLetter,
            number: c,
            x: 690 + (c - 5) * 65,
            y,
            tier: rIdx === 0 ? 'premium' : 'standard',
            price: rIdx === 0 ? 250 : 180,
            status: 'available',
            hasShtender: true
          });
        }
      });

      onApplyLayout(newSeats, newElements, 'Generated Standard Sanctuary with Ark, Bimah, and Hebrew Alef-Bet Pew Rows!');
    } else if (preset === 'beit_midrash_tables') {
      // Study Hall / Beit Midrash with 5-seater Daf Yomi tables
      newElements.push({
        id: `elem-ark-${now}`,
        type: 'aron_kodesh',
        label: 'Aron Kodesh',
        hebrewLabel: 'ארון הקודש',
        sectionId: activeSectionId,
        x: 430,
        y: 40,
        width: 180,
        height: 60,
        color: '#d97706'
      });

      newElements.push({
        id: `elem-amud-${now}`,
        type: 'chazan_amud',
        label: "Maggid Shiur / Chazan",
        hebrewLabel: 'מגיד שיעור ועמוד',
        sectionId: activeSectionId,
        x: 465,
        y: 115,
        width: 110,
        height: 35,
        color: '#2563eb'
      });

      // 6 Five-Seater Tables (3 on top + 2 on bottom)
      for (let tIdx = 1; tIdx <= 6; tIdx++) {
        const col = (tIdx - 1) % 2;
        const row = Math.floor((tIdx - 1) / 2);
        const x = col === 0 ? 120 : 540;
        const y = 190 + row * 190;
        const tableId = `tbl-5s-${now}-${tIdx}`;

        newElements.push({
          id: tableId,
          type: 'table',
          label: `Daf Yomi 5-Seater Table #${tIdx}`,
          hebrewLabel: `שולחן דף היומי 5 מקומות #${tIdx}`,
          sectionId: activeSectionId,
          x,
          y,
          width: 220,
          height: 80,
          color: '#b45309'
        });

        // 3 Top Seats
        for (let s = 1; s <= 3; s++) {
          newSeats.push({
            id: `seat-${tableId}-n-${s}`,
            code: `T${tIdx}-N${s}`,
            sectionId: activeSectionId,
            row: `T${tIdx}`,
            number: s,
            x: x + 15 + (s - 1) * 65,
            y: y - 45,
            tier: 'standard',
            price: 150,
            status: 'available',
            hasShtender: true
          });
        }

        // 2 Bottom Seats
        for (let s = 1; s <= 2; s++) {
          newSeats.push({
            id: `seat-${tableId}-s-${s}`,
            code: `T${tIdx}-S${s}`,
            sectionId: activeSectionId,
            row: `T${tIdx}`,
            number: s + 3,
            x: x + 45 + (s - 1) * 65,
            y: y + 90,
            tier: 'standard',
            price: 150,
            status: 'available',
            hasShtender: true
          });
        }
      }

      onApplyLayout(newSeats, newElements, 'Generated Beit Midrash with 5-Seater Daf Yomi Study Tables!');
    } else if (preset === 'chavrusa_room') {
      // Chavrusa Study Hall with 2-seater and 3-seater tables
      for (let tIdx = 1; tIdx <= 8; tIdx++) {
        const col = (tIdx - 1) % 2;
        const row = Math.floor((tIdx - 1) / 2);
        const x = col === 0 ? 140 : 540;
        const y = 100 + row * 180;
        const is3Seater = tIdx % 2 === 0;
        const tableId = `tbl-chav-${now}-${tIdx}`;

        newElements.push({
          id: tableId,
          type: 'table',
          label: `${is3Seater ? '3-Seater' : '2-Seater'} Chavrusa Desk #${tIdx}`,
          hebrewLabel: `שולחן חברותא #${tIdx}`,
          sectionId: activeSectionId,
          x,
          y,
          width: is3Seater ? 180 : 130,
          height: 70,
          color: '#854d0e'
        });

        // Top seat(s)
        const topCount = is3Seater ? 2 : 1;
        for (let s = 1; s <= topCount; s++) {
          newSeats.push({
            id: `seat-${tableId}-n-${s}`,
            code: `CH${tIdx}-A${s}`,
            sectionId: activeSectionId,
            row: `CH${tIdx}`,
            number: s,
            x: x + 15 + (s - 1) * 60,
            y: y - 45,
            tier: 'standard',
            price: 140,
            status: 'available',
            hasShtender: true
          });
        }

        // Bottom seat
        newSeats.push({
          id: `seat-${tableId}-s-1`,
          code: `CH${tIdx}-B1`,
          sectionId: activeSectionId,
          row: `CH${tIdx}`,
          number: topCount + 1,
          x: x + (is3Seater ? 45 : 15),
          y: y + 80,
          tier: 'standard',
          price: 140,
          status: 'available',
          hasShtender: true
        });
      }

      onApplyLayout(newSeats, newElements, 'Generated Chavrusa Hall with 2 & 3-Seater Desks!');
    } else if (preset === 'shtiebl') {
      // Small intimate Shtiebl / Minyan room with perimeter tables and central bimah
      newElements.push({
        id: `elem-ark-${now}`,
        type: 'aron_kodesh',
        label: 'Aron Kodesh',
        hebrewLabel: 'ארון הקודש',
        sectionId: activeSectionId,
        x: 430,
        y: 40,
        width: 160,
        height: 60,
        color: '#d97706'
      });

      newElements.push({
        id: `elem-bimah-${now}`,
        type: 'bimah',
        label: 'Table Bimah',
        hebrewLabel: 'שולחן בימה',
        sectionId: activeSectionId,
        x: 430,
        y: 260,
        width: 160,
        height: 100,
        color: '#059669'
      });

      // 4 perimeter tables
      const tablePositions = [
        { x: 100, y: 150, label: 'Table א' },
        { x: 680, y: 150, label: 'Table ב' },
        { x: 100, y: 400, label: 'Table ג' },
        { x: 680, y: 400, label: 'Table ד' }
      ];

      tablePositions.forEach((tp, idx) => {
        const tableId = `tbl-shtiebl-${now}-${idx + 1}`;
        newElements.push({
          id: tableId,
          type: 'table',
          label: tp.label,
          hebrewLabel: tp.label,
          sectionId: activeSectionId,
          x: tp.x,
          y: tp.y,
          width: 200,
          height: 75,
          color: '#b45309'
        });

        // 4 seats per table
        for (let s = 1; s <= 2; s++) {
          newSeats.push({
            id: `seat-${tableId}-n-${s}`,
            code: `S${idx + 1}-A${s}`,
            sectionId: activeSectionId,
            row: `T${idx + 1}`,
            number: s,
            x: tp.x + 20 + (s - 1) * 65,
            y: tp.y - 45,
            tier: 'standard',
            price: 150,
            status: 'available',
            hasShtender: true
          });
          newSeats.push({
            id: `seat-${tableId}-s-${s}`,
            code: `S${idx + 1}-B${s}`,
            sectionId: activeSectionId,
            row: `T${idx + 1}`,
            number: s + 2,
            x: tp.x + 20 + (s - 1) * 65,
            y: tp.y + 85,
            tier: 'standard',
            price: 150,
            status: 'available',
            hasShtender: true
          });
        }
      });

      onApplyLayout(newSeats, newElements, 'Generated Small Shtiebl / Minyan Room Layout!');
    } else if (preset === 'blank') {
      onApplyLayout([], [], 'Cleared section to a blank canvas for custom design.');
    }
  };

  const isHeb = language === 'he' || language === 'yi';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              {isHeb ? 'תוכניות פריסה מהירות בקליק אחד' : '1-Click Sanctuary Blueprints (Instant Setup)'}
            </h3>
            <p className="text-xs text-slate-500">
              {isHeb
                ? 'בחר תבנית מוכנה ליצירת מפת בית הכנסת המלאה בשנייה אחת.'
                : 'Pick a layout template to generate your entire sanctuary seating chart in 1 second.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Preset 1: Standard Sanctuary */}
        <button
          type="button"
          onClick={() => handleApplyPreset('standard_sanctuary')}
          className="p-3.5 rounded-xl border-2 border-blue-200 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 text-left rtl:text-right transition space-y-2 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              <Building className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              {isHeb ? 'פופולרי' : 'Popular'}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
              {isHeb ? 'בית כנסת מרכזי סטנדרטי' : 'Standard Sanctuary'}
            </h4>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              {isHeb
                ? 'ארון קודש, בימה מרכזית, מקומות רב וגבאים, ושורות ספסלים באותיות א-ב.'
                : 'Ark, Central Bimah, Rabbi/Gabbai seats, and Hebrew Alef-Bet Pew Rows.'}
            </p>
          </div>
          <div className="text-[10px] text-blue-700 font-bold flex items-center gap-1 pt-1 rtl:flex-row-reverse">
            <span>{isHeb ? 'החל פריסה זו' : 'Apply Layout'}</span>
            <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          </div>
        </button>

        {/* Preset 2: Beit Midrash Tables */}
        <button
          type="button"
          onClick={() => handleApplyPreset('beit_midrash_tables')}
          className="p-3.5 rounded-xl border-2 border-amber-200 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50 text-left rtl:text-right transition space-y-2 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-lg bg-amber-700 text-white flex items-center justify-center text-xs font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
              {isHeb ? 'שולחנות 5 מקומות' : '5-Seater Tables'}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 group-hover:text-amber-800">
              {isHeb ? 'בית מדרש / שולחנות לימוד' : 'Beit Midrash / Study Hall'}
            </h4>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              {isHeb
                ? 'שולחנות לימוד דף היומי של 5 מקומות עם סטנדרים ועמוד למגיד שיעור.'
                : 'Daf Yomi 5-seater study tables with shtenders and Maggid Shiur Amud.'}
            </p>
          </div>
          <div className="text-[10px] text-amber-800 font-bold flex items-center gap-1 pt-1 rtl:flex-row-reverse">
            <span>{isHeb ? 'החל פריסה זו' : 'Apply Layout'}</span>
            <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          </div>
        </button>

        {/* Preset 3: Chavrusa Room */}
        <button
          type="button"
          onClick={() => handleApplyPreset('chavrusa_room')}
          className="p-3.5 rounded-xl border-2 border-emerald-200 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 text-left rtl:text-right transition space-y-2 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {isHeb ? '2 ו-3 מקומות' : '2 & 3-Seater'}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">
              {isHeb ? 'חדר חברותות / שולחנות זוגיים' : 'Chavrusa Study Desks'}
            </h4>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              {isHeb
                ? 'שולחנות לימוד זוגיים עבור 2 או 3 לומדים עם סטנדרים.'
                : 'Chavrusa partner study desks for 2 or 3 people with shtenders.'}
            </p>
          </div>
          <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 pt-1 rtl:flex-row-reverse">
            <span>{isHeb ? 'החל פריסה זו' : 'Apply Layout'}</span>
            <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          </div>
        </button>

        {/* Preset 4: Small Shtiebl / Minyan Room */}
        <button
          type="button"
          onClick={() => handleApplyPreset('shtiebl')}
          className="p-3.5 rounded-xl border-2 border-purple-200 hover:border-purple-500 bg-purple-50/40 hover:bg-purple-50 text-left rtl:text-right transition space-y-2 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
              {isHeb ? 'חם ומשפחתי' : 'Intimate'}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 group-hover:text-purple-700">
              {isHeb ? 'שטיבל קטן / מניין צעירים' : 'Small Shtiebl / Minyan'}
            </h4>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              {isHeb
                ? 'שולחנות סביבתיים עם שולחן בימה מרכזי לאווירת מניין חמה ומגובשת.'
                : 'Perimeter tables with central table-bimah for warm communal minyanim.'}
            </p>
          </div>
          <div className="text-[10px] text-purple-700 font-bold flex items-center gap-1 pt-1 rtl:flex-row-reverse">
            <span>{isHeb ? 'החל פריסה זו' : 'Apply Layout'}</span>
            <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          </div>
        </button>
      </div>
    </div>
  );
};
