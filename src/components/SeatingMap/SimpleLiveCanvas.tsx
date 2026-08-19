import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Trash2, 
  Edit2, 
  Copy, 
  User, 
  DollarSign, 
  Check, 
  X, 
  Move, 
  Crown, 
  BookOpen, 
  Layers,
  Plus,
  Minus,
  RotateCw,
  Sparkles,
  ArrowRight,
  Maximize2,
  Minimize2,
  Table as TableIcon,
  Undo,
  Redo,
  Keyboard,
  Settings2,
  Sliders,
  Scaling,
  Square,
  BoxSelect,
  MousePointer,
  Hand
} from 'lucide-react';
import { Seat, LayoutElement, SectionType, ShulSection, SeatTier } from '../../types/shul';
import { useI18n } from '../../utils/i18n';
import { generateTableWithSeats, recalculateTableSeats } from '../../utils/tableLayoutHelper';

interface QuickTablePreset {
  id: string;
  name: string;
  topSeats: number;
  bottomSeats: number;
  orientation: 'horizontal' | 'vertical';
  isCustom?: boolean;
}

const DEFAULT_TABLE_PRESETS: QuickTablePreset[] = [
  { id: 'p-2-chav', name: '2-Seater Chavrusa (1+1)', topSeats: 1, bottomSeats: 1, orientation: 'horizontal' },
  { id: 'p-2-single', name: '2-Seater Single Side (2+0)', topSeats: 2, bottomSeats: 0, orientation: 'horizontal' },
  { id: 'p-3-study', name: '3-Seater Table (2+1)', topSeats: 2, bottomSeats: 1, orientation: 'horizontal' },
  { id: 'p-3-single', name: '3-Seater Single Side (3+0)', topSeats: 3, bottomSeats: 0, orientation: 'horizontal' },
  { id: 'p-5-dafyomi', name: '5-Seater Daf Yomi (3+2)', topSeats: 3, bottomSeats: 2, orientation: 'horizontal' },
  { id: 'p-6-table', name: '6-Seater Table (3+3)', topSeats: 3, bottomSeats: 3, orientation: 'horizontal' },
  { id: 'p-4-table', name: '4-Seater Table (2+2)', topSeats: 2, bottomSeats: 2, orientation: 'horizontal' },
  { id: 'p-8-table', name: '8-Seater Table (4+4)', topSeats: 4, bottomSeats: 4, orientation: 'horizontal' }
];

interface SimpleLiveCanvasProps {
  seats: Seat[];
  elements: LayoutElement[];
  activeSectionId: SectionType;
  currentSection: ShulSection;
  onUpdateLayout?: (seats: Seat[], elements: LayoutElement[]) => void;
  onUpdateSeats: (seats: Seat[]) => void;
  onUpdateElements: (elements: LayoutElement[]) => void;
  onSelectSeatForEdit?: (seat: Seat) => void;
}

export const SimpleLiveCanvas: React.FC<SimpleLiveCanvasProps> = ({
  seats,
  elements,
  activeSectionId,
  currentSection,
  onUpdateLayout,
  onUpdateSeats,
  onUpdateElements
}) => {
  const { t, language } = useI18n();

  const getPresetDisplayName = (preset: QuickTablePreset) => {
    if (language === 'he' || language === 'yi') {
      if (preset.id === 'p-3-single') return '3 מקומות צד בודד (3+0)';
      if (preset.id === 'p-5-dafyomi') return 'שולחן 5 מקומות דף היומי (3+2)';
      if (preset.id === 'p-6-table') return 'שולחן 6 מקומות (3+3)';
      if (preset.id === 'p-4-table') return 'שולחן 4 מקומות (2+2)';
      if (preset.id === 'p-8-table') return 'שולחן 8 מקומות (4+4)';
    }
    return preset.name;
  };

  const getElementDisplayName = (el: LayoutElement) => {
    if (language === 'he' || language === 'yi') {
      if (el.hebrewLabel) return el.hebrewLabel;
      if (el.type === 'aron_kodesh') return t('aron_kodesh', 'ארון הקודש');
      if (el.type === 'bimah') return t('bimah', 'בימה מרכזית');
      if (el.type === 'chazan_amud') return t('chazan_amud', 'עמוד החזן');
      if (el.type === 'mechitza') return t('mechitza', 'מחיצה');
    }
    return el.label || el.type;
  };

  // Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Canvas Tool Mode: Marquee Select vs Pan Hand
  const [canvasToolMode, setCanvasToolMode] = useState<'select' | 'pan'>('select');

  // Multi-Selection State (Mouse Box Selector for Multiple Seats, Tables & Elements)
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [initialElementsPosMap, setInitialElementsPosMap] = useState<Record<string, { x: number; y: number }>>({});

  // Selected item on canvas
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Undo / Redo History Stacks
  const [undoStack, setUndoStack] = useState<{ seats: Seat[]; elements: LayoutElement[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ seats: Seat[]; elements: LayoutElement[] }[]>([]);

  // Dragging state
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragItemType, setDragItemType] = useState<'seat' | 'element' | 'block' | 'multi' | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [initialItemPos, setInitialItemPos] = useState({ x: 0, y: 0 });
  const [initialSeatsPosMap, setInitialSeatsPosMap] = useState<Record<string, { x: number; y: number }>>({});
  const [hasMovedDuringDrag, setHasMovedDuringDrag] = useState(false);

  // Sanctuary Block Movement State
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [moveWholeBlockTogether, setMoveWholeBlockTogether] = useState<boolean>(true);

  // Interactive Resizing state (Aron Kodesh, Bimah, Mechitza, Tables, etc.)
  const [resizingElementId, setResizingElementId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'se' | 'e' | 's' | 'w' | 'n' | null>(null);
  const [initialResizeDims, setInitialResizeDims] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });

  // Snap to grid & keyboard hint modal
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Customizable Quick-Add Table Presets
  const [tablePresets, setTablePresets] = useState<QuickTablePreset[]>(() => {
    try {
      const saved = localStorage.getItem('km_custom_table_presets');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_TABLE_PRESETS;
  });

  // Custom Table Creator Drawer State
  const [showCustomTableDrawer, setShowCustomTableDrawer] = useState(false);
  const [customTopSeats, setCustomTopSeats] = useState(3);
  const [customBottomSeats, setCustomBottomSeats] = useState(2);
  const [customOrientation, setCustomOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [customPresetName, setCustomPresetName] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  const sectionSeats = useMemo(() => seats.filter(s => s.sectionId === activeSectionId), [seats, activeSectionId]);
  const sectionElements = useMemo(() => elements.filter(e => e.sectionId === activeSectionId), [elements, activeSectionId]);

  const selectedSeat = sectionSeats.find(s => s.id === selectedSeatId);
  const selectedElement = sectionElements.find(e => e.id === selectedElementId);

  // Atomic state dispatcher that records undo history
  const commitLayoutChange = useCallback((
    newSeats: Seat[],
    newElements: LayoutElement[],
    recordHistory: boolean = true
  ) => {
    if (recordHistory) {
      setUndoStack(prev => [...prev.slice(-40), { seats, elements }]);
      setRedoStack([]);
    }

    if (onUpdateLayout) {
      onUpdateLayout(newSeats, newElements);
    } else {
      onUpdateSeats(newSeats);
      onUpdateElements(newElements);
    }
  }, [seats, elements, onUpdateLayout, onUpdateSeats, onUpdateElements]);

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, { seats, elements }]);

    if (onUpdateLayout) {
      onUpdateLayout(previous.seats, previous.elements);
    } else {
      onUpdateSeats(previous.seats);
      onUpdateElements(previous.elements);
    }
    setSelectedSeatId(null);
    setSelectedElementId(null);
  }, [undoStack, seats, elements, onUpdateLayout, onUpdateSeats, onUpdateElements]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, { seats, elements }]);

    if (onUpdateLayout) {
      onUpdateLayout(next.seats, next.elements);
    } else {
      onUpdateSeats(next.seats);
      onUpdateElements(next.elements);
    }
    setSelectedSeatId(null);
    setSelectedElementId(null);
  }, [redoStack, seats, elements, onUpdateLayout, onUpdateSeats, onUpdateElements]);

  // Find all seats linked to currently selected table
  const selectedTableSeats = useMemo(() => {
    if (!selectedElement || selectedElement.type !== 'table') return [];
    return sectionSeats.filter(s => {
      if (s.tableId === selectedElement.id) return true;
      const isNearX = s.x >= selectedElement.x - 55 && s.x <= selectedElement.x + selectedElement.width + 55;
      const isNearY = s.y >= selectedElement.y - 65 && s.y <= selectedElement.y + selectedElement.height + 65;
      return isNearX && isNearY;
    });
  }, [selectedElement, sectionSeats]);

  // Group section seats into sanctuary blocks
  const sanctuaryBlocks = useMemo(() => {
    const blockMap = new Map<string, Seat[]>();
    
    sectionSeats.forEach(seat => {
      if (seat.blockId) {
        if (!blockMap.has(seat.blockId)) blockMap.set(seat.blockId, []);
        blockMap.get(seat.blockId)!.push(seat);
      }
    });

    const list: {
      id: string;
      label: string;
      seats: Seat[];
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
      width: number;
      height: number;
      rows: string[];
      totalSeats: number;
    }[] = [];

    blockMap.forEach((bSeats, bId) => {
      if (bSeats.length === 0) return;
      const minX = Math.min(...bSeats.map(s => s.x));
      const minY = Math.min(...bSeats.map(s => s.y));
      const maxX = Math.max(...bSeats.map(s => s.x + (s.width || 46)));
      const maxY = Math.max(...bSeats.map(s => s.y + (s.height || 46)));
      const rows = Array.from(new Set(bSeats.map(s => s.row))).sort();
      const label = bSeats[0].blockLabel || `Block ${rows[0] || ''} (${rows.length} rows, ${bSeats.length} seats)`;

      list.push({
        id: bId,
        label,
        seats: bSeats,
        minX,
        minY,
        maxX,
        maxY,
        width: Math.max(120, maxX - minX),
        height: Math.max(60, maxY - minY),
        rows,
        totalSeats: bSeats.length
      });
    });

    return list;
  }, [sectionSeats]);

  const selectedBlock = useMemo(() => {
    if (!selectedBlockId) return null;
    return sanctuaryBlocks.find(b => b.id === selectedBlockId) || null;
  }, [sanctuaryBlocks, selectedBlockId]);

  // Multi-Selection Batch Handlers
  const hasMultiSelection = selectedSeatIds.length > 0 || selectedElementIds.length > 0;

  // Clear all selections (single & multi)
  const handleClearSelection = useCallback(() => {
    setSelectedSeatId(null);
    setSelectedElementId(null);
    setSelectedBlockId(null);
    setSelectedSeatIds([]);
    setSelectedElementIds([]);
  }, []);

  // Delete Multi-Selected Items (Seats and/or Elements)
  const handleDeleteMultiSelected = useCallback(() => {
    if (selectedSeatIds.length === 0 && selectedElementIds.length === 0) return;
    
    // Also include seats belonging to selected tables
    const tableSeatsToRemove = seats.filter(s => s.tableId && selectedElementIds.includes(s.tableId)).map(s => s.id);
    const allSeatIdsToRemove = new Set([...selectedSeatIds, ...tableSeatsToRemove]);

    const nextSeats = seats.filter(s => !allSeatIdsToRemove.has(s.id));
    const nextElements = elements.filter(el => !selectedElementIds.includes(el.id));

    commitLayoutChange(nextSeats, nextElements, true);
    setSelectedSeatIds([]);
    setSelectedElementIds([]);
    setSelectedSeatId(null);
    setSelectedElementId(null);
  }, [selectedSeatIds, selectedElementIds, seats, elements, commitLayoutChange]);

  // Duplicate Multi-Selected Items
  const handleDuplicateMultiSelected = useCallback(() => {
    if (selectedSeatIds.length === 0 && selectedElementIds.length === 0) return;

    const now = Date.now();
    const newSeatIds: string[] = [];
    const newElementIds: string[] = [];

    // Duplicate selected elements (and their attached seats if tables)
    const newElements: LayoutElement[] = [];
    const newSeatsFromElements: Seat[] = [];

    selectedElementIds.forEach((elId, idx) => {
      const origEl = elements.find(e => e.id === elId);
      if (!origEl) return;

      const newId = `elem-dup-${now}-${idx}`;
      newElementIds.push(newId);

      if (origEl.type === 'table') {
        const nextTableNum = sectionElements.filter(e => e.type === 'table').length + idx + 1;
        const { tableElement, seats: tableSeats } = generateTableWithSeats({
          tableId: newId,
          tableLabel: `Table #${nextTableNum}`,
          sectionId: activeSectionId,
          x: origEl.x + 40,
          y: origEl.y + 40,
          topSeats: origEl.tableConfig?.topSeats || 3,
          bottomSeats: origEl.tableConfig?.bottomSeats || 3,
          orientation: origEl.tableConfig?.orientation || 'horizontal',
          tableNumber: nextTableNum,
          prefix: 'T'
        });
        newElements.push(tableElement);
        newSeatsFromElements.push(...tableSeats);
      } else {
        newElements.push({
          ...origEl,
          id: newId,
          x: origEl.x + 40,
          y: origEl.y + 40,
          label: `${origEl.label} (Copy)`
        });
      }
    });

    // Duplicate standalone selected seats
    const newStandaloneSeats: Seat[] = [];
    selectedSeatIds.forEach((seatId, idx) => {
      const origSeat = seats.find(s => s.id === seatId);
      if (!origSeat) return;
      // Skip if this seat is already part of a duplicated table
      if (origSeat.tableId && selectedElementIds.includes(origSeat.tableId)) return;

      const newId = `seat-dup-${now}-${idx}`;
      newSeatIds.push(newId);
      newStandaloneSeats.push({
        ...origSeat,
        id: newId,
        code: `${origSeat.row}-${origSeat.number + 50 + idx}`,
        number: origSeat.number + 50 + idx,
        x: origSeat.x + 40,
        y: origSeat.y + 40,
        status: 'available',
        reservedForMemberName: undefined,
        reservedForHebrewName: undefined
      });
    });

    const allNextSeats = [...seats, ...newSeatsFromElements, ...newStandaloneSeats];
    const allNextElements = [...elements, ...newElements];

    commitLayoutChange(allNextSeats, allNextElements, true);
    setSelectedSeatIds([...newSeatIds, ...newSeatsFromElements.map(s => s.id)]);
    setSelectedElementIds(newElementIds);
  }, [selectedSeatIds, selectedElementIds, elements, seats, sectionElements, activeSectionId, commitLayoutChange]);

  // Bulk update tier & price on multi-selected seats
  const handleBulkUpdateMultiTier = useCallback((tier: SeatTier, price: number) => {
    if (selectedSeatIds.length === 0) return;
    const seatIdSet = new Set(selectedSeatIds);
    const nextSeats = seats.map(s => seatIdSet.has(s.id) ? { ...s, tier, price } : s);
    commitLayoutChange(nextSeats, elements, true);
  }, [selectedSeatIds, seats, elements, commitLayoutChange]);

  // Toggle Shtender on all multi-selected seats
  const handleToggleMultiShtender = useCallback(() => {
    if (selectedSeatIds.length === 0) return;
    const seatIdSet = new Set(selectedSeatIds);
    const hasAnyWithoutShtender = seats.some(s => seatIdSet.has(s.id) && !s.hasShtender);
    const nextSeats = seats.map(s => seatIdSet.has(s.id) ? { ...s, hasShtender: hasAnyWithoutShtender } : s);
    commitLayoutChange(nextSeats, elements, true);
  }, [selectedSeatIds, seats, elements, commitLayoutChange]);

  // Align multi-selected items (Left, Top, Distribute Horizontally, Distribute Vertically)
  const handleAlignMulti = useCallback((type: 'left' | 'top' | 'distribute-h' | 'distribute-v') => {
    const activeSeats = seats.filter(s => selectedSeatIds.includes(s.id));
    const activeElements = elements.filter(el => selectedElementIds.includes(el.id));

    if (activeSeats.length + activeElements.length <= 1) return;

    if (type === 'left') {
      const minX = Math.min(
        ...activeSeats.map(s => s.x),
        ...activeElements.map(el => el.x)
      );
      const seatSet = new Set(selectedSeatIds);
      const elSet = new Set(selectedElementIds);
      const nextSeats = seats.map(s => seatSet.has(s.id) ? { ...s, x: minX } : s);
      const nextElements = elements.map(el => elSet.has(el.id) ? { ...el, x: minX } : el);
      commitLayoutChange(nextSeats, nextElements, true);
    } else if (type === 'top') {
      const minY = Math.min(
        ...activeSeats.map(s => s.y),
        ...activeElements.map(el => el.y)
      );
      const seatSet = new Set(selectedSeatIds);
      const elSet = new Set(selectedElementIds);
      const nextSeats = seats.map(s => seatSet.has(s.id) ? { ...s, y: minY } : s);
      const nextElements = elements.map(el => elSet.has(el.id) ? { ...el, y: minY } : el);
      commitLayoutChange(nextSeats, nextElements, true);
    } else if (type === 'distribute-h') {
      if (activeSeats.length > 2) {
        const sorted = [...activeSeats].sort((a, b) => a.x - b.x);
        const minX = sorted[0].x;
        const maxX = sorted[sorted.length - 1].x;
        const step = (maxX - minX) / (sorted.length - 1);
        const posMap = new Map<string, number>();
        sorted.forEach((s, idx) => {
          posMap.set(s.id, Math.round(minX + idx * step));
        });
        const nextSeats = seats.map(s => posMap.has(s.id) ? { ...s, x: posMap.get(s.id)! } : s);
        commitLayoutChange(nextSeats, elements, true);
      }
    } else if (type === 'distribute-v') {
      if (activeSeats.length > 2) {
        const sorted = [...activeSeats].sort((a, b) => a.y - b.y);
        const minY = sorted[0].y;
        const maxY = sorted[sorted.length - 1].y;
        const step = (maxY - minY) / (sorted.length - 1);
        const posMap = new Map<string, number>();
        sorted.forEach((s, idx) => {
          posMap.set(s.id, Math.round(minY + idx * step));
        });
        const nextSeats = seats.map(s => posMap.has(s.id) ? { ...s, y: posMap.get(s.id)! } : s);
        commitLayoutChange(nextSeats, elements, true);
      }
    }
  }, [selectedSeatIds, selectedElementIds, seats, elements, commitLayoutChange]);

  // Duplicate Selected Item (Single or Multi)
  const handleDuplicateSelected = useCallback(() => {
    if (selectedSeatIds.length > 0 || selectedElementIds.length > 0) {
      handleDuplicateMultiSelected();
      return;
    }

    const now = Date.now();
    if (selectedElement) {
      if (selectedElement.type === 'table') {
        const nextTableNum = sectionElements.filter(e => e.type === 'table').length + 1;
        const { tableElement, seats: newTableSeats } = generateTableWithSeats({
          tableId: `tbl-dup-${now}`,
          tableLabel: `Table #${nextTableNum}`,
          sectionId: activeSectionId,
          x: selectedElement.x + 40,
          y: selectedElement.y + 40,
          topSeats: selectedElement.tableConfig?.topSeats || 3,
          bottomSeats: selectedElement.tableConfig?.bottomSeats || 3,
          orientation: selectedElement.tableConfig?.orientation || 'horizontal',
          tableNumber: nextTableNum,
          prefix: 'T'
        });

        commitLayoutChange([...seats, ...newTableSeats], [...elements, tableElement], true);
        setSelectedElementId(tableElement.id);
        setSelectedSeatId(null);
      } else {
        const newElement: LayoutElement = {
          ...selectedElement,
          id: `elem-dup-${now}`,
          x: selectedElement.x + 30,
          y: selectedElement.y + 30,
          label: `${selectedElement.label} (Copy)`
        };
        commitLayoutChange(seats, [...elements, newElement], true);
        setSelectedElementId(newElement.id);
        setSelectedSeatId(null);
      }
    } else if (selectedSeat) {
      const newSeat: Seat = {
        ...selectedSeat,
        id: `seat-${Date.now()}`,
        code: `${selectedSeat.row}-${selectedSeat.number + 1}`,
        number: selectedSeat.number + 1,
        x: selectedSeat.x + 55,
        y: selectedSeat.y,
        status: 'available',
        reservedForMemberName: undefined,
        reservedForHebrewName: undefined
      };
      commitLayoutChange([...seats, newSeat], elements, true);
      setSelectedSeatId(newSeat.id);
      setSelectedElementId(null);
    }
  }, [selectedSeatIds, selectedElementIds, handleDuplicateMultiSelected, selectedElement, selectedSeat, sectionElements, activeSectionId, seats, elements, commitLayoutChange]);

  // Delete Selected Item (Table, Landmark, Seat, or Multi-Selection)
  const handleDeleteSelected = useCallback(() => {
    if (selectedSeatIds.length > 0 || selectedElementIds.length > 0) {
      handleDeleteMultiSelected();
      return;
    }

    if (selectedElement) {
      const targetElementId = selectedElement.id;
      const nextElements = elements.filter(e => e.id !== targetElementId);
      const nextSeats = seats.filter(s => {
        if (s.tableId === targetElementId) return false;
        if (selectedTableSeats.some(st => st.id === s.id)) return false;
        return true;
      });

      commitLayoutChange(nextSeats, nextElements, true);
      setSelectedElementId(null);
      setSelectedSeatId(null);
    } else if (selectedSeat) {
      const targetSeatId = selectedSeat.id;
      const nextSeats = seats.filter(s => s.id !== targetSeatId);
      commitLayoutChange(nextSeats, elements, true);
      setSelectedSeatId(null);
    }
  }, [selectedSeatIds, selectedElementIds, handleDeleteMultiSelected, selectedElement, selectedSeat, elements, seats, selectedTableSeats, commitLayoutChange]);

  // Direct Resize Update for any Element
  const handleUpdateElementDimensions = useCallback((
    elementId: string,
    newWidth: number,
    newHeight: number
  ) => {
    const updatedElements = elements.map(el =>
      el.id === elementId ? { ...el, width: Math.max(30, newWidth), height: Math.max(14, newHeight) } : el
    );
    commitLayoutChange(seats, updatedElements, true);
  }, [elements, seats, commitLayoutChange]);

  // Nudge Selected Item(s) via Keyboard Arrow Keys
  const handleNudgeSelected = useCallback((dx: number, dy: number) => {
    if (selectedSeatIds.length > 0 || selectedElementIds.length > 0) {
      const seatSet = new Set(selectedSeatIds);
      const elSet = new Set(selectedElementIds);
      const nextSeats = seats.map(s => seatSet.has(s.id) ? { ...s, x: Math.max(0, s.x + dx), y: Math.max(0, s.y + dy) } : s);
      const nextElements = elements.map(el => elSet.has(el.id) ? { ...el, x: Math.max(0, el.x + dx), y: Math.max(0, el.y + dy) } : el);
      commitLayoutChange(nextSeats, nextElements, true);
      return;
    }

    if (selectedElement) {
      const updatedElements = elements.map(el =>
        el.id === selectedElement.id ? { ...el, x: Math.max(0, el.x + dx), y: Math.max(0, el.y + dy) } : el
      );

      const linkedSeatIds = selectedTableSeats.map(s => s.id);
      const updatedSeats = seats.map(s => {
        if (linkedSeatIds.includes(s.id)) {
          return { ...s, x: Math.max(0, s.x + dx), y: Math.max(0, s.y + dy) };
        }
        return s;
      });

      commitLayoutChange(updatedSeats, updatedElements, true);
    } else if (selectedSeat) {
      const updatedSeats = seats.map(s =>
        s.id === selectedSeat.id ? { ...s, x: Math.max(0, s.x + dx), y: Math.max(0, s.y + dy) } : s
      );
      commitLayoutChange(updatedSeats, elements, true);
    }
  }, [selectedSeatIds, selectedElementIds, selectedElement, selectedSeat, selectedTableSeats, elements, seats, commitLayoutChange]);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (
        (isCtrlOrCmd && e.key.toLowerCase() === 'y') ||
        (isCtrlOrCmd && e.key.toLowerCase() === 'z' && e.shiftKey)
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (isCtrlOrCmd && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
        return;
      }

      // Quick tool switcher shortcuts: V for Select / Marquee, H for Hand / Pan
      if (e.key.toLowerCase() === 'v' && !isCtrlOrCmd) {
        setCanvasToolMode('select');
        return;
      }
      if (e.key.toLowerCase() === 'h' && !isCtrlOrCmd) {
        setCanvasToolMode('pan');
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId || selectedSeatId || selectedSeatIds.length > 0 || selectedElementIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
          return;
        }
      }

      if (e.key === 'Escape') {
        handleClearSelection();
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedElementId || selectedSeatId || selectedSeatIds.length > 0 || selectedElementIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 50 : 10;
          let dx = 0;
          let dy = 0;
          if (e.key === 'ArrowUp') dy = -step;
          if (e.key === 'ArrowDown') dy = step;
          if (e.key === 'ArrowLeft') dx = -step;
          if (e.key === 'ArrowRight') dx = step;
          handleNudgeSelected(dx, dy);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleDuplicateSelected, handleDeleteSelected, handleNudgeSelected, handleClearSelection, selectedElementId, selectedSeatId, selectedSeatIds, selectedElementIds]);

  // Start Interactive Resizing of an Element Handle
  const handleStartResize = (
    e: React.MouseEvent,
    element: LayoutElement,
    handle: 'se' | 'e' | 's' | 'w' | 'n'
  ) => {
    e.stopPropagation();
    setSelectedElementId(element.id);
    setSelectedSeatId(null);
    setResizingElementId(element.id);
    setResizeHandle(handle);
    setHasMovedDuringDrag(false);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left - pan.x) / zoom;
    const canvasY = (e.clientY - rect.top - pan.y) / zoom;
    setDragStartPos({ x: canvasX, y: canvasY });
    setInitialResizeDims({
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height
    });
  };

  // Canvas Mouse Down: Supports Box Selection and Canvas Pan
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('.canvas-item') || 
      (e.target as HTMLElement).closest('.canvas-toolbar') || 
      (e.target as HTMLElement).closest('.canvas-inspector') ||
      (e.target as HTMLElement).closest('.canvas-palette') ||
      (e.target as HTMLElement).closest('.canvas-resize-handle')
    ) {
      return;
    }

    // Pan Mode or middle click or Alt-held
    if (canvasToolMode === 'pan' || e.button === 1 || e.altKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Marquee Selection Box Mode
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left - pan.x) / zoom;
    const canvasY = (e.clientY - rect.top - pan.y) / zoom;

    // If Shift/Ctrl not pressed, clear prior selections
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
      setSelectedSeatId(null);
      setSelectedElementId(null);
      setSelectedBlockId(null);
      setSelectedSeatIds([]);
      setSelectedElementIds([]);
    }

    setSelectionBox({
      startX: canvasX,
      startY: canvasY,
      currentX: canvasX,
      currentY: canvasY
    });
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (selectionBox) {
      // Calculate real-time Marquee Selection Box intersection
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentCanvasX = (e.clientX - rect.left - pan.x) / zoom;
      const currentCanvasY = (e.clientY - rect.top - pan.y) / zoom;

      setSelectionBox(prev => prev ? { ...prev, currentX: currentCanvasX, currentY: currentCanvasY } : null);

      const boxMinX = Math.min(selectionBox.startX, currentCanvasX);
      const boxMaxX = Math.max(selectionBox.startX, currentCanvasX);
      const boxMinY = Math.min(selectionBox.startY, currentCanvasY);
      const boxMaxY = Math.max(selectionBox.startY, currentCanvasY);

      // Find all intersecting seats
      const matchedSeatIds = sectionSeats.filter(seat => {
        const seatMinX = seat.x;
        const seatMaxX = seat.x + 46;
        const seatMinY = seat.y;
        const seatMaxY = seat.y + 46;
        return !(seatMaxX < boxMinX || seatMinX > boxMaxX || seatMaxY < boxMinY || seatMinY > boxMaxY);
      }).map(s => s.id);

      // Find all intersecting elements / tables
      const matchedElementIds = sectionElements.filter(el => {
        const elMinX = el.x;
        const elMaxX = el.x + el.width;
        const elMinY = el.y;
        const elMaxY = el.y + el.height;
        return !(elMaxX < boxMinX || elMinX > boxMaxX || elMaxY < boxMinY || elMinY > boxMaxY);
      }).map(el => el.id);

      setSelectedSeatIds(matchedSeatIds);
      setSelectedElementIds(matchedElementIds);
      if (matchedSeatIds.length === 1 && matchedElementIds.length === 0) {
        setSelectedSeatId(matchedSeatIds[0]);
      } else if (matchedElementIds.length === 1 && matchedSeatIds.length === 0) {
        setSelectedElementId(matchedElementIds[0]);
      } else {
        setSelectedSeatId(null);
        setSelectedElementId(null);
      }
    } else if (resizingElementId && resizeHandle) {
      // Interactive Resizing calculation in real-time
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentCanvasX = (e.clientX - rect.left - pan.x) / zoom;
      const currentCanvasY = (e.clientY - rect.top - pan.y) / zoom;

      let deltaX = currentCanvasX - dragStartPos.x;
      let deltaY = currentCanvasY - dragStartPos.y;

      if (snapToGrid) {
        deltaX = Math.round(deltaX / 10) * 10;
        deltaY = Math.round(deltaY / 10) * 10;
      }

      setHasMovedDuringDrag(true);

      let newWidth = initialResizeDims.width;
      let newHeight = initialResizeDims.height;
      let newX = initialResizeDims.x;
      let newY = initialResizeDims.y;

      if (resizeHandle === 'se') {
        newWidth = Math.max(40, initialResizeDims.width + deltaX);
        newHeight = Math.max(14, initialResizeDims.height + deltaY);
      } else if (resizeHandle === 'e') {
        newWidth = Math.max(40, initialResizeDims.width + deltaX);
      } else if (resizeHandle === 's') {
        newHeight = Math.max(14, initialResizeDims.height + deltaY);
      } else if (resizeHandle === 'w') {
        const potentialWidth = initialResizeDims.width - deltaX;
        if (potentialWidth >= 40) {
          newWidth = potentialWidth;
          newX = initialResizeDims.x + deltaX;
        }
      } else if (resizeHandle === 'n') {
        const potentialHeight = initialResizeDims.height - deltaY;
        if (potentialHeight >= 14) {
          newHeight = potentialHeight;
          newY = initialResizeDims.y + deltaY;
        }
      }

      const updatedElements = elements.map(el =>
        el.id === resizingElementId
          ? { ...el, x: newX, y: newY, width: newWidth, height: newHeight }
          : el
      );

      commitLayoutChange(seats, updatedElements, false);
    } else if (draggingItemId && dragItemType) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentCanvasX = (e.clientX - rect.left - pan.x) / zoom;
      const currentCanvasY = (e.clientY - rect.top - pan.y) / zoom;

      let deltaX = currentCanvasX - dragStartPos.x;
      let deltaY = currentCanvasY - dragStartPos.y;

      if (snapToGrid) {
        deltaX = Math.round(deltaX / 10) * 10;
        deltaY = Math.round(deltaY / 10) * 10;
      }

      setHasMovedDuringDrag(true);

      if (dragItemType === 'multi') {
        // Drag all multi-selected seats and elements together in real-time
        const updatedSeats = seats.map(s => {
          if (initialSeatsPosMap[s.id]) {
            return {
              ...s,
              x: Math.max(0, initialSeatsPosMap[s.id].x + deltaX),
              y: Math.max(0, initialSeatsPosMap[s.id].y + deltaY)
            };
          }
          return s;
        });

        const updatedElements = elements.map(el => {
          if (initialElementsPosMap[el.id]) {
            return {
              ...el,
              x: Math.max(0, initialElementsPosMap[el.id].x + deltaX),
              y: Math.max(0, initialElementsPosMap[el.id].y + deltaY)
            };
          }
          return el;
        });

        commitLayoutChange(updatedSeats, updatedElements, false);
      } else if (dragItemType === 'seat') {
        const newX = Math.max(0, initialItemPos.x + deltaX);
        const newY = Math.max(0, initialItemPos.y + deltaY);
        commitLayoutChange(
          seats.map(s => s.id === draggingItemId ? { ...s, x: newX, y: newY } : s),
          elements,
          false
        );
      } else if (dragItemType === 'block') {
        const updatedSeats = seats.map(s => {
          if (initialSeatsPosMap[s.id]) {
            return {
              ...s,
              x: Math.max(0, initialSeatsPosMap[s.id].x + deltaX),
              y: Math.max(0, initialSeatsPosMap[s.id].y + deltaY)
            };
          }
          return s;
        });
        commitLayoutChange(updatedSeats, elements, false);
      } else if (dragItemType === 'element') {
        const newX = Math.max(0, initialItemPos.x + deltaX);
        const newY = Math.max(0, initialItemPos.y + deltaY);

        const updatedElements = elements.map(el =>
          el.id === draggingItemId ? { ...el, x: newX, y: newY } : el
        );

        let updatedSeats = seats;
        if (Object.keys(initialSeatsPosMap).length > 0) {
          updatedSeats = seats.map(s => {
            if (initialSeatsPosMap[s.id]) {
              return {
                ...s,
                x: Math.max(0, initialSeatsPosMap[s.id].x + deltaX),
                y: Math.max(0, initialSeatsPosMap[s.id].y + deltaY)
              };
            }
            return s;
          });
        }

        commitLayoutChange(updatedSeats, updatedElements, false);
      }
    }
  };

  const handleMouseUpCanvas = () => {
    setIsPanning(false);
    setSelectionBox(null);
    if (hasMovedDuringDrag) {
      setUndoStack(prev => [...prev.slice(-40), { seats, elements }]);
      setRedoStack([]);
      setHasMovedDuringDrag(false);
    }
    setDraggingItemId(null);
    setDragItemType(null);
    setResizingElementId(null);
    setResizeHandle(null);
    setInitialSeatsPosMap({});
    setInitialElementsPosMap({});
  };

  // Start Dragging an Entire Sanctuary Block
  const handleStartDragBlock = (e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    setSelectedBlockId(blockId);
    setSelectedSeatId(null);
    setSelectedElementId(null);
    setDraggingItemId(blockId);
    setDragItemType('block');
    setHasMovedDuringDrag(false);

    const blockSeats = sectionSeats.filter(s => s.blockId === blockId);
    const posMap: Record<string, { x: number; y: number }> = {};
    blockSeats.forEach(s => {
      posMap[s.id] = { x: s.x, y: s.y };
    });
    setInitialSeatsPosMap(posMap);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left - pan.x) / zoom;
    const canvasY = (e.clientY - rect.top - pan.y) / zoom;
    setDragStartPos({ x: canvasX, y: canvasY });
  };

  // Start Dragging Individual Seat (or Entire Multi-Selection / Block)
  const handleStartDragSeat = (e: React.MouseEvent, seat: Seat) => {
    e.stopPropagation();

    // If Shift-Clicking: Toggle seat in multi-selection
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      if (selectedSeatIds.includes(seat.id)) {
        setSelectedSeatIds(prev => prev.filter(id => id !== seat.id));
      } else {
        setSelectedSeatIds(prev => [...prev, seat.id]);
      }
      return;
    }

    // Check if dragging part of an already multi-selected group
    const isPartOfMulti = selectedSeatIds.includes(seat.id) && (selectedSeatIds.length > 1 || selectedElementIds.length > 0);

    if (isPartOfMulti) {
      setDraggingItemId(seat.id);
      setDragItemType('multi');
      setHasMovedDuringDrag(false);

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left - pan.x) / zoom;
      const canvasY = (e.clientY - rect.top - pan.y) / zoom;
      setDragStartPos({ x: canvasX, y: canvasY });

      // Save initial positions of all multi-selected seats and elements
      const seatPosMap: Record<string, { x: number; y: number }> = {};
      seats.forEach(s => {
        if (selectedSeatIds.includes(s.id)) {
          seatPosMap[s.id] = { x: s.x, y: s.y };
        }
      });
      setInitialSeatsPosMap(seatPosMap);

      const elPosMap: Record<string, { x: number; y: number }> = {};
      elements.forEach(el => {
        if (selectedElementIds.includes(el.id)) {
          elPosMap[el.id] = { x: el.x, y: el.y };
        }
      });
      setInitialElementsPosMap(elPosMap);
      return;
    }

    // Single item selection
    setSelectedSeatIds([seat.id]);
    setSelectedElementIds([]);
    setSelectedSeatId(seat.id);
    setSelectedElementId(null);

    if (seat.blockId) {
      setSelectedBlockId(seat.blockId);
    } else {
      setSelectedBlockId(null);
    }

    setHasMovedDuringDrag(false);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left - pan.x) / zoom;
    const canvasY = (e.clientY - rect.top - pan.y) / zoom;
    setDragStartPos({ x: canvasX, y: canvasY });
    setInitialItemPos({ x: seat.x, y: seat.y });

    if (seat.blockId && moveWholeBlockTogether) {
      setDraggingItemId(seat.blockId);
      setDragItemType('block');
      const blockSeats = sectionSeats.filter(s => s.blockId === seat.blockId);
      const posMap: Record<string, { x: number; y: number }> = {};
      blockSeats.forEach(s => {
        posMap[s.id] = { x: s.x, y: s.y };
      });
      setInitialSeatsPosMap(posMap);
    } else {
      setDraggingItemId(seat.id);
      setDragItemType('seat');
      setInitialSeatsPosMap({});
    }
  };

  // Nudge an Entire Block
  const handleNudgeBlock = useCallback((blockId: string, dx: number, dy: number) => {
    const updatedSeats = seats.map(s => {
      if (s.blockId === blockId) {
        return {
          ...s,
          x: Math.max(0, s.x + dx),
          y: Math.max(0, s.y + dy)
        };
      }
      return s;
    });
    commitLayoutChange(updatedSeats, elements, true);
  }, [seats, elements, commitLayoutChange]);

  // Delete an Entire Block
  const handleDeleteBlock = useCallback((blockId: string) => {
    const updatedSeats = seats.filter(s => s.blockId !== blockId);
    commitLayoutChange(updatedSeats, elements, true);
    setSelectedBlockId(null);
    setSelectedSeatId(null);
  }, [seats, elements, commitLayoutChange]);

  // Bulk update Block Tier and Price
  const handleBulkUpdateBlockTier = useCallback((blockId: string, tier: SeatTier, price: number) => {
    const updatedSeats = seats.map(s => {
      if (s.blockId === blockId) {
        return { ...s, tier, price };
      }
      return s;
    });
    commitLayoutChange(updatedSeats, elements, true);
  }, [seats, elements, commitLayoutChange]);

  // Ungroup Block
  const handleUngroupBlock = useCallback((blockId: string) => {
    const updatedSeats = seats.map(s => {
      if (s.blockId === blockId) {
        const { blockId: _b, blockLabel: _l, ...rest } = s;
        return rest as Seat;
      }
      return s;
    });
    commitLayoutChange(updatedSeats, elements, true);
    setSelectedBlockId(null);
  }, [seats, elements, commitLayoutChange]);

  // Group Row into Block
  const handleGroupRowIntoBlock = useCallback((row: string) => {
    const newBlockId = `block-${Date.now()}`;
    const newBlockLabel = `Block Row ${row}`;
    const updatedSeats = seats.map(s => {
      if (s.sectionId === activeSectionId && s.row === row) {
        return { ...s, blockId: newBlockId, blockLabel: newBlockLabel };
      }
      return s;
    });
    commitLayoutChange(updatedSeats, elements, true);
    setSelectedBlockId(newBlockId);
  }, [seats, elements, activeSectionId, commitLayoutChange]);

  // Start Dragging Table or Landmark Element
  const handleStartDragElement = (e: React.MouseEvent, element: LayoutElement) => {
    e.stopPropagation();

    // Shift-Clicking: Toggle element in multi-selection
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      if (selectedElementIds.includes(element.id)) {
        setSelectedElementIds(prev => prev.filter(id => id !== element.id));
      } else {
        setSelectedElementIds(prev => [...prev, element.id]);
      }
      return;
    }

    // Check if dragging part of an already multi-selected group
    const isPartOfMulti = selectedElementIds.includes(element.id) && (selectedElementIds.length > 1 || selectedSeatIds.length > 0);

    if (isPartOfMulti) {
      setDraggingItemId(element.id);
      setDragItemType('multi');
      setHasMovedDuringDrag(false);

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left - pan.x) / zoom;
      const canvasY = (e.clientY - rect.top - pan.y) / zoom;
      setDragStartPos({ x: canvasX, y: canvasY });

      // Save initial positions of all multi-selected elements
      const elPosMap: Record<string, { x: number; y: number }> = {};
      elements.forEach(el => {
        if (selectedElementIds.includes(el.id)) {
          elPosMap[el.id] = { x: el.x, y: el.y };
        }
      });
      setInitialElementsPosMap(elPosMap);

      // Save initial positions of all multi-selected seats AND seats attached to selected tables
      const seatPosMap: Record<string, { x: number; y: number }> = {};
      seats.forEach(s => {
        const isSelectedDirectly = selectedSeatIds.includes(s.id);
        const isAttachedToSelectedTable = s.tableId && selectedElementIds.includes(s.tableId);
        if (isSelectedDirectly || isAttachedToSelectedTable) {
          seatPosMap[s.id] = { x: s.x, y: s.y };
        }
      });
      setInitialSeatsPosMap(seatPosMap);
      return;
    }

    // Single item selection
    setSelectedElementIds([element.id]);
    setSelectedSeatIds([]);
    setSelectedElementId(element.id);
    setSelectedSeatId(null);
    setSelectedBlockId(null);
    setDraggingItemId(element.id);
    setDragItemType('element');
    setHasMovedDuringDrag(false);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left - pan.x) / zoom;
    const canvasY = (e.clientY - rect.top - pan.y) / zoom;
    setDragStartPos({ x: canvasX, y: canvasY });
    setInitialItemPos({ x: element.x, y: element.y });

    const linkedSeats = sectionSeats.filter(s => {
      if (s.tableId === element.id) return true;
      const isNearX = s.x >= element.x - 55 && s.x <= element.x + element.width + 55;
      const isNearY = s.y >= element.y - 65 && s.y <= element.y + element.height + 65;
      return isNearX && isNearY;
    });

    const posMap: Record<string, { x: number; y: number }> = {};
    linkedSeats.forEach(s => {
      posMap[s.id] = { x: s.x, y: s.y };
    });
    setInitialSeatsPosMap(posMap);
  };

  // 1-Click Drop Table Preset
  const handleDropTablePreset = (preset: QuickTablePreset) => {
    const now = Date.now();
    const tableId = `tbl-${now}`;
    const nextTableNum = sectionElements.filter(e => e.type === 'table').length + 1;

    const dropX = Math.max(80, Math.round((400 - pan.x) / zoom));
    const dropY = Math.max(80, Math.round((250 - pan.y) / zoom));

    const { tableElement, seats: newTableSeats } = generateTableWithSeats({
      tableId,
      tableLabel: preset.name.replace(/\(\d+\+\d+\)/, `#${nextTableNum}`),
      sectionId: activeSectionId,
      x: dropX,
      y: dropY,
      topSeats: preset.topSeats,
      bottomSeats: preset.bottomSeats,
      orientation: preset.orientation,
      tableNumber: nextTableNum,
      prefix: 'T'
    });

    commitLayoutChange([...seats, ...newTableSeats], [...elements, tableElement], true);
    setSelectedElementId(tableElement.id);
  };

  // Save New Custom Table Preset to Local Storage & State
  const handleSaveCustomTablePreset = (dropImmediately: boolean = true) => {
    const total = customTopSeats + customBottomSeats;
    const name = customPresetName.trim() || `${total}-Seater Custom (${customTopSeats}+${customBottomSeats})`;
    const newPreset: QuickTablePreset = {
      id: `custom-p-${Date.now()}`,
      name,
      topSeats: customTopSeats,
      bottomSeats: customBottomSeats,
      orientation: customOrientation,
      isCustom: true
    };

    const updatedPresets = [...tablePresets, newPreset];
    setTablePresets(updatedPresets);
    try {
      localStorage.setItem('km_custom_table_presets', JSON.stringify(updatedPresets));
    } catch (e) {}

    if (dropImmediately) {
      handleDropTablePreset(newPreset);
    }
    setShowCustomTableDrawer(false);
    setCustomPresetName('');
  };

  // Delete Any Quick Table Preset (Default or Custom)
  const handleDeleteTablePreset = (id: string) => {
    const updated = tablePresets.filter(p => p.id !== id);
    setTablePresets(updated);
    try {
      localStorage.setItem('km_custom_table_presets', JSON.stringify(updated));
    } catch (e) {}
  };

  // Reset Table Presets to Default List
  const handleResetTablePresetsToDefault = () => {
    setTablePresets(DEFAULT_TABLE_PRESETS);
    try {
      localStorage.setItem('km_custom_table_presets', JSON.stringify(DEFAULT_TABLE_PRESETS));
    } catch (e) {}
  };

  // 1-Click Drop Pew Row
  const handleDropQuickPewRow = (count: number = 6) => {
    const now = Date.now();
    const rowLetters = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'];
    const existingPewRows = Array.from(new Set(sectionSeats.map(s => s.row)));
    const nextLetter = rowLetters.find(l => !existingPewRows.includes(l)) || `Row-${existingPewRows.length + 1}`;

    const dropX = Math.max(80, Math.round((200 - pan.x) / zoom));
    const dropY = Math.max(80, Math.round((250 - pan.y) / zoom));

    const newSeatsList: Seat[] = [];
    const prefix = currentSection.name.substring(0, 1).toUpperCase();

    for (let s = 1; s <= count; s++) {
      const numStr = s < 10 ? `0${s}` : `${s}`;
      newSeatsList.push({
        id: `seat-pew-${now}-${s}`,
        code: `${prefix}-${nextLetter}-${numStr}`,
        sectionId: activeSectionId,
        row: nextLetter,
        number: s,
        x: dropX + (s - 1) * 58,
        y: dropY,
        tier: 'standard',
        price: 180,
        status: 'available',
        hasShtender: true
      });
    }

    commitLayoutChange([...seats, ...newSeatsList], elements, true);
  };

  // 1-Click Drop Architectural Element
  const handleDropLandmark = (type: 'aron_kodesh' | 'bimah' | 'chazan_amud' | 'mechitza') => {
    const now = Date.now();
    let newElement: LayoutElement;
    const dropX = Math.max(80, Math.round((350 - pan.x) / zoom));

    if (type === 'aron_kodesh') {
      newElement = {
        id: `elem-ark-${now}`,
        type: 'aron_kodesh',
        label: 'Aron Kodesh',
        hebrewLabel: 'ארון הקודש',
        sectionId: activeSectionId,
        x: dropX,
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
        x: dropX,
        y: 280,
        width: 220,
        height: 110,
        color: '#059669'
      };
    } else if (type === 'chazan_amud') {
      newElement = {
        id: `elem-amud-${now}`,
        type: 'chazan_amud',
        label: "Chazan's Amud",
        hebrewLabel: 'עמוד החזן',
        sectionId: activeSectionId,
        x: dropX + 50,
        y: 120,
        width: 100,
        height: 40,
        color: '#2563eb'
      };
    } else {
      newElement = {
        id: `elem-mech-${now}`,
        type: 'mechitza',
        label: 'Mechitza Partition',
        hebrewLabel: 'מחיצה',
        sectionId: activeSectionId,
        x: 60,
        y: 520,
        width: 800,
        height: 14,
        color: '#e11d48'
      };
    }

    commitLayoutChange(seats, [...elements, newElement], true);
    setSelectedElementId(newElement.id);
  };

  // Adjust Seats on Selected Table (+ / - Top or Bottom, or Rotate)
  const handleModifySelectedTableSeats = (
    deltaTop: number,
    deltaBottom: number,
    newOrientation?: 'horizontal' | 'vertical'
  ) => {
    if (!selectedElement || selectedElement.type !== 'table') return;

    const currentTop = selectedElement.tableConfig?.topSeats ?? Math.ceil(selectedTableSeats.length / 2);
    const currentBot = selectedElement.tableConfig?.bottomSeats ?? Math.floor(selectedTableSeats.length / 2);
    const currentOrient = newOrientation || selectedElement.tableConfig?.orientation || 'horizontal';

    const newTop = Math.max(0, Math.min(10, currentTop + deltaTop));
    const newBot = Math.max(0, Math.min(10, currentBot + deltaBottom));

    const { updatedTable, updatedSeats } = recalculateTableSeats(
      selectedElement,
      selectedTableSeats,
      newTop,
      newBot,
      currentOrient
    );

    const updatedElements = elements.map(el => el.id === selectedElement.id ? updatedTable : el);
    const otherSeats = seats.filter(s => {
      if (s.tableId === selectedElement.id) return false;
      if (selectedTableSeats.some(st => st.id === s.id)) return false;
      return true;
    });

    commitLayoutChange([...otherSeats, ...updatedSeats], updatedElements, true);
  };

  // Rotate Table (Horizontal <-> Vertical)
  const handleRotateSelectedTable = () => {
    if (!selectedElement || selectedElement.type !== 'table') return;
    const currentOrient = selectedElement.tableConfig?.orientation || 'horizontal';
    const nextOrient = currentOrient === 'horizontal' ? 'vertical' : 'horizontal';
    handleModifySelectedTableSeats(0, 0, nextOrient);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-[600px] relative">
      {/* Top Studio Action Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Move className="w-4 h-4 text-blue-600" />
            {t('interactive_studio_canvas', 'Interactive Studio Canvas')} (
            {(language === 'he' || language === 'yi') && currentSection.hebrewName ? currentSection.hebrewName : currentSection.name}
            )
          </span>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            {language === 'he' || language === 'yi'
              ? '• גרור ידיות לשינוי גודל ארון ובימה • גרור שולחנות להזזה יחד עם המקומות • Ctrl+Z ביטול • Ctrl+D שכפול'
              : '• Drag handles to resize Ark & Bimah • Drag tables to move with seats • Ctrl+Z Undo • Ctrl+D Duplicate'}
          </span>
        </div>

        {/* Canvas Controls (Tool Switcher, Undo, Redo, Zoom, Help) */}
        <div className="flex items-center space-x-2">
          {/* Tool Mode: Select (V) vs Pan (H) */}
          <div className="flex items-center space-x-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setCanvasToolMode('select')}
              className={`p-1.5 rounded transition flex items-center gap-1 text-xs font-bold ${
                canvasToolMode === 'select'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 cursor-pointer'
              }`}
              title={language === 'he' || language === 'yi' ? 'כלי בחירה ומלבן סימון (V)' : 'Select Tool & Marquee Box (V)'}
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">{t('select', 'Select')}</span>
            </button>
            <button
              type="button"
              onClick={() => setCanvasToolMode('pan')}
              className={`p-1.5 rounded transition flex items-center gap-1 text-xs font-bold ${
                canvasToolMode === 'pan'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 cursor-pointer'
              }`}
              title={language === 'he' || language === 'yi' ? 'כלי גרירת לוח (H)' : 'Pan Canvas Hand (H)'}
            >
              <Hand className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">{t('pan', 'Pan')}</span>
            </button>
          </div>

          {/* Undo / Redo Buttons */}
          <div className="flex items-center space-x-0.5 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className={`p-1.5 rounded transition ${
                undoStack.length > 0 
                  ? 'text-slate-700 hover:bg-slate-100 cursor-pointer' 
                  : 'text-slate-300 cursor-not-allowed'
              }`}
              title={language === 'he' || language === 'yi' ? 'ביטול פעולה אחרונה (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className={`p-1.5 rounded transition ${
                redoStack.length > 0 
                  ? 'text-slate-700 hover:bg-slate-100 cursor-pointer' 
                  : 'text-slate-300 cursor-not-allowed'
              }`}
              title={language === 'he' || language === 'yi' ? 'בצע שוב (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          <label className="flex items-center space-x-1 text-[11px] text-slate-600 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-600"
            />
            <span>{t('snap', 'Snap')}</span>
          </label>

          {/* Sanctuary Block Movement Mode Toggle */}
          <label className="flex items-center space-x-1 rtl:space-x-reverse text-[11px] text-blue-900 font-bold bg-blue-50 hover:bg-blue-100/80 border border-blue-200 px-2 py-1 rounded-lg cursor-pointer shadow-2xs transition">
            <input
              type="checkbox"
              checked={moveWholeBlockTogether}
              onChange={(e) => setMoveWholeBlockTogether(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-600"
            />
            <span>{language === 'he' || language === 'yi' ? 'גרור גוש שלם יחד' : 'Move Entire Block'}</span>
          </label>

          <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
              title={language === 'he' || language === 'yi' ? 'הקטן תצוגה' : 'Zoom Out'}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold text-slate-700 w-9 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(prev => Math.min(2.0, prev + 0.1))}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
              title={language === 'he' || language === 'yi' ? 'הגדל תצוגה' : 'Zoom In'}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 40, y: 20 });
              }}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
              title={language === 'he' || language === 'yi' ? 'איפוס תצוגה' : 'Reset View'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title={language === 'he' || language === 'yi' ? 'קיצורי מקשים' : 'Keyboard Shortcuts'}
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Customizable Quick-Add Palette Bar */}
        <div className="canvas-palette w-56 bg-white/95 backdrop-blur-xs border-r border-slate-200 p-2.5 space-y-3 overflow-y-auto z-20 shadow-xs hidden md:block">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('quick_add_tables', 'Quick Add Tables')} ({tablePresets.length})
              </span>
              <button
                type="button"
                onClick={() => setShowCustomTableDrawer(true)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
                title={language === 'he' || language === 'yi' ? 'צור שולחן מותאם אישית חדש' : 'Create a new custom table size'}
              >
                <Plus className="w-3 h-3" />
                <span>+ {t('custom', 'Custom')}</span>
              </button>
            </div>

            {tablePresets.length === 0 ? (
              <div className="p-2.5 bg-amber-50/60 border border-dashed border-amber-200 rounded-lg text-center">
                <p className="text-[11px] font-bold text-amber-950 mb-1">
                  {t('no_table_presets', 'No Table Presets')}
                </p>
                <p className="text-[10px] text-slate-500 mb-2">
                  {language === 'he' || language === 'yi'
                    ? 'לחץ "+ מותאם אישית" ליצירת שולחנות או שחזר ברירות מחדל.'
                    : 'Click "+ Custom" to create tables or restore defaults.'}
                </p>
                <button
                  type="button"
                  onClick={handleResetTablePresetsToDefault}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  {t('restore_defaults', 'Restore Defaults')}
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {tablePresets.map(preset => (
                  <div key={preset.id} className="flex items-center gap-1 group">
                    <button
                      type="button"
                      onClick={() => handleDropTablePreset(preset)}
                      className="flex-1 p-1.5 rounded-lg bg-amber-50/70 hover:bg-amber-100 border border-amber-200 text-amber-950 text-left text-xs font-bold transition flex items-center justify-between cursor-pointer"
                      title={language === 'he' || language === 'yi' ? `לחץ להוספת ${getPresetDisplayName(preset)} ללוח` : `Click to drop ${preset.name} on canvas`}
                    >
                      <span className="truncate">{getPresetDisplayName(preset)}</span>
                      <Plus className="w-3 h-3 text-amber-600 shrink-0" />
                    </button>
                    {/* Delete button on ALL presets so user can remove default ones and keep only needed ones */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTablePreset(preset.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition rounded cursor-pointer shrink-0"
                      title={language === 'he' || language === 'yi' ? `מחק תבנית "${getPresetDisplayName(preset)}"` : `Delete "${preset.name}" preset`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-1 px-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setTablePresets([]);
                      try {
                        localStorage.setItem('km_custom_table_presets', JSON.stringify([]));
                      } catch (e) {}
                    }}
                    className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    title={language === 'he' || language === 'yi' ? 'מחק את כל התבניות כדי להשאיר רק שולחנות משלך' : 'Delete all presets'}
                  >
                    {t('delete_all', 'Delete All')}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetTablePresetsToDefault}
                    className="text-slate-400 hover:text-blue-600 transition cursor-pointer"
                    title={language === 'he' || language === 'yi' ? 'שחזר תבניות ברירת מחדל' : 'Reset default presets'}
                  >
                    {t('reset_defaults', 'Reset Defaults')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              + {t('sanctuary_landmarks', 'Sanctuary Landmarks')}
            </span>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleDropLandmark('aron_kodesh')}
                className="w-full p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-left text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t('aron_kodesh', 'Aron Kodesh (Ark)')}</span>
                </span>
                <Plus className="w-3 h-3 text-amber-600" />
              </button>

              <button
                type="button"
                onClick={() => handleDropLandmark('bimah')}
                className="w-full p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-left text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('bimah', 'Central Bimah Table')}</span>
                </span>
                <Plus className="w-3 h-3 text-emerald-600" />
              </button>

              <button
                type="button"
                onClick={() => handleDropLandmark('chazan_amud')}
                className="w-full p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-left text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <span>🎤 {t('chazan_amud', "Chazan's Amud")}</span>
                <Plus className="w-3 h-3 text-blue-600" />
              </button>

              <button
                type="button"
                onClick={() => handleDropLandmark('mechitza')}
                className="w-full p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-left text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <span>🧱 {t('mechitza', 'Mechitza Partition')}</span>
                <Plus className="w-3 h-3 text-rose-600" />
              </button>

              <button
                type="button"
                onClick={() => handleDropQuickPewRow(6)}
                className="w-full p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-left text-xs font-bold transition flex items-center justify-between cursor-pointer mt-2"
              >
                <span>🏛️ {t('pew_row_seats', 'Pew Row (6 Seats)')}</span>
                <Plus className="w-3 h-3 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          className={`flex-1 relative bg-[#F8FAFC] overflow-hidden select-none ${
            isPanning ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`
          }}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              position: 'absolute',
              left: 0,
              top: 0,
              width: 1600,
              height: 1200
            }}
          >
            {/* Section Elements (Tables, Bimah, Ark, etc.) */}
            {sectionElements.map(el => {
              const isSingleSelected = selectedElementId === el.id;
              const isMultiSelected = selectedElementIds.includes(el.id);
              const isSelected = isSingleSelected || isMultiSelected;
              const isTable = el.type === 'table';
              const isArk = el.type === 'aron_kodesh';
              const isBimah = el.type === 'bimah';
              const isMechitza = el.type === 'mechitza';

              let defaultBg = '#334155';
              if (isTable) defaultBg = '#b45309';
              else if (isArk) defaultBg = '#d97706';
              else if (isBimah) defaultBg = '#059669';
              else if (isMechitza) defaultBg = '#e11d48';

              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleStartDragElement(e, el)}
                  className={`canvas-item absolute rounded-xl transition-shadow cursor-move flex items-center justify-center font-bold text-center border-2 group ${
                    isSelected 
                      ? 'ring-3 ring-blue-600 ring-offset-2 shadow-2xl z-35' 
                      : 'shadow-xs hover:shadow-md z-10'
                  }`}
                  style={{
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    backgroundColor: el.color || defaultBg,
                    borderColor: isSelected ? '#2563eb' : 'rgba(0,0,0,0.2)',
                    color: '#ffffff'
                  }}
                >
                  <div className="p-1.5 leading-tight text-ellipsis overflow-hidden pointer-events-none">
                    <span className="text-[11px] block">{el.label}</span>
                    {el.hebrewLabel && (
                      <span className="text-[10px] opacity-85 block font-serif">{el.hebrewLabel}</span>
                    )}
                    <span className="text-[8px] bg-black/35 px-1.5 py-0.2 rounded mt-0.5 inline-block opacity-90">
                      {Math.round(el.width)} × {Math.round(el.height)} px
                    </span>
                  </div>

                  {/* VISUAL RESIZE HANDLES ON SELECTED ELEMENT */}
                  {isSingleSelected && (
                    <>
                      {/* East / Right Width Resize Handle */}
                      <div
                        onMouseDown={(e) => handleStartResize(e, el, 'e')}
                        className="canvas-resize-handle absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-blue-600 hover:bg-blue-700 border-2 border-white rounded-md shadow-md cursor-ew-resize flex items-center justify-center z-40"
                        title="Drag horizontally to adjust width (long/short)"
                      >
                        <div className="w-0.5 h-3 bg-white rounded" />
                      </div>

                      {/* South / Bottom Height Resize Handle */}
                      <div
                        onMouseDown={(e) => handleStartResize(e, el, 's')}
                        className="canvas-resize-handle absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-blue-600 hover:bg-blue-700 border-2 border-white rounded-md shadow-md cursor-ns-resize flex items-center justify-center z-40"
                        title="Drag vertically to adjust height"
                      >
                        <div className="h-0.5 w-3 bg-white rounded" />
                      </div>

                      {/* South-East / Corner Resize Handle */}
                      <div
                        onMouseDown={(e) => handleStartResize(e, el, 'se')}
                        className="canvas-resize-handle absolute -right-2.5 -bottom-2.5 w-5 h-5 bg-blue-600 hover:bg-blue-700 border-2 border-white rounded-full shadow-lg cursor-nwse-resize flex items-center justify-center z-40"
                        title="Drag corner to freely resize both length and height"
                      >
                        <Scaling className="w-2.5 h-2.5 text-white" />
                      </div>

                      {/* West / Left Resize Handle */}
                      <div
                        onMouseDown={(e) => handleStartResize(e, el, 'w')}
                        className="canvas-resize-handle absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-blue-600 hover:bg-blue-700 border-2 border-white rounded-md shadow-md cursor-ew-resize flex items-center justify-center z-40"
                        title="Drag left edge to resize"
                      >
                        <div className="w-0.5 h-3 bg-white rounded" />
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {/* Sanctuary Block Group Outlines & Floating Drag Handles */}
            {sanctuaryBlocks.map(block => {
              const isBlockSelected = selectedBlockId === block.id;
              return (
                <React.Fragment key={`block-group-${block.id}`}>
                  {/* Visual dashed bounding frame */}
                  <div
                    className={`absolute rounded-2xl transition-all pointer-events-none ${
                      isBlockSelected
                        ? 'border-2 border-blue-600 bg-blue-50/20 shadow-md ring-4 ring-blue-500/10'
                        : 'border border-dashed border-blue-400/50 bg-blue-500/5'
                    }`}
                    style={{
                      left: block.minX - 10,
                      top: block.minY - 32,
                      width: block.width + 20,
                      height: block.height + 42,
                      zIndex: 10
                    }}
                  />

                  {/* Floating Block Drag Handle */}
                  <div
                    onMouseDown={(e) => handleStartDragBlock(e, block.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBlockId(block.id);
                      setSelectedSeatId(null);
                      setSelectedElementId(null);
                    }}
                    className={`canvas-item absolute z-35 flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] shadow-sm select-none cursor-grab active:cursor-grabbing transition ${
                      isBlockSelected
                        ? 'bg-blue-700 text-white ring-2 ring-blue-400 shadow-md'
                        : 'bg-blue-600/90 hover:bg-blue-700 text-white'
                    }`}
                    style={{
                      left: block.minX - 8,
                      top: block.minY - 30
                    }}
                    title={language === 'he' || language === 'yi' ? 'גרור כדי להזיז את כל הגוש יחד' : 'Click & drag to move entire sanctuary block'}
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span>{block.label}</span>
                    <span className="bg-blue-900/80 text-[9px] px-1.5 py-0.2 rounded font-mono">
                      {block.totalSeats} seats
                    </span>
                  </div>
                </React.Fragment>
              );
            })}

            {/* Section Seats */}
            {sectionSeats.map(seat => {
              const isSingleSelected = selectedSeatId === seat.id;
              const isMultiSelected = selectedSeatIds.includes(seat.id);
              const isSelected = isSingleSelected || isMultiSelected;
              const isLinkedToSelectedTable = selectedTableSeats.some(st => st.id === seat.id);
              const isMizrach = seat.tier === 'mizrach';
              const isVip = seat.tier === 'vip';
              const isPremium = seat.tier === 'premium';
              const hasOcc = !!seat.reservedForMemberName;

              let bgColor = '#ffffff';
              let borderColor = '#cbd5e1';
              let textColor = '#1e293b';

              if (isMizrach) {
                bgColor = '#fef3c7';
                borderColor = '#f59e0b';
                textColor = '#78350f';
              } else if (isVip) {
                bgColor = '#e0e7ff';
                borderColor = '#6366f1';
                textColor = '#312e81';
              } else if (isPremium) {
                bgColor = '#e0f2fe';
                borderColor = '#0ea5e9';
                textColor = '#0369a1';
              }

              return (
                <div
                  key={seat.id}
                  onMouseDown={(e) => handleStartDragSeat(e, seat)}
                  className={`canvas-item absolute w-[46px] h-[46px] rounded-lg transition-transform cursor-pointer flex flex-col items-center justify-center border-2 text-[10px] font-bold ${
                    isSelected 
                      ? 'ring-2 ring-blue-600 ring-offset-1 scale-105 shadow-lg z-40 bg-blue-50/30' 
                      : isLinkedToSelectedTable
                      ? 'ring-2 ring-amber-500/80 shadow-md z-30'
                      : 'hover:scale-105 shadow-xs z-30'
                  }`}
                  style={{
                    left: seat.x,
                    top: seat.y,
                    backgroundColor: bgColor,
                    borderColor: isSelected ? '#2563eb' : isLinkedToSelectedTable ? '#f59e0b' : borderColor,
                    color: textColor
                  }}
                  title={`${seat.code} (${seat.row}-${seat.number}) - $${seat.price} ${hasOcc ? '• ' + seat.reservedForMemberName : ''}`}
                >
                  {seat.hasShtender && (
                    <span className="w-full h-1 bg-amber-700/80 rounded-t-sm absolute top-0" />
                  )}
                  <span className="text-[10px] font-black leading-none">{seat.code}</span>
                  {hasOcc ? (
                    <span className="text-[8px] font-semibold truncate max-w-[40px] opacity-90 text-blue-900">
                      {seat.reservedForMemberName?.split(' ')[0]}
                    </span>
                  ) : (
                    <span className="text-[8px] font-medium opacity-70">${seat.price}</span>
                  )}
                </div>
              );
            })}

            {/* Selection Marquee Box Rendering */}
            {selectionBox && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/15 rounded-md pointer-events-none z-50 transition-none"
                style={{
                  left: Math.min(selectionBox.startX, selectionBox.currentX),
                  top: Math.min(selectionBox.startY, selectionBox.currentY),
                  width: Math.abs(selectionBox.currentX - selectionBox.startX),
                  height: Math.abs(selectionBox.currentY - selectionBox.startY)
                }}
              />
            )}
          </div>

          {/* Empty State Prompt */}
          {sectionSeats.length === 0 && sectionElements.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-500">
                <TableIcon className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">
                {language === 'he' || language === 'yi' ? 'משטח בית המדרש ריק' : 'Empty Sanctuary Canvas'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {language === 'he' || language === 'yi'
                  ? 'לחץ על שולחן או אלמנט בסרגל הצדדי (לדוגמה: שולחן 5 מקומות, שולחן חברותא, ארון קודש, בימה).'
                  : 'Click any table on the left palette (e.g. 5-Seater Table, 2-Seater Chavrusa, Aron Kodesh, Bimah).'}
              </p>
            </div>
          )}
        </div>

        {/* Multi-Selection Batch Operations Inspector */}
        {(selectedSeatIds.length + selectedElementIds.length) > 1 && (
          <div className="canvas-inspector absolute top-3 right-3 bg-white/95 backdrop-blur-md border-2 border-blue-600 rounded-xl p-3.5 shadow-2xl w-84 z-45 animate-fade-in text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <BoxSelect className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 leading-tight">
                    {language === 'he' || language === 'yi' ? 'בחירה מרובה' : 'Multi-Selection'}
                  </h4>
                  <p className="text-[10px] text-blue-600 font-bold">
                    {selectedSeatIds.length} {t('seats', 'seats')} • {selectedElementIds.length} {language === 'he' || language === 'yi' ? 'אלמנטים' : 'elements'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                title="Clear Selection (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Actions (Duplicate, Delete, Nudge) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDuplicateMultiSelected}
                className="flex-1 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                title="Duplicate All Selected (Ctrl+D)"
              >
                <Copy className="w-3 h-3" />
                <span>{language === 'he' || language === 'yi' ? 'שכפל הכל' : 'Duplicate Group'}</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteMultiSelected}
                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer flex items-center gap-1 font-bold text-xs"
                title="Delete Selected (Delete)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('delete', 'Delete')}</span>
              </button>
            </div>

            {/* Bulk Tier / Price Assignment */}
            {selectedSeatIds.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                  {language === 'he' || language === 'yi' ? 'עדכון מחיר / דרגה לקבוצה' : 'Bulk Set Tier / Price'}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleBulkUpdateMultiTier('standard', 360)}
                    className="py-1 px-1.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold text-center cursor-pointer"
                  >
                    {t('standard', 'Standard')} ($360)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkUpdateMultiTier('premium', 500)}
                    className="py-1 px-1.5 rounded bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-[10px] font-bold text-center cursor-pointer"
                  >
                    {t('premium', 'Premium')} ($500)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkUpdateMultiTier('vip', 750)}
                    className="py-1 px-1.5 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-[10px] font-bold text-center cursor-pointer"
                  >
                    {t('vip', 'VIP')} ($750)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkUpdateMultiTier('mizrach', 1000)}
                    className="py-1 px-1.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-bold text-center cursor-pointer"
                  >
                    {t('mizrach', 'Mizrach')} ($1,000)
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleToggleMultiShtender}
                  className="w-full mt-1 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-bold text-center cursor-pointer"
                >
                  {language === 'he' || language === 'yi' ? 'החלף סטנדר (כן/לא) לכל המקומות' : 'Toggle Shtender For All'}
                </button>
              </div>
            )}

            {/* Alignment and Distribution Tools */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                {language === 'he' || language === 'yi' ? 'יישור ופיזור (Align & Distribute)' : 'Align & Distribute'}
              </span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => handleAlignMulti('left')}
                  className="py-1 px-1.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold text-center cursor-pointer"
                  title="Align Left"
                >
                  {language === 'he' || language === 'yi' ? 'יישר לשמאל' : 'Align Left'}
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignMulti('top')}
                  className="py-1 px-1.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold text-center cursor-pointer"
                  title="Align Top"
                >
                  {language === 'he' || language === 'yi' ? 'יישר למעלה' : 'Align Top'}
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignMulti('distribute-h')}
                  className="py-1 px-1.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold text-center cursor-pointer"
                  title="Distribute Horizontally"
                >
                  {language === 'he' || language === 'yi' ? 'פזר אופקית' : 'Distribute H'}
                </button>
              </div>
            </div>

            {/* Directional Nudge Multi Controls */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                {language === 'he' || language === 'yi' ? 'הזזה עדינה יחד (Nudge Group)' : 'Nudge Selection'}
              </span>
              <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
                <div />
                <button
                  type="button"
                  onClick={() => handleNudgeSelected(0, -20)}
                  className="py-1 px-2 rounded bg-white hover:bg-slate-100 border border-slate-300 font-bold text-slate-700 cursor-pointer flex justify-center text-xs"
                >
                  ↑
                </button>
                <div />
                <button
                  type="button"
                  onClick={() => handleNudgeSelected(-20, 0)}
                  className="py-1 px-2 rounded bg-white hover:bg-slate-100 border border-slate-300 font-bold text-slate-700 cursor-pointer flex justify-center text-xs"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeSelected(0, 20)}
                  className="py-1 px-2 rounded bg-white hover:bg-slate-100 border border-slate-300 font-bold text-slate-700 cursor-pointer flex justify-center text-xs"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeSelected(20, 0)}
                  className="py-1 px-2 rounded bg-white hover:bg-slate-100 border border-slate-300 font-bold text-slate-700 cursor-pointer flex justify-center text-xs"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Architectural Element (Aron Kodesh, Bimah, Mechitza, etc.) Interactive Inspector */}
        {selectedElement && selectedElement.type !== 'table' && (selectedSeatIds.length + selectedElementIds.length) <= 1 && (
          <div className="canvas-inspector absolute top-3 right-3 bg-white/95 backdrop-blur-md border-2 border-blue-600 rounded-xl p-3.5 shadow-2xl w-84 z-40 animate-fade-in text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedElement.color || '#334155' }}
                />
                <div>
                  <h4 className="font-bold text-slate-900 leading-tight">
                    {getElementDisplayName(selectedElement)}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedElementId(null)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Actions (Duplicate, Delete) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDuplicateSelected}
                className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                title={language === 'he' || language === 'yi' ? 'שכפל אלמנט (Ctrl+D)' : 'Duplicate Element (Ctrl+D)'}
              >
                <Copy className="w-3 h-3" />
                <span>{language === 'he' || language === 'yi' ? 'שכפל (Ctrl+D)' : 'Duplicate (Ctrl+D)'}</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer flex items-center gap-1 font-bold text-xs"
                title={language === 'he' || language === 'yi' ? 'מחק אלמנט (Delete)' : 'Delete Element (Delete key)'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('delete', 'Delete')}</span>
              </button>
            </div>

            {/* RESIZING CONTROLS (WIDTH & HEIGHT) */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  <Scaling className="w-3 h-3 text-blue-600" />
                  {language === 'he' || language === 'yi' ? 'מידות האלמנט (שינוי גודל)' : 'Element Dimensions (Resizable)'}
                </span>
                <span className="text-[10px] font-mono text-blue-600 font-bold">
                  {Math.round(selectedElement.width)}W × {Math.round(selectedElement.height)}H px
                </span>
              </div>

              {/* Width Adjuster (Length) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    {language === 'he' || language === 'yi' ? 'אורך / רוחב:' : 'Length / Width:'}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateElementDimensions(selectedElement.id, selectedElement.width - 20, selectedElement.height)}
                      className="w-6 h-6 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold flex items-center justify-center text-xs cursor-pointer"
                      title={language === 'he' || language === 'yi' ? 'קצר ב-20 פיקסלים' : 'Make 20px shorter'}
                    >
                      -
                    </button>
                    <span className="font-bold font-mono text-xs text-slate-900 w-12 text-center">
                      {Math.round(selectedElement.width)}px
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateElementDimensions(selectedElement.id, selectedElement.width + 20, selectedElement.height)}
                      className="w-6 h-6 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold flex items-center justify-center text-xs cursor-pointer"
                      title={language === 'he' || language === 'yi' ? 'הארך ב-20 פיקסלים' : 'Make 20px longer'}
                    >
                      +
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="40"
                  max="900"
                  step="10"
                  value={selectedElement.width}
                  onChange={(e) => handleUpdateElementDimensions(selectedElement.id, Number(e.target.value), selectedElement.height)}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Height Adjuster (Depth) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    {language === 'he' || language === 'yi' ? 'עומק / גובה:' : 'Depth / Height:'}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateElementDimensions(selectedElement.id, selectedElement.width, selectedElement.height - 10)}
                      className="w-6 h-6 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold flex items-center justify-center text-xs cursor-pointer"
                      title={language === 'he' || language === 'yi' ? 'הצר ב-10 פיקסלים' : 'Make 10px thinner'}
                    >
                      -
                    </button>
                    <span className="font-bold font-mono text-xs text-slate-900 w-12 text-center">
                      {Math.round(selectedElement.height)}px
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateElementDimensions(selectedElement.id, selectedElement.width, selectedElement.height + 10)}
                      className="w-6 h-6 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold flex items-center justify-center text-xs cursor-pointer"
                      title={language === 'he' || language === 'yi' ? 'הרחב ב-10 פיקסלים' : 'Make 10px thicker'}
                    >
                      +
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="14"
                  max="400"
                  step="5"
                  value={selectedElement.height}
                  onChange={(e) => handleUpdateElementDimensions(selectedElement.id, selectedElement.width, Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* 1-CLICK POPULAR SIZE PRESETS */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {language === 'he' || language === 'yi' ? 'גדלים מוגדרים מראש' : 'Quick Size Presets'}
              </span>

              {/* Presets for Aron Kodesh */}
              {selectedElement.type === 'aron_kodesh' && (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateElementDimensions(selectedElement.id, 140, 60)}
                    className="py-1 px-1.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-bold text-center cursor-pointer"
                  >
                    {language === 'he' || language === 'yi' ? 'קומפקטי (140px)' : 'Compact (140px)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateElementDimensions(selectedElement.id, 220, 70)}
                    className="py-1 px-1.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-bold text-center cursor-pointer"
                  >
                    {language === 'he' || language === 'yi' ? 'סטנדרטי (220px)' : 'Standard (220px)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateElementDimensions(selectedElement.id, 360, 80)}
                    className="py-1 px-1.5 rounded bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-[10px] font-bold text-center cursor-pointer"
                  >
                    {language === 'he' || language === 'yi' ? 'ארון רחב (360px)' : 'Grand Wall (360px)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateElementDimensions(selectedElement.id, 520, 90)}
                    className="py-1 px-1.5 rounded bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-[10px] font-bold text-center cursor-pointer"
                  >
                    {language === 'he' || language === 'yi' ? 'כל רוחב הכותל (520px)' : 'Full Wall Ark (520px)'}
                  </button>
                </div>
              )}

              {/* Presets for Bimah */}
              {selectedElement.type === 'bimah' && (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateElementDimensions(selectedElement.id, 140, 80)}
                    className="py-1 px-1.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-[10px] font-bold text-center cursor-pointer"
                  >
                    {language === 'he' || language === 'yi' ? 'בימה קטנה (140×80)' : 'Small Desk (140×80)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateElementDimensions(selectedElement.id, 180, 180)}
                    className="py-1 px-1.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-[10px] font-bold text-center cursor-pointer"
                  >
                    {language === 'he' || language === 'yi' ? 'מרובעת (180×180)' : 'Square (180×180)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateElementDimensions(selectedElement.id, 240, 120)}
                    className="py-1 px-1.5 rounded bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-950 text-[10px] font-bold text-center cursor-pointer"
                  >
                    {language === 'he' || language === 'yi' ? 'בימה סטנדרטית (240×120)' : 'Standard Bimah (240×120)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateElementDimensions(selectedElement.id, 340, 160)}
                    className="py-1 px-1.5 rounded bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-950 text-[10px] font-bold text-center cursor-pointer"
                  >
                    {language === 'he' || language === 'yi' ? 'בימה גדולה (340×160)' : 'Grand Bimah (340×160)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateElementDimensions(selectedElement.id, 460, 120)}
                    className="py-1 px-1.5 rounded bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-950 text-[10px] font-bold text-center cursor-pointer col-span-2"
                  >
                    {language === 'he' || language === 'yi' ? 'בימה ארוכה מרכזית (460×120)' : 'Long Bimah Runway (460×120)'}
                  </button>
                </div>
              )}

              {/* Presets for Mechitza / Other */}
              {selectedElement.type !== 'aron_kodesh' && selectedElement.type !== 'bimah' && (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateElementDimensions(selectedElement.id, 300, selectedElement.height)}
                    className="py-1 px-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold text-center cursor-pointer"
                  >
                    {language === 'he' || language === 'yi' ? 'קצרה (300px)' : 'Short (300px)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateElementDimensions(selectedElement.id, 600, selectedElement.height)}
                    className="py-1 px-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold text-center cursor-pointer"
                  >
                    {language === 'he' || language === 'yi' ? 'בינונית (600px)' : 'Medium (600px)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateElementDimensions(selectedElement.id, 900, selectedElement.height)}
                    className="py-1 px-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold text-center cursor-pointer col-span-2"
                  >
                    {language === 'he' || language === 'yi' ? 'לאורך כל האולם (900px)' : 'Full Sanctuary Span (900px)'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Table Interactive Inspector Bar */}
        {selectedElement && selectedElement.type === 'table' && (selectedSeatIds.length + selectedElementIds.length) <= 1 && (
          <div className="canvas-inspector absolute top-3 right-3 bg-white/95 backdrop-blur-md border-2 border-amber-600 rounded-xl p-3.5 shadow-2xl w-84 z-40 animate-fade-in text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                <h4 className="font-bold text-slate-900 truncate max-w-[180px]">
                  {selectedElement.hebrewLabel || selectedElement.label}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedElementId(null)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Actions (Rotate, Duplicate, Delete) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRotateSelectedTable}
                className="flex-1 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                title={language === 'he' || language === 'yi' ? 'סובב שולחן ב-90 מעלות' : 'Rotate Table 90 degrees'}
              >
                <RotateCw className="w-3 h-3" />
                <span>{language === 'he' || language === 'yi' ? 'סובב 90°' : 'Rotate 90°'}</span>
              </button>
              <button
                type="button"
                onClick={handleDuplicateSelected}
                className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                title={language === 'he' || language === 'yi' ? 'שכפל שולחן (Ctrl+D)' : 'Duplicate Table (Ctrl+D)'}
              >
                <Copy className="w-3 h-3" />
                <span>{language === 'he' || language === 'yi' ? 'שכפל (Ctrl+D)' : 'Duplicate (Ctrl+D)'}</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer flex items-center gap-1 font-bold text-xs"
                title={language === 'he' || language === 'yi' ? 'מחק שולחן ומקומותיו (Delete)' : 'Delete Table and its seats (Delete key)'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('delete', 'Delete')}</span>
              </button>
            </div>

            {/* Interactive Seat Adjusters (+ / - Top Side & Bottom Side) */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                {language === 'he' || language === 'yi' ? 'הגדרת מספר מושבים בשולחן' : 'Configure Seats on Table Sides'}
              </span>
              
              {/* Top / North Seats */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  {language === 'he' || language === 'yi' ? 'צד עליון (צפון):' : 'Top Side (North):'}
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleModifySelectedTableSeats(-1, 0)}
                    className="w-6 h-6 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold flex items-center justify-center text-xs cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold text-xs text-slate-900 w-5 text-center">
                    {selectedElement.tableConfig?.topSeats ?? 2}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleModifySelectedTableSeats(1, 0)}
                    className="w-6 h-6 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold flex items-center justify-center text-xs cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Bottom / South Seats */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  {language === 'he' || language === 'yi' ? 'צד תחתון (דרום):' : 'Bottom Side (South):'}
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleModifySelectedTableSeats(0, -1)}
                    className="w-6 h-6 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold flex items-center justify-center text-xs cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold text-xs text-slate-900 w-5 text-center">
                    {selectedElement.tableConfig?.bottomSeats ?? 2}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleModifySelectedTableSeats(0, 1)}
                    className="w-6 h-6 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold flex items-center justify-center text-xs cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Quick 1-Click Presets for this specific table */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {language === 'he' || language === 'yi' ? 'תצורות מהירות' : 'Quick Configurations'}
              </span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => handleModifySelectedTableSeats(1 - (selectedElement.tableConfig?.topSeats ?? 2), 1 - (selectedElement.tableConfig?.bottomSeats ?? 2))}
                  className="py-1 px-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold text-center cursor-pointer"
                >
                  1 + 1 ({t('two_seater', '2-Seater')})
                </button>
                <button
                  type="button"
                  onClick={() => handleModifySelectedTableSeats(2 - (selectedElement.tableConfig?.topSeats ?? 2), 0 - (selectedElement.tableConfig?.bottomSeats ?? 2))}
                  className="py-1 px-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold text-center cursor-pointer"
                >
                  2 + 0 ({language === 'he' || language === 'yi' ? 'צד אחד' : 'Single'})
                </button>
                <button
                  type="button"
                  onClick={() => handleModifySelectedTableSeats(3 - (selectedElement.tableConfig?.topSeats ?? 2), 2 - (selectedElement.tableConfig?.bottomSeats ?? 2))}
                  className="py-1 px-1.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-950 text-[10px] font-bold text-center cursor-pointer"
                >
                  3 + 2 ({t('five_seater', '5-Seater')})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Sanctuary Block Interactive Inspector Bar */}
        {selectedBlock && !selectedSeat && !selectedElement && (
          <div className="canvas-inspector absolute top-3 right-3 bg-white/95 backdrop-blur-md border-2 border-blue-600 rounded-xl p-3.5 shadow-2xl w-80 z-40 animate-fade-in text-xs space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center space-x-1.5">
                <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Move className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 leading-tight">
                    {selectedBlock.label}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {selectedBlock.rows.length} {language === 'he' || language === 'yi' ? 'שורות' : 'rows'} • {selectedBlock.totalSeats} {language === 'he' || language === 'yi' ? 'מקומות' : 'seats'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBlockId(null)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Nudge / Shift Block Direction Controls */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {language === 'he' || language === 'yi' ? 'הזזת כל הגוש (Nudge Block)' : 'Nudge Whole Block'}
                </span>
                <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  {language === 'he' || language === 'yi' ? 'הזזה יחד' : 'Move as Unit'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 w-36 mx-auto">
                <div />
                <button
                  type="button"
                  onClick={() => handleNudgeBlock(selectedBlock.id, 0, -25)}
                  className="py-1 px-2 rounded bg-white hover:bg-slate-100 border border-slate-300 font-bold text-slate-700 shadow-2xs cursor-pointer flex justify-center"
                  title="Move block UP 25px"
                >
                  ↑
                </button>
                <div />
                <button
                  type="button"
                  onClick={() => handleNudgeBlock(selectedBlock.id, -25, 0)}
                  className="py-1 px-2 rounded bg-white hover:bg-slate-100 border border-slate-300 font-bold text-slate-700 shadow-2xs cursor-pointer flex justify-center"
                  title="Move block LEFT 25px"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeBlock(selectedBlock.id, 0, 25)}
                  className="py-1 px-2 rounded bg-white hover:bg-slate-100 border border-slate-300 font-bold text-slate-700 shadow-2xs cursor-pointer flex justify-center"
                  title="Move block DOWN 25px"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeBlock(selectedBlock.id, 25, 0)}
                  className="py-1 px-2 rounded bg-white hover:bg-slate-100 border border-slate-300 font-bold text-slate-700 shadow-2xs cursor-pointer flex justify-center"
                  title="Move block RIGHT 25px"
                >
                  →
                </button>
              </div>
            </div>

            {/* Bulk Tier / Price Update for Block */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                {language === 'he' || language === 'yi' ? 'עדכון מחיר מרוכז לכל הגוש' : 'Bulk Set Tier / Price'}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleBulkUpdateBlockTier(selectedBlock.id, 'standard', 360)}
                  className="py-1 px-1.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold text-center cursor-pointer"
                >
                  {t('standard', 'Standard')} ($360)
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkUpdateBlockTier(selectedBlock.id, 'premium', 500)}
                  className="py-1 px-1.5 rounded bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-[10px] font-bold text-center cursor-pointer"
                >
                  {t('premium', 'Premium')} ($500)
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkUpdateBlockTier(selectedBlock.id, 'vip', 750)}
                  className="py-1 px-1.5 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-[10px] font-bold text-center cursor-pointer"
                >
                  {t('vip', 'VIP')} ($750)
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkUpdateBlockTier(selectedBlock.id, 'mizrach', 1000)}
                  className="py-1 px-1.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-bold text-center cursor-pointer"
                >
                  {t('mizrach', 'Mizrach')} ($1,000)
                </button>
              </div>
            </div>

            {/* Block Actions (Ungroup / Delete) */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleUngroupBlock(selectedBlock.id)}
                className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                title="Ungroup seats so they can be moved independently"
              >
                <span>{language === 'he' || language === 'yi' ? 'פרק גוש (לבודדים)' : 'Ungroup Seats'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBlock(selectedBlock.id)}
                className="py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer flex items-center gap-1 font-bold text-xs"
                title="Delete all seats in this block"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('delete', 'Delete')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Selected Seat Interactive Inspector Bar */}
        {selectedSeat && (selectedSeatIds.length + selectedElementIds.length) <= 1 && (
          <div className="canvas-inspector absolute top-3 right-3 bg-white/95 backdrop-blur-md border-2 border-blue-600 rounded-xl p-3.5 shadow-2xl w-72 z-40 animate-fade-in text-xs space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                {t('seat', 'Seat')} {selectedSeat.code}
              </span>
              <button
                type="button"
                onClick={() => setSelectedSeatId(null)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Block membership indicator & shortcut */}
            {selectedSeat.blockId ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase text-blue-800 block">
                    {language === 'he' || language === 'yi' ? 'חלק מגוש בית מדרש' : 'Sanctuary Block'}
                  </span>
                  <span className="text-xs font-bold text-blue-950 truncate max-w-[140px] block">
                    {selectedSeat.blockLabel || 'Block Group'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBlockId(selectedSeat.blockId!);
                    setSelectedSeatId(null);
                  }}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer"
                >
                  {language === 'he' || language === 'yi' ? 'בחר גוש' : 'Select Block'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleGroupRowIntoBlock(selectedSeat.row)}
                className="w-full py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold text-center cursor-pointer"
              >
                {language === 'he' || language === 'yi' ? `קבץ שורה ${selectedSeat.row} כגוש יחיד להזזה` : `Group Row ${selectedSeat.row} as Movable Block`}
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase">
                  {language === 'he' || language === 'yi' ? 'קוד מושב' : 'Code'}
                </label>
                <input
                  type="text"
                  value={selectedSeat.code}
                  onChange={(e) => commitLayoutChange(seats.map(s => s.id === selectedSeat.id ? { ...s, code: e.target.value } : s), elements, true)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1 font-bold text-slate-900 text-xs"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase">
                  {t('price', 'Price')} ($)
                </label>
                <input
                  type="number"
                  value={selectedSeat.price}
                  onChange={(e) => commitLayoutChange(seats.map(s => s.id === selectedSeat.id ? { ...s, price: Number(e.target.value) } : s), elements, true)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1 font-bold text-slate-900 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase">
                {language === 'he' || language === 'yi' ? 'שם המתפלל / המזמין' : 'Occupant / Attendee Name'}
              </label>
              <input
                type="text"
                value={selectedSeat.reservedForMemberName || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  commitLayoutChange(seats.map(s => s.id === selectedSeat.id ? {
                    ...s,
                    reservedForMemberName: val || undefined,
                    status: val ? 'reserved' : 'available'
                  } : s), elements, true);
                }}
                placeholder={language === 'he' || language === 'yi' ? 'לדוגמה: משה כהן' : 'e.g. Moshe Cohen'}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1 text-slate-900 text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDuplicateSelected}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                title={language === 'he' || language === 'yi' ? 'שכפל מקום (Ctrl+D)' : 'Duplicate Seat (Ctrl+D)'}
              >
                <Copy className="w-3 h-3" /> {language === 'he' || language === 'yi' ? 'שכפל' : 'Duplicate'}
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                title={language === 'he' || language === 'yi' ? 'מחק מקום (Delete)' : 'Delete Seat (Delete key)'}
              >
                <Trash2 className="w-3 h-3" /> {t('delete', 'Delete')}
              </button>
            </div>
          </div>
        )}

        {/* Custom Table Creator Drawer Modal */}
        {showCustomTableDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xl max-w-sm w-full space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <TableIcon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {language === 'he' || language === 'yi' ? 'בונה שולחנות מותאמים אישית' : 'Custom Table Builder'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowCustomTableDrawer(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                  {language === 'he' || language === 'yi' ? 'שם התבנית (אופציונלי)' : 'Preset Label (Optional)'}
                </label>
                <input
                  type="text"
                  value={customPresetName}
                  onChange={(e) => setCustomPresetName(e.target.value)}
                  placeholder={language === 'he' || language === 'yi' ? 'לדוגמה: שולחן דף היומי 5 מקומות' : 'e.g. Daf Yomi 5-Seater'}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Top Seats */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="font-bold text-[10px] uppercase text-slate-600 block">
                    {language === 'he' || language === 'yi' ? 'מקומות בצד עליון' : 'Top Side Seats'}
                  </span>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCustomTopSeats(prev => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm text-slate-900">{customTopSeats}</span>
                    <button
                      type="button"
                      onClick={() => setCustomTopSeats(prev => Math.min(10, prev + 1))}
                      className="w-7 h-7 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Bottom Seats */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="font-bold text-[10px] uppercase text-slate-600 block">
                    {language === 'he' || language === 'yi' ? 'מקומות בצד תחתון' : 'Bottom Side Seats'}
                  </span>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCustomBottomSeats(prev => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm text-slate-900">{customBottomSeats}</span>
                    <button
                      type="button"
                      onClick={() => setCustomBottomSeats(prev => Math.min(10, prev + 1))}
                      className="w-7 h-7 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Orientation */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700">
                  {language === 'he' || language === 'yi' ? 'כיוון שולחן:' : 'Orientation:'}
                </span>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => setCustomOrientation('horizontal')}
                    className={`px-2.5 py-1 rounded font-bold text-xs cursor-pointer ${
                      customOrientation === 'horizontal' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-white text-slate-700'
                    }`}
                  >
                    {language === 'he' || language === 'yi' ? 'אופקי' : 'Horizontal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomOrientation('vertical')}
                    className={`px-2.5 py-1 rounded font-bold text-xs cursor-pointer ${
                      customOrientation === 'vertical' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-white text-slate-700'
                    }`}
                  >
                    {language === 'he' || language === 'yi' ? 'אנכי' : 'Vertical'}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveCustomTablePreset(true)}
                  className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  {language === 'he' || language === 'yi' ? 'הוסף ללוח ושמור תבנית' : 'Drop on Canvas & Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Help Modal */}
        {showShortcutsHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xl max-w-sm w-full space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Keyboard className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    {language === 'he' || language === 'yi' ? 'קיצורי מקשים בסטודיו' : 'Studio Keyboard Shortcuts'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowShortcutsHelp(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-slate-700">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="font-medium">{t('undo', 'Undo')}</span>
                  <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px]">Ctrl + Z</kbd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="font-medium">{t('redo', 'Redo')}</span>
                  <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px]">Ctrl + Y / Ctrl + Shift + Z</kbd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="font-medium">
                    {language === 'he' || language === 'yi' ? 'שכפול שולחן / מושב / ארון / בימה' : 'Duplicate Table / Seat / Ark / Bimah'}
                  </span>
                  <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px]">Ctrl + D</kbd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="font-medium">
                    {language === 'he' || language === 'yi' ? 'מחיקת הפריט הנבחר' : 'Delete Selected'}
                  </span>
                  <kbd className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded font-mono font-bold text-[10px]">Delete / Backspace</kbd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="font-medium">
                    {language === 'he' || language === 'yi' ? 'הזזה עדינה של פריט' : 'Nudge Item'}
                  </span>
                  <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px]">
                    {language === 'he' || language === 'yi' ? 'מקשי חיצים' : 'Arrow Keys'}
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="font-medium">
                    {language === 'he' || language === 'yi' ? 'ביטול בחירה' : 'Deselect'}
                  </span>
                  <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px]">Escape</kbd>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowShortcutsHelp(false)}
                  className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  {language === 'he' || language === 'yi' ? 'הבנתי' : 'Got It'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
