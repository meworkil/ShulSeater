import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Check, 
  Crown, 
  BookOpen, 
  Compass, 
  Maximize2, 
  Minimize2,
  Layers,
  ArrowRight,
  Filter,
  DollarSign,
  Mail,
  User,
  AlertCircle,
  Eye,
  Crosshair,
  CheckSquare,
  Square,
  Sparkles
} from 'lucide-react';
import { Seat, LayoutElement, SectionType, ShulSection, Member, ShulEvent } from '../../types/shul';
import { SeatLegend } from './SeatLegend';
import { SeatDetailModal } from './SeatDetailModal';
import { formatCurrency } from '../../utils/hebrewCalendar';
import { useI18n } from '../../utils/i18n';

interface SeatingCanvasProps {
  seats: Seat[];
  elements: LayoutElement[];
  sections: ShulSection[];
  activeEvent: ShulEvent;
  members: Member[];
  onUpdateSeat: (updatedSeat: Seat) => void;
  onStartReservation: () => void;
}

export const SeatingCanvas: React.FC<SeatingCanvasProps> = ({
  seats,
  elements,
  sections,
  activeEvent,
  members,
  onUpdateSeat,
  onStartReservation
}) => {
  const { t, language, dir } = useI18n();

  const [currentSectionId, setCurrentSectionId] = useState<SectionType>('mens_main');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [showOccupancy, setShowOccupancy] = useState(true);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);

  // Multi-seat marquee/bulk selection
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter seats and elements by current section
  const sectionSeats = useMemo(() => {
    return seats.filter(s => s.sectionId === currentSectionId);
  }, [seats, currentSectionId]);

  const sectionElements = useMemo(() => {
    return elements.filter(e => e.sectionId === currentSectionId);
  }, [elements, currentSectionId]);

  // Ensure currentSectionId is always valid when sections are modified
  useEffect(() => {
    if (sections.length > 0 && !sections.some(s => s.id === currentSectionId)) {
      setCurrentSectionId(sections[0].id);
    }
  }, [sections, currentSectionId]);

  const currentSection = sections.find(s => s.id === currentSectionId) || sections[0] || {
    id: 'mens_main',
    name: "Men's Main Sanctuary",
    hebrewName: 'בית הכנסת הגדול',
    capacity: 120,
    floor: 'Ground Floor',
    color: '#2563eb'
  };

  // Calculate layout bounds for extreme/large sanctuary scaling
  const layoutBounds = useMemo(() => {
    let minX = 0, maxX = 1100, minY = 0, maxY = 800;
    sectionSeats.forEach(s => {
      if (s.x > maxX - 100) maxX = s.x + 120;
      if (s.y > maxY - 100) maxY = s.y + 120;
    });
    sectionElements.forEach(e => {
      if (e.x + e.width > maxX) maxX = e.x + e.width + 60;
      if (e.y + e.height > maxY) maxY = e.y + e.height + 60;
    });
    return { width: Math.max(maxX, 1200), height: Math.max(maxY, 850) };
  }, [sectionSeats, sectionElements]);

  // Statistics for this section
  const stats = useMemo(() => {
    const total = sectionSeats.length;
    const reserved = sectionSeats.filter(s => s.status === 'reserved').length;
    const available = total - reserved;
    const mizrach = sectionSeats.filter(s => s.tier === 'mizrach').length;
    const shtenders = sectionSeats.filter(s => s.hasShtender).length;
    const occupancyPercent = total > 0 ? Math.round((reserved / total) * 100) : 0;
    const totalRevenue = sectionSeats.filter(s => s.status === 'reserved').reduce((acc, s) => acc + s.price, 0);
    return { total, reserved, available, mizrach, shtenders, occupancyPercent, totalRevenue };
  }, [sectionSeats]);

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(Number((prev + 0.15).toFixed(2)), 3.0));
  const handleZoomOut = () => setZoom(prev => Math.max(Number((prev - 0.15).toFixed(2)), 0.25));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 40, y: 30 });
  };
  const handleFitToView = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const scaleX = (containerWidth - 60) / layoutBounds.width;
      const scaleY = (containerHeight - 60) / layoutBounds.height;
      const fitScale = Math.min(scaleX, scaleY, 1.2);
      setZoom(Number(Math.max(fitScale, 0.3).toFixed(2)));
      setPan({ x: 20, y: 20 });
    }
  };

  // Canvas Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === 'seating-canvas-bg' || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Quick Jump to Seat
  const handleJumpToSeat = (seat: Seat) => {
    setSelectedSeat(seat);
    if (containerRef.current) {
      const targetX = -seat.x * zoom + containerRef.current.clientWidth / 2 - 30;
      const targetY = -seat.y * zoom + containerRef.current.clientHeight / 2 - 30;
      setPan({ x: targetX, y: targetY });
    }
  };

  // Matching search set
  const matchingSeatIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase().trim();
    const matches = sectionSeats.filter(s => 
      s.code.toLowerCase().includes(q) ||
      (s.reservedForMemberName && s.reservedForMemberName.toLowerCase().includes(q)) ||
      (s.reservedForHebrewName && s.reservedForHebrewName.includes(q)) ||
      (s.row.toLowerCase() === q)
    );
    return new Set(matches.map(m => m.id));
  }, [searchQuery, sectionSeats]);

  // Bulk actions
  const handleBulkStatusChange = (status: 'available' | 'reserved') => {
    selectedSeatIds.forEach(id => {
      const s = seats.find(x => x.id === id);
      if (s) {
        onUpdateSeat({
          ...s,
          status,
          reservedForMemberName: status === 'available' ? undefined : s.reservedForMemberName
        });
      }
    });
    setSelectedSeatIds([]);
  };

  const handleBulkShtenderToggle = () => {
    selectedSeatIds.forEach(id => {
      const s = seats.find(x => x.id === id);
      if (s) {
        onUpdateSeat({ ...s, hasShtender: !s.hasShtender });
      }
    });
    setSelectedSeatIds([]);
  };

  // Selected or first reserved seat for inspector sidebar
  const activeInspectorSeat = selectedSeat || (sectionSeats.find(s => s.status === 'reserved') || sectionSeats[0]);
  const assignedMember = members.find(m => m.id === activeInspectorSeat?.reservedForMemberId);

  return (
    <div className="flex flex-col h-[calc(100vh-84px)] bg-[#F1F5F9] font-sans text-slate-900 overflow-hidden">
      {/* High Density Sub-Header Bar */}
      <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm sm:text-base font-bold text-slate-800">
            {t('tab_seating_map')}: {(language === 'he' || language === 'yi') && activeEvent.hebrewTitle ? activeEvent.hebrewTitle : activeEvent.title}
          </h1>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider">
            {(language === 'he' || language === 'yi') && currentSection.hebrewName ? currentSection.hebrewName : t(`section_${currentSection.id}`, currentSection.name)}
          </span>
        </div>

        {/* Section Switcher & Quick Search */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 overflow-x-auto max-w-md xl:max-w-2xl">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => {
                  setCurrentSectionId(sec.id);
                  setSelectedSeat(null);
                  setSelectedSeatIds([]);
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-1 ${
                  currentSectionId === sec.id
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: sec.color || '#2563eb' }}
                />
                <span>
                  {(language === 'he' || language === 'yi') && sec.hebrewName 
                    ? sec.hebrewName.split('-')[0].trim() 
                    : sec.name.split('(')[0].trim()}
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              className="pl-8 rtl:pr-8 rtl:pl-3 pr-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs w-48 sm:w-60 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 rtl:right-2.5 rtl:left-auto top-2" />
          </div>

          <button
            onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
            className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${
              isMultiSelectMode ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isMultiSelectMode ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            <span>{t('bulk_select_mode')}</span>
          </button>

          <button
            onClick={onStartReservation}
            className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 shadow-xs transition"
          >
            + {t('tab_reservations')}
          </button>
        </div>
      </div>

      {/* Multi-Select Floating Toolbar */}
      {isMultiSelectMode && selectedSeatIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between shadow-md border-b border-slate-800 text-xs animate-fade-in shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400">
              {selectedSeatIds.length} {t('selected_count')}
            </span>
            <span className="text-slate-400">({selectedSeatIds.map(id => seats.find(s => s.id === id)?.code).filter(Boolean).slice(0, 5).join(', ')}{selectedSeatIds.length > 5 ? '...' : ''})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange('reserved')}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs"
            >
              {t('mark_reserved')}
            </button>
            <button
              onClick={() => handleBulkStatusChange('available')}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs"
            >
              {t('mark_available')}
            </button>
            <button
              onClick={handleBulkShtenderToggle}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-bold text-xs"
            >
              ± {t('shtender')}
            </button>
            <button
              onClick={() => setSelectedSeatIds([])}
              className="px-2 py-1 text-slate-400 hover:text-white text-xs"
            >
              {t('clear_selection')}
            </button>
          </div>
        </div>
      )}

      {/* Main 3-Column High-Density Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: VIEW CONTROLS & RADAR NAVIGATOR (w-60)                       */}
        {/* ========================================================================= */}
        <div className="w-60 border-r border-slate-200 bg-white p-3.5 flex flex-col gap-3.5 shrink-0 hidden md:flex overflow-y-auto text-xs">
          {/* Section Picker for mobile */}
          <div className="lg:hidden">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {t('sanctuary_section', 'Sanctuary Section')}
            </label>
            <select
              value={currentSectionId}
              onChange={(e) => setCurrentSectionId(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 font-semibold"
            >
              {sections.map(s => (
                <option key={s.id} value={s.id}>
                  {(language === 'he' || language === 'yi') && s.hebrewName ? s.hebrewName : t(`section_${s.id}`, s.name)}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Jump Search Results */}
          {searchQuery.trim() && (
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                {t('jump_to_seat')} ({matchingSeatIds.size} {t('matches', 'תוצאות')})
              </span>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {sectionSeats.filter(s => matchingSeatIds.has(s.id)).slice(0, 10).map(s => (
                  <div
                    key={s.id}
                    onClick={() => handleJumpToSeat(s)}
                    className="p-1.5 bg-white border border-slate-200 rounded text-[11px] cursor-pointer hover:border-blue-500 flex justify-between items-center"
                  >
                    <span className="font-bold text-slate-800">{s.code}</span>
                    <span className="text-slate-500 truncate max-w-[100px]">
                      {s.reservedForMemberName || t('status_available')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View Toggles */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {t('display_and_layers', 'Display & Layers')}
            </h3>
            <div className="space-y-1.5">
              <div 
                onClick={() => setShowOccupancy(!showOccupancy)}
                className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 cursor-pointer hover:bg-slate-100"
              >
                <span className="text-xs font-medium text-slate-700">{t('occupancy_rate')}</span>
                <div className={`w-7 h-3.5 rounded-full relative transition ${showOccupancy ? 'bg-blue-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition ${showOccupancy ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </div>

              <div 
                onClick={() => setHeatmapMode(!heatmapMode)}
                className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 cursor-pointer hover:bg-slate-100"
              >
                <span className="text-xs font-medium text-slate-700">{t('tier_pricing_heatmap', 'Tier Pricing Heatmap')}</span>
                <div className={`w-7 h-3.5 rounded-full relative transition ${heatmapMode ? 'bg-blue-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition ${heatmapMode ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </div>

              <div 
                onClick={() => setShowMiniMap(!showMiniMap)}
                className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 cursor-pointer hover:bg-slate-100"
              >
                <span className="text-xs font-medium text-slate-700">{t('mini_map')}</span>
                <div className={`w-7 h-3.5 rounded-full relative transition ${showMiniMap ? 'bg-blue-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition ${showMiniMap ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Radar Mini-Map Thumbnail */}
          {showMiniMap && (
            <div className="border border-slate-200 rounded p-2 bg-slate-50">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between items-center">
                <span>{t('mini_map')}</span>
                <span className="text-slate-400 font-mono">{Math.round(zoom * 100)}%</span>
              </div>
              <div 
                className="w-full h-28 bg-white border border-slate-300 rounded relative overflow-hidden cursor-crosshair shadow-inner"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickXRatio = (e.clientX - rect.left) / rect.width;
                  const clickYRatio = (e.clientY - rect.top) / rect.height;
                  setPan({
                    x: -clickXRatio * layoutBounds.width * zoom + 150,
                    y: -clickYRatio * layoutBounds.height * zoom + 150
                  });
                }}
              >
                {/* East Wall indicator */}
                <div className="absolute top-1 left-4 right-4 h-1 bg-blue-500 rounded" />
                {/* Seat Dots */}
                {sectionSeats.map(s => {
                  const xPct = (s.x / layoutBounds.width) * 100;
                  const yPct = (s.y / layoutBounds.height) * 100;
                  const color = s.status === 'reserved' ? '#2563eb' : s.tier === 'mizrach' ? '#0f172a' : '#94a3b8';
                  return (
                    <div
                      key={s.id}
                      style={{ left: `${xPct}%`, top: `${yPct}%`, backgroundColor: color }}
                      className="w-1 h-1 rounded-full absolute"
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Large Sanctuary Scale Metric */}
          <div className="mt-auto bg-blue-50 p-2.5 rounded border border-blue-100">
            <div className="text-[11px] font-bold text-blue-900 mb-0.5">
              {stats.total} {t('total_capacity')}
            </div>
            <p className="text-[10px] text-blue-700 leading-tight">
              {stats.reserved} {t('status_reserved')} ({stats.occupancyPercent}%) • {stats.available} {t('status_available')}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTER COLUMN: INTERACTIVE SANCTUARY MAP                                  */}
        {/* ========================================================================= */}
        <div className="flex-1 p-4 sm:p-5 relative bg-[#E2E8F0]/60 flex flex-col overflow-hidden">
          {/* Top Canvas Bar with Zoom & Status pills */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-white border border-slate-300 rounded-xs shadow-xs" />
                <span className="text-[10px] font-semibold text-slate-600">{t('status_available')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-600 rounded-xs shadow-xs" />
                <span className="text-[10px] font-semibold text-slate-600">{t('status_reserved')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-amber-400 rounded-xs shadow-xs" />
                <span className="text-[10px] font-semibold text-slate-600">{t('pending_dues', 'Pending Dues')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-slate-900 rounded-xs shadow-xs" />
                <span className="text-[10px] font-semibold text-slate-600">{t('tier_mizrach')}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomOut}
                className="bg-white px-2 py-1 text-xs font-semibold border border-slate-300 rounded shadow-xs hover:bg-slate-50 cursor-pointer"
                title={t('zoom_out')}
              >
                -
              </button>
              <span className="bg-white px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded text-slate-700 min-w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="bg-white px-2 py-1 text-xs font-semibold border border-slate-300 rounded shadow-xs hover:bg-slate-50 cursor-pointer"
                title={t('zoom_in')}
              >
                +
              </button>
              <button
                onClick={handleFitToView}
                className="bg-white px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded shadow-xs hover:bg-slate-50 ml-1 text-slate-600 cursor-pointer"
                title={t('zoom_fit')}
              >
                {t('zoom_fit')}
              </button>
              <button
                onClick={handleResetZoom}
                className="bg-white px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded shadow-xs hover:bg-slate-50 ml-1 text-slate-600 cursor-pointer"
                title={t('zoom_reset')}
              >
                {t('zoom_reset')}
              </button>
            </div>
          </div>

          {/* The Sanctuary Floor Canvas */}
          <div
            ref={containerRef}
            id="seating-canvas-bg"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="flex-1 bg-white rounded-xl shadow-inner border border-slate-300 p-6 flex flex-col items-center relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
          >
            {/* Subtle Grid dots */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle, #64748b 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0'
              }}
            />

            {/* Transform Stage */}
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                width: `${layoutBounds.width}px`,
                height: `${layoutBounds.height}px`,
                position: 'absolute',
                left: '20px',
                top: '20px'
              }}
            >
              {/* East Wall / Aron Kodesh Header */}
              <div className="w-[520px] h-11 bg-slate-100 border-b-4 border-blue-600 mb-10 flex items-center justify-center text-slate-600 font-bold uppercase tracking-[0.3em] text-xs mx-auto shadow-xs rounded-t">
                {t('aron_kodesh')} • {t('mizrach_wall')}
              </div>

              {/* Architectural Elements (Bimah, Amud, Mechitzas, Tables) */}
              {sectionElements.map((elem) => {
                if (elem.type === 'bimah') {
                  return (
                    <div
                      key={elem.id}
                      style={{
                        left: `${elem.x}px`,
                        top: `${elem.y}px`,
                        width: `${elem.width}px`,
                        height: `${elem.height}px`
                      }}
                      className="absolute bg-slate-100 border-x-2 border-slate-300 flex flex-col items-center justify-center text-[10px] font-bold text-slate-600 uppercase tracking-wider rounded-xs shadow-xs"
                    >
                      <span>{t('bimah')}</span>
                      <span className="text-[8px] font-serif opacity-70">בימה מרכזית</span>
                    </div>
                  );
                }

                if (elem.type === 'chazan_amud') {
                  return (
                    <div
                      key={elem.id}
                      style={{
                        left: `${elem.x}px`,
                        top: `${elem.y}px`,
                        width: `${elem.width}px`,
                        height: `${elem.height}px`
                      }}
                      className="absolute bg-slate-800 text-white border border-slate-900 flex flex-col items-center justify-center text-[8px] font-bold rounded-xs shadow-xs"
                    >
                      <span>{t('chazan_amud')}</span>
                    </div>
                  );
                }

                if (elem.type === 'mechitza') {
                  return (
                    <div
                      key={elem.id}
                      style={{
                        left: `${elem.x}px`,
                        top: `${elem.y}px`,
                        width: `${elem.width}px`,
                        height: `${elem.height}px`
                      }}
                      className="absolute border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 text-[10px] italic bg-slate-50/50"
                    >
                      ✦ {elem.label || t('mechitza')} ✦
                    </div>
                  );
                }

                if (elem.type === 'table') {
                  return (
                    <div
                      key={elem.id}
                      style={{
                        left: `${elem.x}px`,
                        top: `${elem.y}px`,
                        width: `${elem.width}px`,
                        height: `${elem.height}px`,
                        backgroundColor: elem.color ? `${elem.color}15` : '#f8fafc',
                        borderColor: elem.color || '#cbd5e1'
                      }}
                      className="absolute border-2 rounded-md flex flex-col items-center justify-center text-slate-800 text-center p-1 font-bold text-[10px] shadow-xs select-none"
                    >
                      <span className="truncate max-w-full font-bold">{elem.label || t('study_table')}</span>
                      {elem.hebrewLabel && (
                        <span className="text-[8px] font-serif text-slate-500 truncate max-w-full leading-tight">
                          {elem.hebrewLabel}
                        </span>
                      )}
                    </div>
                  );
                }

                if (elem.type === 'shtender') {
                  return (
                    <div
                      key={elem.id}
                      style={{
                        left: `${elem.x}px`,
                        top: `${elem.y}px`,
                        width: `${elem.width}px`,
                        height: `${elem.height}px`
                      }}
                      className="absolute bg-amber-800 border border-amber-950 rounded-xs flex items-center justify-center text-amber-100 text-[8px] font-bold shadow-xs select-none"
                      title={elem.label || 'Shtender'}
                    >
                      <span>📖</span>
                    </div>
                  );
                }

                return null;
              })}

              {/* Interactive High Density Seat Nodes */}
              {sectionSeats.map((seat) => {
                const isReserved = seat.status === 'reserved';
                const isSelected = selectedSeat?.id === seat.id;
                const isMultiSelected = selectedSeatIds.includes(seat.id);
                const isSearched = matchingSeatIds.has(seat.id);
                const assigned = members.find(m => m.id === seat.reservedForMemberId);
                const isOverdue = assigned && !assigned.isDuesPaid;

                // High Density Seat Colors & Heatmap
                let seatClasses = 'bg-white border border-slate-300 text-slate-800 hover:border-blue-400 hover:bg-blue-50/60 shadow-xs';
                
                if (heatmapMode) {
                  if (seat.tier === 'mizrach') seatClasses = 'bg-purple-700 text-white font-bold border border-purple-800';
                  else if (seat.tier === 'vip') seatClasses = 'bg-indigo-600 text-white font-bold border border-indigo-700';
                  else if (seat.tier === 'premium') seatClasses = 'bg-blue-500 text-white font-bold border border-blue-600';
                  else seatClasses = 'bg-emerald-600 text-white font-bold border border-emerald-700';
                } else {
                  if (isReserved) {
                    seatClasses = 'bg-blue-600 border border-blue-700 text-white shadow-xs';
                    if (isOverdue) {
                      seatClasses = 'bg-amber-400 border-2 border-amber-500 text-slate-950 font-bold shadow-xs';
                    }
                  } else if (seat.tier === 'mizrach') {
                    seatClasses = 'bg-slate-900 border border-slate-800 text-white shadow-xs';
                  }
                }

                if (isSelected || isMultiSelected) {
                  seatClasses += ' ring-2 ring-amber-500 scale-110 z-20';
                }

                if (isSearched) {
                  seatClasses += ' ring-2 ring-rose-500 bg-rose-50 animate-pulse';
                }

                const seatWidth = seat.width || 42;
                const seatHeight = seat.height || 38;

                return (
                  <div
                    key={seat.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMultiSelectMode) {
                        setSelectedSeatIds(prev =>
                          prev.includes(seat.id)
                            ? prev.filter(x => x !== seat.id)
                            : [...prev, seat.id]
                        );
                      } else {
                        setSelectedSeat(seat);
                      }
                    }}
                    onMouseEnter={() => setHoveredSeat(seat)}
                    onMouseLeave={() => setHoveredSeat(null)}
                    style={{
                      left: `${seat.x}px`,
                      top: `${seat.y}px`,
                      width: `${seatWidth}px`,
                      height: `${seatHeight}px`
                    }}
                    className={`absolute rounded-xs cursor-pointer flex flex-col items-center justify-between p-1 transition-all text-center ${seatClasses}`}
                    title={`${seat.code}: ${isReserved ? seat.reservedForMemberName : 'Available ($' + seat.price + ')'}`}
                  >
                    <div className="w-full flex items-center justify-between text-[8px] font-bold leading-none">
                      <span>{seat.number}</span>
                      {seat.hasShtender && <span className="text-[7px]">📖</span>}
                    </div>

                    <div className="w-full text-[8px] font-semibold truncate leading-none">
                      {isReserved ? (
                        seat.reservedForMemberName?.split(' ')[0] || 'Res'
                      ) : (
                        `$${seat.price}`
                      )}
                    </div>

                    <span className="text-[7px] font-mono opacity-60 leading-none">
                      {seat.row}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: HIGH DENSITY SEAT DETAIL INSPECTOR (w-72)                    */}
        {/* ========================================================================= */}
        <div className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 text-xs">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">
                {t('seat_code')}: {activeInspectorSeat?.code || 'Select Seat'}
              </h2>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                {t(`section_${currentSection.id}`, currentSection.name)} • {t('row')} {activeInspectorSeat?.row || 'A'}
              </span>
            </div>
            {activeInspectorSeat && (
              <button
                onClick={() => setIsDetailModalOpen(true)}
                className="px-2 py-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-[10px] font-bold text-slate-700 shadow-xs"
              >
                {t('edit_member')}
              </button>
            )}
          </div>

          {/* Inspector Content */}
          {activeInspectorSeat ? (
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5">
              {/* Current Occupant Card */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {t('assigned_to')}
                </label>
                <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded border border-slate-100">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                    {activeInspectorSeat.reservedForMemberName?.substring(0, 2).toUpperCase() || 'KM'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {activeInspectorSeat.reservedForMemberName || t('status_available')}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate font-serif">
                      {activeInspectorSeat.reservedForHebrewName || (assignedMember ? `Member #${assignedMember.id}` : t('status_available'))}
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${activeInspectorSeat.status === 'reserved' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                </div>
              </div>

              {/* Financial Status */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {t('financials_title')}
                </label>
                <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">{t('dues_status')}:</span>
                    <span className="font-bold text-slate-800">
                      {assignedMember ? formatCurrency(assignedMember.annualDuesAmount) : '$1,800.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">{t('price')}:</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(activeInspectorSeat.price)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-amber-600 font-bold pt-1 border-t border-slate-200">
                    <span>{t('dues_pending')}:</span>
                    <span>
                      {assignedMember 
                        ? formatCurrency(Math.max(0, assignedMember.annualDuesAmount - assignedMember.duesPaidAmount))
                        : '$0.00'
                      }
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(true)}
                  className="w-full mt-2 py-1.5 border border-blue-600 text-blue-600 text-xs font-bold rounded hover:bg-blue-50 transition cursor-pointer"
                >
                  {t('swap_seats')} / {t('save_seat_changes')}
                </button>
              </div>

              {/* Occupancy Stats in Section */}
              <div className="border-t border-slate-100 pt-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {t('tab_dashboard')}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100 text-center">
                    <div className="text-base font-bold text-slate-900">{stats.occupancyPercent}%</div>
                    <div className="text-[8px] uppercase font-bold text-slate-400">{t('occupancy_rate')}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100 text-center">
                    <div className="text-base font-bold text-slate-900">{formatCurrency(stats.totalRevenue)}</div>
                    <div className="text-[8px] uppercase font-bold text-slate-400">{t('total_revenue')}</div>
                  </div>
                </div>
              </div>

              {/* Seat Configuration */}
              <div className="border-t border-slate-100 pt-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {t('tier')} & Specs
                </label>
                <div className="space-y-2">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100 text-xs flex justify-between">
                    <span className="text-slate-600">Equipment:</span>
                    <span className="font-bold text-slate-800">
                      {activeInspectorSeat.hasShtender ? t('shtender') : 'Single Chair'}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100 text-xs flex justify-between">
                    <span className="text-slate-600">{t('tier')}:</span>
                    <span className="font-bold text-blue-600 uppercase">
                      {t(`tier_${activeInspectorSeat.tier}`, activeInspectorSeat.tier)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs">
              Click any seat on the canvas to inspect details
            </div>
          )}

          {/* Quick Action Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50">
            <button
              onClick={() => {
                if (activeInspectorSeat) {
                  setIsDetailModalOpen(true);
                }
              }}
              className="w-full py-2 bg-[#0F172A] text-white text-xs font-bold rounded shadow-xs hover:bg-slate-800 transition active:scale-98 cursor-pointer"
            >
              {t('seat_details_title')} ({activeInspectorSeat?.code})
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Compact Legend */}
      <div className="px-4 py-1.5 bg-white border-t border-slate-200 shrink-0">
        <SeatLegend
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterTier={filterTier}
          setFilterTier={setFilterTier}
          stats={stats}
        />
      </div>

      {/* Full Edit Modal */}
      <SeatDetailModal
        seat={activeInspectorSeat}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        members={members}
        onSaveSeat={(updated) => {
          onUpdateSeat(updated);
          setSelectedSeat(updated);
        }}
        onToggleCart={(s) => {
          onUpdateSeat({
            ...s,
            status: s.status === 'reserved' ? 'available' : 'reserved'
          });
          setIsDetailModalOpen(false);
        }}
        isInCart={false}
        activeEvent={activeEvent}
      />
    </div>
  );
};
