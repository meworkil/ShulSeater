import React, { useState, useMemo } from 'react';
import { Seat, LayoutElement, SectionType, SeatTier } from '../../types/shul';
import { Plus, BookOpen, Layers, Check, Sparkles, Sliders, Eye } from 'lucide-react';
import { useI18n } from '../../utils/i18n';

interface CustomTableGeneratorProps {
  activeSectionId: SectionType;
  existingSeats: Seat[];
  existingElements: LayoutElement[];
  onAddLayoutItems: (newSeats: Seat[], newElements: LayoutElement[], message: string) => void;
}

export type TableType = 'double_sided' | 'single_sided' | 'head_dais' | 'shtenders_row';

export const CustomTableGenerator: React.FC<CustomTableGeneratorProps> = ({
  activeSectionId,
  existingSeats,
  existingElements,
  onAddLayoutItems
}) => {
  const { t, language } = useI18n();
  const isHeb = language === 'he' || language === 'yi';

  // Table Configuration State
  const [tableType, setTableType] = useState<TableType>('double_sided');
  
  // For double-sided tables (e.g. 3 on top + 2 on bottom = 5-seater table)
  const [topSeatsCount, setTopSeatsCount] = useState<number>(3);
  const [bottomSeatsCount, setBottomSeatsCount] = useState<number>(2);
  
  // For single-sided tables (e.g. 5-seater, 2-seater, 3-seater)
  const [singleSeatsCount, setSingleSeatsCount] = useState<number>(5);
  const [singleOrientation, setSingleOrientation] = useState<'north' | 'south'>('north');

  // For shtenders row
  const [shtenderCount, setShtenderCount] = useState<number>(5);

  // Common Table Options
  const [tableCount, setTableCount] = useState<number>(2);
  const [tablePrefix, setTablePrefix] = useState<string>('T');
  const [tableArrangement, setTableArrangement] = useState<'grid_2col' | 'single_col' | 'horizontal_row'>('grid_2col');
  const [tableWoodColor, setTableWoodColor] = useState<string>('#b45309'); // Warm Amber / Walnut
  const [defaultPrice, setDefaultPrice] = useState<number>(150);
  const [defaultTier, setDefaultTier] = useState<SeatTier>('standard');
  const [hasShtenders, setHasShtenders] = useState<boolean>(true);
  const [seatSpacing, setSeatSpacing] = useState<number>(55);

  // Calculate total seats per table
  const totalSeatsPerTable = useMemo(() => {
    if (tableType === 'double_sided') return topSeatsCount + bottomSeatsCount;
    if (tableType === 'single_sided') return singleSeatsCount;
    if (tableType === 'head_dais') return singleSeatsCount;
    if (tableType === 'shtenders_row') return shtenderCount;
    return 4;
  }, [tableType, topSeatsCount, bottomSeatsCount, singleSeatsCount, shtenderCount]);

  // Quick preset buttons for common table sizes (e.g. 5-seater, 2-seater, 3-seater, 6-seater, 8-seater)
  const applyQuickPreset = (preset: '5_seater' | '2_seater' | '3_seater' | '4_seater' | '6_seater' | '8_seater' | '10_seater') => {
    if (preset === '5_seater') {
      setTableType('double_sided');
      setTopSeatsCount(3);
      setBottomSeatsCount(2);
      setTablePrefix('T5');
    } else if (preset === '2_seater') {
      setTableType('double_sided');
      setTopSeatsCount(1);
      setBottomSeatsCount(1);
      setTablePrefix('T2');
    } else if (preset === '3_seater') {
      setTableType('single_sided');
      setSingleSeatsCount(3);
      setTablePrefix('T3');
    } else if (preset === '4_seater') {
      setTableType('double_sided');
      setTopSeatsCount(2);
      setBottomSeatsCount(2);
      setTablePrefix('T4');
    } else if (preset === '6_seater') {
      setTableType('double_sided');
      setTopSeatsCount(3);
      setBottomSeatsCount(3);
      setTablePrefix('T6');
    } else if (preset === '8_seater') {
      setTableType('double_sided');
      setTopSeatsCount(4);
      setBottomSeatsCount(4);
      setTablePrefix('T8');
    } else if (preset === '10_seater') {
      setTableType('double_sided');
      setTopSeatsCount(5);
      setBottomSeatsCount(5);
      setTablePrefix('T10');
    }
  };

  // Generate and place tables
  const handleGenerateCustomTables = () => {
    const secSeats = existingSeats.filter(s => s.sectionId === activeSectionId);
    const secElements = existingElements.filter(e => e.sectionId === activeSectionId);

    // Calculate start coordinates
    let startY = 160;
    if (secSeats.length > 0 || secElements.length > 0) {
      const maxYSeats = secSeats.length > 0 ? Math.max(...secSeats.map(s => s.y)) : 0;
      const maxYElements = secElements.length > 0 ? Math.max(...secElements.map(e => e.y + e.height)) : 0;
      startY = Math.max(maxYSeats, maxYElements) + 90;
    }

    const newSeats: Seat[] = [];
    const newElements: LayoutElement[] = [];
    const now = Date.now();

    // Generation for Shtenders Row
    if (tableType === 'shtenders_row') {
      const startX = 120;
      const spacingX = 85;

      for (let s = 1; s <= shtenderCount; s++) {
        const x = startX + (s - 1) * spacingX;
        const elemId = `elem-sht-${now}-${s}`;
        const seatId = `seat-sht-${now}-${s}`;
        const code = `${tablePrefix || 'SHT'}-${s < 10 ? '0' + s : s}`;

        newElements.push({
          id: elemId,
          type: 'shtender',
          label: `Personal Shtender #${s}`,
          hebrewLabel: `שטענדער #${s}`,
          sectionId: activeSectionId,
          x: x + 2,
          y: startY - 20,
          width: 44,
          height: 24,
          color: '#78350f'
        });

        newSeats.push({
          id: seatId,
          code,
          sectionId: activeSectionId,
          row: 'Shtenders',
          number: s,
          x: x + 4,
          y: startY + 12,
          tier: defaultTier,
          price: defaultPrice,
          status: 'available',
          hasShtender: true
        });
      }

      onAddLayoutItems(newSeats, newElements, `Added row of ${shtenderCount} dedicated Shtenders!`);
      return;
    }

    // Generation for Tables (Double-Sided, Single-Sided, Head Dais)
    for (let tIdx = 1; tIdx <= tableCount; tIdx++) {
      let tableX = 160;
      let tableY = startY;
      
      const maxSeatsInRow = tableType === 'double_sided' 
        ? Math.max(topSeatsCount, bottomSeatsCount)
        : singleSeatsCount;
        
      const tableWidth = Math.max(120, maxSeatsInRow * seatSpacing + 30);
      const tableHeight = tableType === 'double_sided' ? 80 : 50;

      // Positioning based on arrangement
      if (tableArrangement === 'grid_2col') {
        const isLeftCol = tIdx % 2 === 1;
        const rowIndex = Math.floor((tIdx - 1) / 2);
        tableX = isLeftCol ? 120 : 560;
        tableY = startY + rowIndex * (tableHeight + 140);
      } else if (tableArrangement === 'single_col') {
        tableX = 320;
        tableY = startY + (tIdx - 1) * (tableHeight + 140);
      } else if (tableArrangement === 'horizontal_row') {
        tableX = 80 + (tIdx - 1) * (tableWidth + 60);
        tableY = startY;
      }

      const tableId = `tbl-${now}-${tIdx}`;
      const prefix = `${tablePrefix || 'T'}${tableCount > 1 ? tIdx : ''}`;

      newElements.push({
        id: tableId,
        type: 'table',
        label: `${tableType === 'head_dais' ? 'Head Dais Table' : 'Study Table'} ${prefix}`,
        hebrewLabel: `שולחן לימוד ${prefix}`,
        sectionId: activeSectionId,
        x: tableX,
        y: tableY,
        width: tableWidth,
        height: tableHeight,
        color: tableWoodColor
      });

      if (tableType === 'double_sided') {
        // Top / North Seats
        const topStartX = tableX + (tableWidth - topSeatsCount * seatSpacing) / 2 + 5;
        for (let s = 1; s <= topSeatsCount; s++) {
          newSeats.push({
            id: `seat-${tableId}-n-${s}`,
            code: `${prefix}-N${s}`,
            sectionId: activeSectionId,
            row: `${prefix}-N`,
            number: s,
            x: topStartX + (s - 1) * seatSpacing,
            y: tableY - 45,
            tier: defaultTier,
            price: defaultPrice,
            status: 'available',
            hasShtender: hasShtenders
          });
        }

        // Bottom / South Seats
        const botStartX = tableX + (tableWidth - bottomSeatsCount * seatSpacing) / 2 + 5;
        for (let s = 1; s <= bottomSeatsCount; s++) {
          newSeats.push({
            id: `seat-${tableId}-s-${s}`,
            code: `${prefix}-S${s}`,
            sectionId: activeSectionId,
            row: `${prefix}-S`,
            number: s + topSeatsCount,
            x: botStartX + (s - 1) * seatSpacing,
            y: tableY + tableHeight + 10,
            tier: defaultTier,
            price: defaultPrice,
            status: 'available',
            hasShtender: hasShtenders
          });
        }
      } else {
        // Single-Sided or Head Dais Table
        const sStartX = tableX + (tableWidth - singleSeatsCount * seatSpacing) / 2 + 5;
        const seatY = singleOrientation === 'north' ? tableY - 45 : tableY + tableHeight + 10;

        for (let s = 1; s <= singleSeatsCount; s++) {
          newSeats.push({
            id: `seat-${tableId}-${s}`,
            code: `${prefix}-${s < 10 ? '0' + s : s}`,
            sectionId: activeSectionId,
            row: prefix,
            number: s,
            x: sStartX + (s - 1) * seatSpacing,
            y: seatY,
            tier: tableType === 'head_dais' ? 'vip' : defaultTier,
            price: tableType === 'head_dais' ? 360 : defaultPrice,
            status: 'available',
            hasShtender: hasShtenders
          });
        }
      }
    }

    const summaryMsg = `Added ${tableCount} custom ${totalSeatsPerTable}-seater table(s) with ${tableCount * totalSeatsPerTable} total seats!`;
    onAddLayoutItems(newSeats, newElements, summaryMsg);
  };

  return (
    <div className="bg-white border-2 border-emerald-600/30 rounded-lg p-4 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs font-bold text-slate-900 uppercase tracking-wider">
          <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
            ✦
          </span>
          <h3>{isHeb ? 'מחולל שולחנות וסטנדרים מותאם אישית' : 'Customizable Table & Shtender Builder'}</h3>
        </div>
        <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded font-mono">
          {isHeb ? 'שולחנות 2, 3, 5 או N מקומות' : '2, 3, 5, or N-Seater Tables'}
        </span>
      </div>

      <p className="text-[11px] text-slate-600">
        {isHeb
          ? 'תכנון שולחנות לימוד רב-מושביים (לדוגמה שולחן 5 מקומות, שולחנות חברותא של 2 או 3) וסטנדרים אישיים עם פריסה מדויקת.'
          : 'Design custom multi-seater study tables (e.g. 5-seater tables, 2 or 3-seater chavrusa desks) and personal shtenders with exact seat allocations.'}
      </p>

      {/* Quick Presets Selection Bar */}
      <div>
        <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1.5">
          {isHeb ? 'בחירה מהירה לפי גודל שולחן:' : 'Quick Table Size Presets:'}
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => applyQuickPreset('5_seater')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
              totalSeatsPerTable === 5 && tableType === 'double_sided'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isHeb ? '★ שולחן 5 מקומות (3+2)' : '★ 5-Seater Table (3+2)'}
          </button>
          <button
            type="button"
            onClick={() => applyQuickPreset('2_seater')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
              totalSeatsPerTable === 2
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isHeb ? 'שולחן חברותא זוגי (1+1)' : '2-Seater Chavrusa (1+1)'}
          </button>
          <button
            type="button"
            onClick={() => applyQuickPreset('3_seater')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
              totalSeatsPerTable === 3 && tableType === 'single_sided'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isHeb ? 'ספסל/שולחן 3 מקומות' : '3-Seater Bench'}
          </button>
          <button
            type="button"
            onClick={() => applyQuickPreset('4_seater')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
              totalSeatsPerTable === 4 && tableType === 'double_sided'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isHeb ? 'שולחן 4 מקומות (2+2)' : '4-Seater Table (2+2)'}
          </button>
          <button
            type="button"
            onClick={() => applyQuickPreset('6_seater')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
              totalSeatsPerTable === 6
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isHeb ? 'שולחן 6 מקומות (3+3)' : '6-Seater Table (3+3)'}
          </button>
          <button
            type="button"
            onClick={() => applyQuickPreset('8_seater')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
              totalSeatsPerTable === 8
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isHeb ? 'שולחן 8 מקומות (4+4)' : '8-Seater Table (4+4)'}
          </button>
          <button
            type="button"
            onClick={() => applyQuickPreset('10_seater')}
            className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
              totalSeatsPerTable === 10
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isHeb ? 'שולחן 10 מקומות (5+5)' : '10-Seater Table (5+5)'}
          </button>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
        {/* Col 1: Table Layout Type */}
        <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <label className="block text-slate-700 font-bold text-[10px] uppercase">
            {isHeb ? '1. מבנה וסוג השולחן' : '1. Layout Archetype'}
          </label>
          
          <div className="space-y-1.5">
            <label className="flex items-center space-x-2 rtl:space-x-reverse p-2 rounded bg-white border border-slate-200 cursor-pointer hover:border-emerald-400">
              <input
                type="radio"
                name="tableType"
                value="double_sided"
                checked={tableType === 'double_sided'}
                onChange={() => setTableType('double_sided')}
                className="text-emerald-600"
              />
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  {isHeb ? 'שולחן לימוד דו-צדדי' : 'Double-Sided Study Table'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {isHeb ? 'כסאות משני עברי השולחן (למשל 5, 6, 8 מקומות)' : 'Chairs on both North & South sides (e.g. 5, 6, 8-seater)'}
                </span>
              </div>
            </label>

            <label className="flex items-center space-x-2 rtl:space-x-reverse p-2 rounded bg-white border border-slate-200 cursor-pointer hover:border-emerald-400">
              <input
                type="radio"
                name="tableType"
                value="single_sided"
                checked={tableType === 'single_sided'}
                onChange={() => setTableType('single_sided')}
                className="text-emerald-600"
              />
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  {isHeb ? 'שולחן / ספסל חד-צדדי' : 'Single-Sided Long Desk / Bench'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {isHeb ? 'כסאות הפונים כולם לאותו כיוון (למשל 2, 3, 5 מקומות)' : 'Chairs all facing one direction (e.g. 2, 3, 5-seater)'}
                </span>
              </div>
            </label>

            <label className="flex items-center space-x-2 rtl:space-x-reverse p-2 rounded bg-white border border-slate-200 cursor-pointer hover:border-emerald-400">
              <input
                type="radio"
                name="tableType"
                value="head_dais"
                checked={tableType === 'head_dais'}
                onChange={() => setTableType('head_dais')}
                className="text-emerald-600"
              />
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  {isHeb ? 'שולחן כותל המזרח / ראשי' : 'Head / Mizrach Dais Table'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {isHeb ? 'שולחן רבנים וראשי ישיבה הפונה לקהל' : 'Rabbi & Roshei Yeshiva front-facing table'}
                </span>
              </div>
            </label>

            <label className="flex items-center space-x-2 rtl:space-x-reverse p-2 rounded bg-white border border-slate-200 cursor-pointer hover:border-emerald-400">
              <input
                type="radio"
                name="tableType"
                value="shtenders_row"
                checked={tableType === 'shtenders_row'}
                onChange={() => setTableType('shtenders_row')}
                className="text-emerald-600"
              />
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  {isHeb ? 'שורת סטנדרים אישיים' : 'Row of Dedicated Shtenders'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {isHeb ? 'עמודי לימוד וסטנדרים מעץ' : 'Individual standing wooden lecterns'}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Col 2: Seats Count & Arrangement Settings */}
        <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <label className="block text-slate-700 font-bold text-[10px] uppercase">
            {isHeb ? '2. חלוקת מקומות וכמויות' : '2. Seat Allocation & Dimensions'}
          </label>

          {tableType === 'double_sided' && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                  {isHeb ? 'כסאות צד עליון' : 'Top / North Seats'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={topSeatsCount}
                  onChange={(e) => setTopSeatsCount(Math.max(1, Math.min(8, Number(e.target.value))))}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-center font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                  {isHeb ? 'כסאות צד תחתון' : 'Bottom / South Seats'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={bottomSeatsCount}
                  onChange={(e) => setBottomSeatsCount(Math.max(1, Math.min(8, Number(e.target.value))))}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-center font-bold text-slate-900"
                />
              </div>
              <div className="col-span-2 text-[10px] text-emerald-800 bg-emerald-100/70 p-1.5 rounded font-semibold text-center">
                {isHeb
                  ? `סך הכל: שולחן ${topSeatsCount + bottomSeatsCount} מקומות (${topSeatsCount} עליון + ${bottomSeatsCount} תחתון)`
                  : `Total: ${topSeatsCount + bottomSeatsCount} Seater Table (${topSeatsCount} North + ${bottomSeatsCount} South)`}
              </div>
            </div>
          )}

          {(tableType === 'single_sided' || tableType === 'head_dais') && (
            <div className="space-y-2">
              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                  {isHeb ? 'מספר כסאות לאורך השולחן' : 'Seats Along Table'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={singleSeatsCount}
                  onChange={(e) => setSingleSeatsCount(Math.max(1, Math.min(12, Number(e.target.value))))}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-center font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                  {isHeb ? 'כיוון פני המתפלל' : 'Seat Orientation'}
                </label>
                <select
                  value={singleOrientation}
                  onChange={(e) => setSingleOrientation(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 font-medium"
                >
                  <option value="north">{isHeb ? 'פנים למזרח / קדימה' : 'Facing Mizrach (Up)'}</option>
                  <option value="south">{isHeb ? 'פנים לאחור / דרום' : 'Facing Rear (Down)'}</option>
                </select>
              </div>
            </div>
          )}

          {tableType === 'shtenders_row' && (
            <div>
              <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                {isHeb ? 'מספר סטנדרים בשורה' : 'Number of Shtenders in Row'}
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={shtenderCount}
                onChange={(e) => setShtenderCount(Math.max(1, Math.min(12, Number(e.target.value))))}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-center font-bold text-slate-900"
              />
            </div>
          )}

          {tableType !== 'shtenders_row' && (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                  {isHeb ? 'כמות שולחנות' : 'Number of Tables'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={tableCount}
                  onChange={(e) => setTableCount(Math.max(1, Math.min(10, Number(e.target.value))))}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-center font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                  {isHeb ? 'סידור באולם' : 'Arrangement'}
                </label>
                <select
                  value={tableArrangement}
                  onChange={(e) => setTableArrangement(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 font-medium text-[11px]"
                >
                  <option value="grid_2col">{isHeb ? '2 טורים (שביל מרכזי)' : '2 Columns (Aisle)'}</option>
                  <option value="single_col">{isHeb ? 'טור יחיד' : 'Single Stack'}</option>
                  <option value="horizontal_row">{isHeb ? 'שורה אופקית' : 'Horizontal Row'}</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
              {isHeb ? 'קידומת קוד השולחן' : 'Table / Seat Code Prefix'}
            </label>
            <input
              type="text"
              value={tablePrefix}
              onChange={(e) => setTablePrefix(e.target.value.toUpperCase())}
              placeholder={isHeb ? 'לדוג׳ T, שולחן, T5' : 'e.g. T, DY, T5'}
              className="w-full bg-white border border-slate-300 rounded p-1.5 font-bold text-slate-900"
            />
          </div>
        </div>

        {/* Col 3: Live Visual Preview & Tier Pricing */}
        <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-700 font-bold text-[10px] uppercase">
                {isHeb ? '3. תצוגה מקדימה חיה' : '3. Live Layout Preview'}
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {isHeb ? `${totalSeatsPerTable} מקומות לשולחן` : `${totalSeatsPerTable} Seats per table`}
              </span>
            </div>

            {/* Visual Preview Box */}
            <div className="bg-white border border-slate-300 rounded-md p-3 flex flex-col items-center justify-center min-h-[110px] relative overflow-hidden shadow-inner">
              {tableType === 'shtenders_row' ? (
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  {Array.from({ length: Math.min(6, shtenderCount) }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-5 h-3 bg-amber-800 rounded-xs mb-1 border border-amber-950" />
                      <div className="w-6 h-6 bg-slate-100 border border-slate-300 rounded text-[7px] font-bold flex items-center justify-center text-slate-700">
                        {i + 1}
                      </div>
                    </div>
                  ))}
                  {shtenderCount > 6 && <span className="text-[9px] text-slate-400 font-bold">+{shtenderCount - 6}</span>}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* Top Seats */}
                  {tableType === 'double_sided' && (
                    <div className="flex items-center space-x-1.5 rtl:space-x-reverse mb-1">
                      {Array.from({ length: topSeatsCount }).map((_, i) => (
                        <div
                          key={`top-${i}`}
                          className="w-5 h-5 bg-blue-50 border border-blue-400 rounded text-[8px] font-bold flex items-center justify-center text-blue-700"
                        >
                          N{i + 1}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Single Sided North Seats */}
                  {tableType !== 'double_sided' && singleOrientation === 'north' && (
                    <div className="flex items-center space-x-1.5 rtl:space-x-reverse mb-1">
                      {Array.from({ length: Math.min(6, singleSeatsCount) }).map((_, i) => (
                        <div
                          key={`sn-${i}`}
                          className="w-5 h-5 bg-blue-50 border border-blue-400 rounded text-[8px] font-bold flex items-center justify-center text-blue-700"
                        >
                          {i + 1}
                        </div>
                      ))}
                      {singleSeatsCount > 6 && <span className="text-[8px] text-slate-400">+{singleSeatsCount - 6}</span>}
                    </div>
                  )}

                  {/* Table Rectangle */}
                  <div
                    className="h-7 rounded bg-amber-700 border border-amber-900 text-white font-bold text-[9px] flex items-center justify-center shadow-xs px-2"
                    style={{
                      width: `${Math.min(220, Math.max(90, (tableType === 'double_sided' ? Math.max(topSeatsCount, bottomSeatsCount) : singleSeatsCount) * 24 + 20))}px`
                    }}
                  >
                    {tablePrefix || (isHeb ? 'שולחן' : 'TABLE')}
                  </div>

                  {/* Bottom Seats */}
                  {tableType === 'double_sided' && (
                    <div className="flex items-center space-x-1.5 rtl:space-x-reverse mt-1">
                      {Array.from({ length: bottomSeatsCount }).map((_, i) => (
                        <div
                          key={`bot-${i}`}
                          className="w-5 h-5 bg-emerald-50 border border-emerald-400 rounded text-[8px] font-bold flex items-center justify-center text-emerald-700"
                        >
                          S{i + 1}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Single Sided South Seats */}
                  {tableType !== 'double_sided' && singleOrientation === 'south' && (
                    <div className="flex items-center space-x-1.5 rtl:space-x-reverse mt-1">
                      {Array.from({ length: Math.min(6, singleSeatsCount) }).map((_, i) => (
                        <div
                          key={`ss-${i}`}
                          className="w-5 h-5 bg-emerald-50 border border-emerald-400 rounded text-[8px] font-bold flex items-center justify-center text-emerald-700"
                        >
                          {i + 1}
                        </div>
                      ))}
                      {singleSeatsCount > 6 && <span className="text-[8px] text-slate-400">+{singleSeatsCount - 6}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pricing & Shtender Toggle */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="block text-slate-700 font-bold text-[9px] uppercase mb-0.5">
                  {isHeb ? 'מחיר מושב ($)' : 'Price ($)'}
                </label>
                <input
                  type="number"
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded p-1 text-center font-bold text-xs"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center space-x-1.5 rtl:space-x-reverse text-[11px] text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasShtenders}
                    onChange={(e) => setHasShtenders(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-600"
                  />
                  <span>{isHeb ? '+ סטנדרים' : '+ Shtenders'}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Add Button */}
          <button
            type="button"
            onClick={handleGenerateCustomTables}
            className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1.5 rtl:space-x-reverse cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-200" />
            <span>
              {tableType === 'shtenders_row'
                ? (isHeb ? `הוסף ${shtenderCount} סטנדרים` : `Add ${shtenderCount} Shtenders`)
                : (isHeb ? `צור ${tableCount} שולחנות (${tableCount * totalSeatsPerTable} מקומות)` : `Generate ${tableCount} Table(s) (${tableCount * totalSeatsPerTable} Seats)`)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
