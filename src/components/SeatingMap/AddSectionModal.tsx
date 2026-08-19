import React, { useState } from 'react';
import { ShulSection, Seat, LayoutElement } from '../../types/shul';
import { X, Plus, Edit2, Check, LayoutGrid, Layers, Trash2 } from 'lucide-react';
import { useI18n } from '../../utils/i18n';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSection: (section: ShulSection, initialTemplate?: 'empty' | '5_seater_tables' | 'chavrusa_2_3' | 'tables_shtenders' | 'pew_rows') => void;
  editingSection?: ShulSection | null;
  onDeleteSection?: (sectionId: string) => void;
  existingSectionsCount: number;
}

const SECTION_COLOR_PALETTE = [
  { label: 'Royal Blue', value: '#2563eb' },
  { label: 'Warm Amber', value: '#d97706' },
  { label: 'Emerald Forest', value: '#059669' },
  { label: 'Deep Purple', value: '#9333ea' },
  { label: 'Rose Wine', value: '#e11d48' },
  { label: 'Indigo Navy', value: '#4f46e5' },
  { label: 'Teal Green', value: '#0d9488' },
  { label: 'Dignified Slate', value: '#475569' }
];

export const AddSectionModal: React.FC<AddSectionModalProps> = ({
  isOpen,
  onClose,
  onSaveSection,
  editingSection,
  onDeleteSection,
  existingSectionsCount
}) => {
  const { t, language } = useI18n();
  const isHeb = language === 'he' || language === 'yi';

  const [name, setName] = useState(editingSection?.name || '');
  const [hebrewName, setHebrewName] = useState(editingSection?.hebrewName || '');
  const [floor, setFloor] = useState(editingSection?.floor || 'Ground Floor');
  const [capacity, setCapacity] = useState(editingSection?.capacity || 60);
  const [color, setColor] = useState(editingSection?.color || '#2563eb');
  const [description, setDescription] = useState(editingSection?.description || '');
  const [template, setTemplate] = useState<'empty' | '5_seater_tables' | 'chavrusa_2_3' | 'tables_shtenders' | 'pew_rows'>('5_seater_tables');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const sectionId = editingSection?.id || `section_${Date.now()}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15)}`;

    const sectionData: ShulSection = {
      id: sectionId,
      name: name.trim(),
      hebrewName: hebrewName.trim() || name.trim(),
      floor,
      capacity: Number(capacity) || 50,
      color,
      description: description.trim() || `Sanctuary section: ${name.trim()}`
    };

    onSaveSection(sectionData, editingSection ? undefined : template);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 text-slate-800 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              {editingSection ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {editingSection
                  ? (isHeb ? 'עריכת אגף / אזור' : 'Edit Sanctuary Section')
                  : (isHeb ? 'הוספת אגף / מתחם חדש' : 'Add New Sanctuary Section')}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isHeb
                  ? 'הגדרת קומות, אגפי לימוד, שולחנות רב-מושביים ועזרת נשים.'
                  : 'Configure floor zones, study wings, and custom multi-seater areas.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Section Name & Hebrew Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                {isHeb ? 'שם האגף (אנגלית)' : 'Section Name (English) *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isHeb ? 'למשל Beis Midrash North' : 'e.g. North Hall 5-Seater Tables'}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                {isHeb ? 'שם בעברית *' : 'Hebrew Name (שם בעברית)'}
              </label>
              <input
                type="text"
                dir="rtl"
                value={hebrewName}
                onChange={(e) => setHebrewName(e.target.value)}
                placeholder={isHeb ? 'לדוג׳ בית מדרש שולחנות 5 מקומות' : 'לדוג׳ בית מדרש שולחנות 5 מקומות'}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
              />
            </div>
          </div>

          {/* Floor & Capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                {isHeb ? 'קומה / מפלס' : 'Floor / Wing Level'}
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Ground Floor">{isHeb ? 'קומת קרקע / אולם ראשי' : 'Ground Floor'}</option>
                <option value="Balcony / 2nd Floor">{isHeb ? 'יציע / עזרת נשים קומה ב׳' : 'Balcony / 2nd Floor'}</option>
                <option value="East Annex Wing">{isHeb ? 'אגף מזרחי' : 'East Annex Wing'}</option>
                <option value="West Study Hall">{isHeb ? 'בית מדרש מערבי' : 'West Study Hall'}</option>
                <option value="Basement Beis Midrash">{isHeb ? 'אולם מרתף / שטיבלך' : 'Basement Beis Midrash'}</option>
                <option value="Mezzanine">{isHeb ? 'גלריה / מפלס ביניים' : 'Mezzanine'}</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                {isHeb ? 'יעד קיבולת מושבים' : 'Target Capacity (Seats)'}
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Theme Color */}
          <div>
            <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1.5">
              {isHeb ? 'צבע זיהוי לאגף' : 'Section Theme Color'}
            </label>
            <div className="flex flex-wrap gap-2">
              {SECTION_COLOR_PALETTE.map((pal) => (
                <button
                  type="button"
                  key={pal.value}
                  onClick={() => setColor(pal.value)}
                  className={`w-7 h-7 rounded-full border-2 transition flex items-center justify-center cursor-pointer ${
                    color === pal.value ? 'border-slate-900 scale-110 shadow-sm ring-2 ring-slate-400' : 'border-white hover:scale-105'
                  }`}
                  style={{ backgroundColor: pal.value }}
                  title={pal.label}
                >
                  {color === pal.value && <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                </button>
              ))}
            </div>
          </div>

          {/* Initial Seating Preset Template (Only when creating new section) */}
          {!editingSection && (
            <div>
              <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1.5">
                {isHeb ? 'תבנית סידור ראשונית לאגף' : 'Initial Seating Layout Archetype'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div
                  onClick={() => setTemplate('5_seater_tables')}
                  className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start space-x-2 rtl:space-x-reverse ${
                    template === '5_seater_tables'
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 text-blue-900'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 border-blue-500">
                    {template === '5_seater_tables' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <div>
                    <span className="font-bold block text-xs">
                      {isHeb ? 'שולחנות 5 מקומות' : '5-Seater Tables'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isHeb ? 'שולחנות לימוד דף היומי של 5 מקומות' : '3 north + 2 south chairs with Daf Yomi tables'}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setTemplate('chavrusa_2_3')}
                  className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start space-x-2 rtl:space-x-reverse ${
                    template === 'chavrusa_2_3'
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 text-blue-900'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 border-blue-500">
                    {template === 'chavrusa_2_3' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <div>
                    <span className="font-bold block text-xs">
                      {isHeb ? 'שולחנות 2 ו-3 מקומות' : '2 & 3-Seater Study Tables'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isHeb ? 'שולחנות חברותא זוגיים ושלשות' : 'Chavrusa pairs & 3-chair study desks'}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setTemplate('tables_shtenders')}
                  className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start space-x-2 rtl:space-x-reverse ${
                    template === 'tables_shtenders'
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 text-blue-900'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 border-blue-500">
                    {template === 'tables_shtenders' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <div>
                    <span className="font-bold block text-xs">
                      {isHeb ? 'שולחנות וסטנדרים' : 'Tables & Shtenders'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isHeb ? 'שילוב שולחנות לימוד ועמודי סטנדר אישיים' : 'Combination of tables and standing shtenders'}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setTemplate('empty')}
                  className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start space-x-2 rtl:space-x-reverse ${
                    template === 'empty'
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 text-blue-900'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 border-blue-500">
                    {template === 'empty' && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <div>
                    <span className="font-bold block text-xs">
                      {isHeb ? 'התחל ריק (עיצוב חופשי)' : 'Start Blank'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isHeb ? 'לוח ריק לבנייה בהתאמה אישית' : 'Empty floor plan to design from scratch'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {editingSection && onDeleteSection && existingSectionsCount > 1 ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(isHeb ? `האם אתה בטוח שברצונך למחוק את "${editingSection.hebrewName || editingSection.name}" ואת כל המושבים שבו?` : `Are you sure you want to delete "${editingSection.name}" and all its seats?`)) {
                    onDeleteSection(editingSection.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center space-x-1 rtl:space-x-reverse cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isHeb ? 'מחק אגף' : 'Delete Section'}</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                {isHeb ? 'ביטול' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                {editingSection
                  ? (isHeb ? 'שמור שינויים' : 'Save Changes')
                  : (isHeb ? 'צור אגף חדש' : 'Create Section')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
