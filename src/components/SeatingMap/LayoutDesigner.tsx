import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  RotateCw, 
  Save, 
  Grid, 
  Layers, 
  Sparkles, 
  Sliders, 
  Check, 
  BookOpen, 
  Crown,
  HelpCircle,
  AlertTriangle,
  Building,
  Maximize2,
  Hash,
  Edit,
  Edit2,
  Type,
  Users,
  Table as TableIcon
} from 'lucide-react';
import { Seat, LayoutElement, SectionType, ShulSection, SeatTier } from '../../types/shul';
import { useI18n } from '../../utils/i18n';
import { HEBREW_ROW_LETTERS, numberToHebrewRowLetter } from '../../utils/hebrewCalendar';
import { AddSectionModal } from './AddSectionModal';
import { CustomTableGenerator } from './CustomTableGenerator';
import { DignitariesManager } from './DignitariesManager';
import { ManualSeatAdder } from './ManualSeatAdder';
import { QuickLayoutWizard } from './QuickLayoutWizard';
import { SimpleLiveCanvas } from './SimpleLiveCanvas';

interface LayoutDesignerProps {
  seats: Seat[];
  elements: LayoutElement[];
  currentSectionId?: SectionType;
  sections: ShulSection[];
  onUpdateLayout?: (seats: Seat[], elements: LayoutElement[]) => void;
  onUpdateSeats?: (seats: Seat[]) => void;
  onUpdateElements?: (elements: LayoutElement[]) => void;
  onUpdateSections?: (sections: ShulSection[]) => void;
  onResetToDefault?: () => void;
  onOpenSetupModal?: () => void;
}

type StudioTab = 'quick_presets' | 'tables' | 'pews' | 'landmarks' | 'dignitaries' | 'manual_seat' | 'renumber_price';

export const LayoutDesigner: React.FC<LayoutDesignerProps> = ({
  seats,
  elements,
  currentSectionId = 'mens_main',
  sections,
  onUpdateLayout,
  onUpdateSeats,
  onUpdateElements,
  onUpdateSections,
  onResetToDefault,
  onOpenSetupModal
}) => {
  const { t, language, dir } = useI18n();

  const [activeSectionId, setActiveSectionId] = useState<SectionType>(currentSectionId);
  const [activeTab, setActiveTab] = useState<StudioTab>('quick_presets');
  const [notification, setNotification] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Section Management Modal States
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ShulSection | null>(null);

  // Row Generator States
  const [rowNumberingScheme, setRowNumberingScheme] = useState<'english' | 'hebrew' | 'numeric'>('hebrew');
  const [pewSeatsCount, setPewSeatsCount] = useState(8);
  const [pewRowLetter, setPewRowLetter] = useState('א');
  const [defaultSeatPrice, setDefaultSeatPrice] = useState(180);
  const [defaultTier, setDefaultTier] = useState<SeatTier>('standard');
  const [hasShtendersDefault, setHasShtendersDefault] = useState(true);

  // Multi-row Block Generator
  const [blockStartRow, setBlockStartRow] = useState('א');
  const [blockRowCount, setBlockRowCount] = useState(5);
  const [blockSeatsPerRow, setBlockSeatsPerRow] = useState(10);
  const [blockRowSpacing, setBlockRowSpacing] = useState(75);

  // Bulk Renumbering States
  const [targetRowForRename, setTargetRowForRename] = useState<string>('all');
  const [renamePrefix, setRenamePrefix] = useState<string>('');
  const [renameNewRow, setRenameNewRow] = useState<string>('');
  const [renameStartNumber, setRenameStartNumber] = useState<number>(1);
  const [renameDirection, setRenameDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [continuousMode, setContinuousMode] = useState(false);
  const [bulkRowReordering, setBulkRowReordering] = useState<'keep' | 'hebrew' | 'english' | 'numeric'>('hebrew');

  const currentSection = sections.find(s => s.id === activeSectionId) || sections[0] || {
    id: 'mens_main',
    name: "Men's Main Sanctuary",
    hebrewName: 'בית הכנסת הגדול',
    capacity: 120,
    floor: 'Ground Floor',
    color: '#2563eb'
  };

  const sectionSeats = seats.filter(s => s.sectionId === activeSectionId);
  const sectionElements = elements.filter(e => e.sectionId === activeSectionId);
  const existingRows = Array.from(new Set(sectionSeats.map(s => s.row))).sort();

  const updateState = (newSeats: Seat[], newElements: LayoutElement[]) => {
    if (onUpdateLayout) {
      onUpdateLayout(newSeats, newElements);
    } else {
      if (onUpdateSeats) onUpdateSeats(newSeats);
      if (onUpdateElements) onUpdateElements(newElements);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Section Save (Create / Update)
  const handleSaveSection = (savedSection: ShulSection) => {
    let updatedSections: ShulSection[];
    const exists = sections.some(s => s.id === savedSection.id);

    if (exists) {
      updatedSections = sections.map(s => s.id === savedSection.id ? savedSection : s);
      showToast(`Updated section "${savedSection.name}"!`);
    } else {
      updatedSections = [...sections, savedSection];
      setActiveSectionId(savedSection.id);
      showToast(`Created section "${savedSection.name}"!`);
    }

    if (onUpdateSections) {
      onUpdateSections(updatedSections);
    }
    setIsAddSectionOpen(false);
    setEditingSection(null);
  };

  const handleDeleteSection = (sectionId: SectionType) => {
    if (sections.length <= 1) {
      alert("Cannot delete the only remaining section in the synagogue.");
      return;
    }
    const updatedSections = sections.filter(s => s.id !== sectionId);
    if (onUpdateSections) onUpdateSections(updatedSections);

    const remainingSeats = seats.filter(s => s.sectionId !== sectionId);
    const remainingElements = elements.filter(e => e.sectionId !== sectionId);
    updateState(remainingSeats, remainingElements);

    setActiveSectionId(updatedSections[0].id);
    setIsAddSectionOpen(false);
    setEditingSection(null);
    showToast(`Deleted section!`);
  };

  const handleClearSection = () => {
    const remainingSeats = seats.filter(s => s.sectionId !== activeSectionId);
    const remainingElements = elements.filter(e => e.sectionId !== activeSectionId);
    updateState(remainingSeats, remainingElements);
    showToast(`Cleared all seats and elements in ${currentSection.name}!`);
  };

  // 1-Click Quick Add Table
  const handleQuickAddTable = (preset: '5_seater' | '2_seater' | '3_seater' | '6_seater' | '8_seater') => {
    const now = Date.now();
    const secSeats = sectionSeats;
    const nextNum = sectionElements.filter(e => e.type === 'table').length + 1;
    const tableId = `tbl-q-${now}`;

    let yPos = 160 + (nextNum - 1) * 160;
    if (yPos > 700) yPos = 160;
    const xPos = nextNum % 2 === 1 ? 160 : 540;

    let topCount = 3;
    let botCount = 2;
    let width = 220;
    let label = `5-Seater Table #${nextNum}`;
    let hebrewLabel = `שולחן 5 מקומות #${nextNum}`;

    if (preset === '2_seater') {
      topCount = 1;
      botCount = 1;
      width = 130;
      label = `2-Seater Chavrusa #${nextNum}`;
      hebrewLabel = `שולחן חברותא #${nextNum}`;
    } else if (preset === '3_seater') {
      topCount = 2;
      botCount = 1;
      width = 170;
      label = `3-Seater Table #${nextNum}`;
      hebrewLabel = `שולחן 3 מקומות #${nextNum}`;
    } else if (preset === '6_seater') {
      topCount = 3;
      botCount = 3;
      width = 240;
      label = `6-Seater Table #${nextNum}`;
      hebrewLabel = `שולחן 6 מקומות #${nextNum}`;
    } else if (preset === '8_seater') {
      topCount = 4;
      botCount = 4;
      width = 280;
      label = `8-Seater Table #${nextNum}`;
      hebrewLabel = `שולחן 8 מקומות #${nextNum}`;
    }

    const newElement: LayoutElement = {
      id: tableId,
      type: 'table',
      label,
      hebrewLabel,
      sectionId: activeSectionId,
      x: xPos,
      y: yPos,
      width,
      height: 75,
      color: '#b45309'
    };

    const newSeatsList: Seat[] = [];

    // Top seats
    for (let s = 1; s <= topCount; s++) {
      newSeatsList.push({
        id: `seat-${tableId}-n-${s}`,
        code: `T${nextNum}-A${s}`,
        sectionId: activeSectionId,
        row: `T${nextNum}`,
        number: s,
        x: xPos + 15 + (s - 1) * 60,
        y: yPos - 45,
        tier: 'standard',
        price: 150,
        status: 'available',
        hasShtender: true
      });
    }

    // Bottom seats
    for (let s = 1; s <= botCount; s++) {
      newSeatsList.push({
        id: `seat-${tableId}-s-${s}`,
        code: `T${nextNum}-B${s}`,
        sectionId: activeSectionId,
        row: `T${nextNum}`,
        number: s + topCount,
        x: xPos + 15 + (s - 1) * 60,
        y: yPos + 85,
        tier: 'standard',
        price: 150,
        status: 'available',
        hasShtender: true
      });
    }

    updateState([...seats, ...newSeatsList], [...elements, newElement]);
    showToast(`Added ${label}!`);
  };

  // Add Single Pew Row
  const handleAddPewRow = () => {
    let startY = 160;
    if (sectionSeats.length > 0) {
      const maxY = Math.max(...sectionSeats.map(s => s.y));
      startY = maxY + 75;
    }

    const newRowSeats: Seat[] = [];
    const prefix = currentSection.name.substring(0, 1).toUpperCase();

    for (let i = 1; i <= pewSeatsCount; i++) {
      const seatNumStr = i < 10 ? `0${i}` : `${i}`;
      newRowSeats.push({
        id: `seat-${activeSectionId}-${pewRowLetter}-${i}-${Date.now()}`,
        code: `${prefix}-${pewRowLetter}-${seatNumStr}`,
        sectionId: activeSectionId,
        row: pewRowLetter,
        number: i,
        x: 120 + (i - 1) * 60,
        y: startY,
        tier: defaultTier,
        price: defaultSeatPrice,
        status: 'available',
        hasShtender: hasShtendersDefault
      });
    }

    updateState([...seats, ...newRowSeats], elements);
    showToast(`Added row "${pewRowLetter}" with ${pewSeatsCount} seats!`);

    // Advance to next letter
    if (rowNumberingScheme === 'hebrew') {
      const curIdx = HEBREW_ROW_LETTERS.indexOf(pewRowLetter);
      if (curIdx >= 0 && curIdx < HEBREW_ROW_LETTERS.length - 1) {
        setPewRowLetter(HEBREW_ROW_LETTERS[curIdx + 1]);
      }
    } else if (rowNumberingScheme === 'english') {
      setPewRowLetter(String.fromCharCode(pewRowLetter.charCodeAt(0) + 1));
    } else {
      setPewRowLetter(String(Number(pewRowLetter || 1) + 1));
    }
  };

  // Multi-Row Block Generator
  const handleGenerateMultiRowBlock = () => {
    const newSeatsList: Seat[] = [];
    const now = Date.now();
    const prefix = currentSection.name.substring(0, 1).toUpperCase();
    const generatedBlockId = `block-${now}`;
    const generatedBlockLabel = `Block ${blockStartRow} (${blockRowCount} rows)`;

    for (let r = 0; r < blockRowCount; r++) {
      let currentRowLabel = '';
      if (rowNumberingScheme === 'hebrew') {
        const startIdx = HEBREW_ROW_LETTERS.indexOf(blockStartRow);
        const idx = startIdx >= 0 ? startIdx + r : r;
        currentRowLabel = HEBREW_ROW_LETTERS[idx] || numberToHebrewRowLetter(idx + 1);
      } else if (rowNumberingScheme === 'english') {
        const startCode = blockStartRow ? blockStartRow.charCodeAt(0) : 65;
        currentRowLabel = String.fromCharCode(startCode + r);
      } else {
        const startNum = Number(blockStartRow) || 1;
        currentRowLabel = String(startNum + r);
      }

      const y = 140 + r * blockRowSpacing;

      for (let c = 1; c <= blockSeatsPerRow; c++) {
        const isRightBlock = c > Math.floor(blockSeatsPerRow / 2);
        const aisleGap = isRightBlock ? 80 : 0;
        const x = 100 + (c - 1) * 55 + aisleGap;

        const numStr = c < 10 ? `0${c}` : `${c}`;
        newSeatsList.push({
          id: `seat-blk-${now}-${r}-${c}`,
          code: `${prefix}-${currentRowLabel}-${numStr}`,
          sectionId: activeSectionId,
          row: currentRowLabel,
          number: c,
          x,
          y,
          tier: r === 0 ? 'premium' : 'standard',
          price: r === 0 ? 250 : 180,
          status: 'available',
          hasShtender: true,
          blockId: generatedBlockId,
          blockLabel: generatedBlockLabel
        });
      }
    }

    updateState([...seats, ...newSeatsList], elements);
    showToast(`Generated sanctuary block with ${blockRowCount} rows (${blockRowCount * blockSeatsPerRow} seats total)! You can move the entire block together.`);
  };

  // 1-Click Drop Architectural Elements
  const handleAddArchitecturalElement = (type: 'aron_kodesh' | 'bimah' | 'chazan_amud' | 'mechitza' | 'table') => {
    const now = Date.now();
    let newElement: LayoutElement;

    if (type === 'aron_kodesh') {
      newElement = {
        id: `elem-ark-${now}`,
        type: 'aron_kodesh',
        label: 'Aron Kodesh',
        hebrewLabel: 'ארון הקודש',
        sectionId: activeSectionId,
        x: 420,
        y: 40,
        width: 220,
        height: 70,
        color: '#d97706'
      };
    } else if (type === 'bimah') {
      newElement = {
        id: `elem-bimah-${now}`,
        type: 'bimah',
        label: 'Central Bimah',
        hebrewLabel: 'בימה מרכזית',
        sectionId: activeSectionId,
        x: 410,
        y: 320,
        width: 240,
        height: 120,
        color: '#059669'
      };
    } else if (type === 'chazan_amud') {
      newElement = {
        id: `elem-amud-${now}`,
        type: 'chazan_amud',
        label: "Chazan's Amud",
        hebrewLabel: 'עמוד החזן',
        sectionId: activeSectionId,
        x: 480,
        y: 120,
        width: 100,
        height: 40,
        color: '#2563eb'
      };
    } else if (type === 'mechitza') {
      newElement = {
        id: `elem-mech-${now}`,
        type: 'mechitza',
        label: 'Mechitza Divider',
        hebrewLabel: 'מחיצה',
        sectionId: activeSectionId,
        x: 60,
        y: 520,
        width: 900,
        height: 14,
        color: '#e11d48'
      };
    } else {
      newElement = {
        id: `elem-tbl-${now}`,
        type: 'table',
        label: 'Table',
        hebrewLabel: 'שולחן',
        sectionId: activeSectionId,
        x: 200,
        y: 200,
        width: 180,
        height: 70,
        color: '#b45309'
      };
    }

    updateState(seats, [...elements, newElement]);
    showToast(`Added ${newElement.label}!`);
  };

  // Bulk Price Update
  const handleBulkPriceUpdate = (price: number, tier: SeatTier) => {
    const updated = seats.map(s => {
      if (s.sectionId === activeSectionId && s.tier === tier) {
        return { ...s, price };
      }
      return s;
    });
    updateState(updated, elements);
    showToast(`Updated price for all ${tier.toUpperCase()} seats to $${price}!`);
  };

  // Bulk Renumbering
  const handleBulkRenumber = () => {
    let targetSeats = seats.filter(s => s.sectionId === activeSectionId);
    if (targetSeats.length === 0) return;

    const rowLettersMap: Record<number, string> = {};
    if (targetRowForRename === 'all' && bulkRowReordering !== 'keep') {
      const distinctYValues: number[] = Array.from(new Set<number>(targetSeats.map(s => Math.round(s.y / 30) * 30))).sort((a, b) => a - b);
      distinctYValues.forEach((yVal, idx) => {
        if (bulkRowReordering === 'hebrew') {
          rowLettersMap[yVal] = HEBREW_ROW_LETTERS[idx] || numberToHebrewRowLetter(idx + 1);
        } else if (bulkRowReordering === 'english') {
          rowLettersMap[yVal] = String.fromCharCode(65 + (idx % 26));
        } else {
          rowLettersMap[yVal] = String(idx + 1);
        }
      });
    }

    const updatedSeats = seats.map(s => {
      if (s.sectionId !== activeSectionId) return s;
      if (targetRowForRename !== 'all' && s.row !== targetRowForRename) return s;

      const yKey = Math.round(s.y / 30) * 30;
      const calculatedRow = (targetRowForRename === 'all' && bulkRowReordering !== 'keep')
        ? (rowLettersMap[yKey] || s.row)
        : (renameNewRow ? renameNewRow : s.row);

      return {
        ...s,
        row: calculatedRow,
        code: `${renamePrefix ? renamePrefix + '-' : ''}${calculatedRow}-${s.number < 10 ? '0' + s.number : s.number}`
      };
    });

    updateState(updatedSeats, elements);
    showToast('Applied row renumbering and lettering!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-5 animate-fade-in text-slate-800">
      {/* Top Header & Section Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900">
                  {t('layout_designer_title', 'עורך תוכנית בית הכנסת')}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {(language === 'he' || language === 'yi') && currentSection.hebrewName ? currentSection.hebrewName : currentSection.name}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {(language === 'he' || language === 'yi') 
                  ? 'סטודיו חזותי לעיצוב פריסת בית הכנסת, גרירת שולחנות, שורות ספסלים, בימה וארון קודש בקלות.' 
                  : 'Visual sanctuary seating chart studio. Easily place tables, pew rows, and bimah with instant drag & drop.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenSetupModal && (
              <button
                onClick={onOpenSetupModal}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('setup_options_btn', 'Sanctuary Setup Wizard')}</span>
              </button>
            )}

            <button
              onClick={() => setShowConfirmReset(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('clear_section', 'Clear Section')}</span>
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-2 overflow-x-auto py-1">
            <span className="text-slate-500 font-bold text-[10px] uppercase shrink-0">
              {t('sanctuary_section', 'Section')}:
            </span>
            {sections.map(s => {
              const count = seats.filter(st => st.sectionId === s.id).length;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSectionId(s.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
                    activeSectionId === s.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.color || '#2563eb' }} />
                  <span>
                    {(language === 'he' || language === 'yi') && s.hebrewName 
                      ? s.hebrewName.split('-')[0].trim() 
                      : s.name.split('(')[0].trim()}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSectionId === s.id ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setEditingSection(currentSection);
                setIsAddSectionOpen(true);
              }}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>{t('edit', 'Edit')}</span>
            </button>
            <button
              onClick={() => {
                setEditingSection(null);
                setIsAddSectionOpen(true);
              }}
              className="px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ {t('add_section', 'Add Section')}</span>
            </button>
          </div>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2 animate-fade-in shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* LIVE VISUAL SANCTUARY STUDIO CANVAS */}
      <SimpleLiveCanvas
        seats={seats}
        elements={elements}
        activeSectionId={activeSectionId}
        currentSection={currentSection}
        onUpdateLayout={updateState}
        onUpdateSeats={(newSeats) => updateState(newSeats, elements)}
        onUpdateElements={(newElements) => updateState(seats, newElements)}
      />

      {/* SIMPLIFIED TOOL TABS BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('quick_presets')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'quick_presets' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⚡ {t('one_click_blueprints', '1-Click Blueprints')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tables')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'tables' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>🪑 {t('tables_and_shtenders', 'Tables & Shtenders')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pews')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'pews' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>🏛️ {t('pew_rows', 'Pew Rows')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('landmarks')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'landmarks' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>👑 {t('bimah_and_ark', 'Bimah & Ark')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dignitaries')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'dignitaries' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>{t('rabbi_and_gabbaim', 'Rabbi & Gabbaim')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual_seat')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'manual_seat' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Edit className="w-3.5 h-3.5" />
            <span>✍️ {t('add_single_seat', 'Add Single Seat')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('renumber_price')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'renumber_price' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>🔢 {t('renumber_and_price', 'Renumber & Price')}</span>
          </button>
        </div>
      </div>

      {/* ACTIVE TAB CONTENT */}
      <div>
        {/* Tab 1: 1-Click Blueprints */}
        {activeTab === 'quick_presets' && (
          <QuickLayoutWizard
            activeSectionId={activeSectionId}
            sections={sections}
            onApplyLayout={(newSeats, newElements, msg) => {
              updateState(newSeats, newElements);
              showToast(msg);
            }}
          />
        )}

        {/* Tab 2: Tables & Shtenders */}
        {activeTab === 'tables' && (
          <div className="space-y-4">
            {/* Quick 1-Click Table Droppers */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                {t('quick_table_droppers', 'Quick 1-Click Table Droppers')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickAddTable('5_seater')}
                  className="p-3 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs transition flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="text-base">🪑 {t('five_seater', '5-Seater')}</span>
                  <span className="text-[10px] text-amber-700 font-normal">
                    {language === 'he' || language === 'yi' ? '3 למעלה + 2 למטה' : '3 Top + 2 Bottom'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickAddTable('2_seater')}
                  className="p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-xs transition flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="text-base">👥 {t('two_seater', '2-Seater')}</span>
                  <span className="text-[10px] text-emerald-700 font-normal">
                    {language === 'he' || language === 'yi' ? 'שולחן חברותא' : 'Chavrusa Desk'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickAddTable('3_seater')}
                  className="p-3 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold text-xs transition flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="text-base">🪑 {t('three_seater', '3-Seater')}</span>
                  <span className="text-[10px] text-blue-700 font-normal">
                    {language === 'he' || language === 'yi' ? '2 למעלה + 1 למטה' : '2 Top + 1 Bottom'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickAddTable('6_seater')}
                  className="p-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-bold text-xs transition flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="text-base">🪑 {t('six_seater', '6-Seater')}</span>
                  <span className="text-[10px] text-indigo-700 font-normal">
                    {language === 'he' || language === 'yi' ? '3 למעלה + 3 למטה' : '3 Top + 3 Bottom'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickAddTable('8_seater')}
                  className="p-3 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs transition flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="text-base">🪑 {t('eight_seater', '8-Seater')}</span>
                  <span className="text-[10px] text-purple-700 font-normal">
                    {language === 'he' || language === 'yi' ? '4 למעלה + 4 למטה' : '4 Top + 4 Bottom'}
                  </span>
                </button>
              </div>
            </div>

            {/* Full Custom Table Generator */}
            <CustomTableGenerator
              activeSectionId={activeSectionId}
              existingSeats={seats}
              existingElements={elements}
              onAddLayoutItems={(newSeats, newElements, msg) => {
                updateState([...seats, ...newSeats], [...elements, ...newElements]);
                showToast(msg);
              }}
            />
          </div>
        )}

        {/* Tab 3: Pew Rows */}
        {activeTab === 'pews' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Single Row Adder */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  {t('add_single_pew_row', 'Add Single Pew Row')}
                </h3>
                <div className="flex gap-1">
                  {['א', 'ב', 'ג', 'ד', 'A', 'B', 'C'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setPewRowLetter(r)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition cursor-pointer ${
                        pewRowLetter === r ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                    {t('row_label', 'Row Label')}
                  </label>
                  <input
                    type="text"
                    value={pewRowLetter}
                    onChange={(e) => setPewRowLetter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-center text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                    {t('seats_count', 'Seats Count')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={pewSeatsCount}
                    onChange={(e) => setPewSeatsCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-center text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                    {t('price', 'Price')} ($)
                  </label>
                  <input
                    type="number"
                    value={defaultSeatPrice}
                    onChange={(e) => setDefaultSeatPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-center text-slate-900"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddPewRow}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {language === 'he' || language === 'yi'
                    ? `הוסף שורה ${pewRowLetter} (${pewSeatsCount} מקומות)`
                    : `Add Row ${pewRowLetter} (${pewSeatsCount} Seats)`}
                </span>
              </button>
            </div>

            {/* Multi-Row Block Generator */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  {t('generate_sanctuary_block', 'Generate Sanctuary Block')}
                </h3>
                <div className="flex gap-1 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setRowNumberingScheme('hebrew');
                      setBlockStartRow('א');
                    }}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      rowNumberingScheme === 'hebrew' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    א-ב
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRowNumberingScheme('english');
                      setBlockStartRow('A');
                    }}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      rowNumberingScheme === 'english' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    A-B
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                    {t('start_row', 'Start Row')}
                  </label>
                  <input
                    type="text"
                    value={blockStartRow}
                    onChange={(e) => setBlockStartRow(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-center text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                    {t('row_count', 'Row Count')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={blockRowCount}
                    onChange={(e) => setBlockRowCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-center text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                    {t('seats_per_row', 'Seats/Row')}
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={blockSeatsPerRow}
                    onChange={(e) => setBlockSeatsPerRow(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-bold text-center text-slate-900"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateMultiRowBlock}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {language === 'he' || language === 'yi'
                    ? `צור גוש שורות (${blockRowCount * blockSeatsPerRow} מקומות בסה"כ)`
                    : `Generate Block (${blockRowCount * blockSeatsPerRow} Seats Total)`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Landmarks */}
        {activeTab === 'landmarks' && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
              {t('sanctuary_landmarks_title', 'Sanctuary Landmarks & Architecture')}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'he' || language === 'yi'
                ? 'לחץ על אלמנט להוספתו לתרשים בית הכנסת. תוכל לגרור ולשנות את גודלו בחופשיות.'
                : 'Click any element to drop it onto your sanctuary floor plan. You can drag to position and resize it freely.'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleAddArchitecturalElement('aron_kodesh')}
                className="p-3.5 rounded-xl border-2 border-amber-200 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 text-left transition flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <h4 className="font-bold text-xs text-amber-950">{t('aron_kodesh', 'Aron Kodesh')}</h4>
                  <span className="text-[10px] text-amber-700">
                    {language === 'he' || language === 'yi' ? 'ארון הקודש' : 'Holy Ark'}
                  </span>
                </div>
                <Crown className="w-5 h-5 text-amber-600" />
              </button>

              <button
                type="button"
                onClick={() => handleAddArchitecturalElement('bimah')}
                className="p-3.5 rounded-xl border-2 border-emerald-200 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-left transition flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <h4 className="font-bold text-xs text-emerald-950">{t('bimah', 'Central Bimah')}</h4>
                  <span className="text-[10px] text-emerald-700">
                    {language === 'he' || language === 'yi' ? 'שולחן קריאת התורה' : 'Torah Reading Table'}
                  </span>
                </div>
                <Building className="w-5 h-5 text-emerald-600" />
              </button>

              <button
                type="button"
                onClick={() => handleAddArchitecturalElement('chazan_amud')}
                className="p-3.5 rounded-xl border-2 border-blue-200 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-left transition flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <h4 className="font-bold text-xs text-blue-950">{t('chazan_amud', "Chazan's Amud")}</h4>
                  <span className="text-[10px] text-blue-700">
                    {language === 'he' || language === 'yi' ? 'עמוד החזן' : 'Cantor Lectern'}
                  </span>
                </div>
                <BookOpen className="w-5 h-5 text-blue-600" />
              </button>

              <button
                type="button"
                onClick={() => handleAddArchitecturalElement('mechitza')}
                className="p-3.5 rounded-xl border-2 border-rose-200 hover:border-rose-500 bg-rose-50/50 hover:bg-rose-50 text-left transition flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <h4 className="font-bold text-xs text-rose-950">{t('mechitza', 'Mechitza')}</h4>
                  <span className="text-[10px] text-rose-700">
                    {language === 'he' || language === 'yi' ? 'מחיצת עזרת נשים' : 'Partition Wall'}
                  </span>
                </div>
                <Layers className="w-5 h-5 text-rose-600" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: Dignitaries */}
        {activeTab === 'dignitaries' && (
          <DignitariesManager
            activeSectionId={activeSectionId}
            existingSeats={seats}
            existingElements={elements}
            onAddDignitaries={(newSeats, newElements, msg) => {
              updateState([...seats, ...newSeats], [...elements, ...newElements]);
              showToast(msg);
            }}
          />
        )}

        {/* Tab 6: Manual Seat */}
        {activeTab === 'manual_seat' && (
          <ManualSeatAdder
            activeSectionId={activeSectionId}
            existingSeats={seats}
            onAddManualSeat={(newSeat, msg) => {
              updateState([...seats, newSeat], elements);
              showToast(msg);
            }}
          />
        )}

        {/* Tab 7: Renumber & Price */}
        {activeTab === 'renumber_price' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bulk Renumbering */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
                {t('bulk_renumbering_title', 'Bulk Seat & Row Renumbering')}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                    {t('target_row', 'Target Row')}
                  </label>
                  <select
                    value={targetRowForRename}
                    onChange={(e) => setTargetRowForRename(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
                  >
                    <option value="all">
                      {language === 'he' || language === 'yi' ? '-- כל השורות באגף --' : '-- All Rows in Section --'}
                    </option>
                    {existingRows.map(r => (
                      <option key={r} value={r}>
                        {language === 'he' || language === 'yi' ? `שורה ${r}` : `Row ${r}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                    {t('lettering_scheme', 'Lettering Scheme')}
                  </label>
                  <select
                    value={bulkRowReordering}
                    onChange={(e) => setBulkRowReordering(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 text-xs font-bold"
                  >
                    <option value="hebrew">אותיות אלף-בית (א, ב, ג...)</option>
                    <option value="english">Latin ABC (A, B, C...)</option>
                    <option value="numeric">מספרים (1, 2, 3...)</option>
                    <option value="keep">השאר אותיות קיימות</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBulkRenumber}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                {t('apply_sequential_numbering', 'Apply Sequential Numbering & Rows')}
              </button>
            </div>

            {/* Bulk Pricing */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
                {t('bulk_tier_pricing', 'Bulk Tier Pricing')}
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900">{t('tier_mizrach', 'Mizrach / Front Wall')}</span>
                  <button
                    onClick={() => handleBulkPriceUpdate(500, 'mizrach')}
                    className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    {language === 'he' || language === 'yi' ? 'הגדר $500' : 'Set $500'}
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900">{t('tier_premium', 'Premium Tables & Rows')}</span>
                  <button
                    onClick={() => handleBulkPriceUpdate(250, 'premium')}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
                  >
                    {language === 'he' || language === 'yi' ? 'הגדר $250' : 'Set $250'}
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900">{t('tier_standard', 'Standard Seats')}</span>
                  <button
                    onClick={() => handleBulkPriceUpdate(180, 'standard')}
                    className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer"
                  >
                    {language === 'he' || language === 'yi' ? 'הגדר $180' : 'Set $180'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Section Modal */}
      <AddSectionModal
        isOpen={isAddSectionOpen}
        onClose={() => {
          setIsAddSectionOpen(false);
          setEditingSection(null);
        }}
        onSaveSection={handleSaveSection}
        editingSection={editingSection}
        onDeleteSection={handleDeleteSection}
        existingSectionsCount={sections.length}
      />

      {/* Reset Confirmation Dialog */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-5 text-slate-800 space-y-3 shadow-2xl">
            <div className="flex items-center space-x-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                {t('clear_sanctuary_layout_confirm', 'Clear Sanctuary Layout?')}
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'he' || language === 'yi'
                ? `פעולה זו תמחק את כל המקומות והאלמנטים באגף `
                : `This will remove all current seats and floor plan elements in `}
              <strong className="text-slate-900">
                {(language === 'he' || language === 'yi') && currentSection.hebrewName ? currentSection.hebrewName : currentSection.name}
              </strong>.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                {t('cancel', 'Cancel')}
              </button>
              <button
                onClick={() => {
                  handleClearSection();
                  setShowConfirmReset(false);
                }}
                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {t('confirm_clear', 'Confirm Clear')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
