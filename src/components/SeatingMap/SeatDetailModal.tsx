import React, { useState } from 'react';
import { X, User, DollarSign, BookOpen, CheckCircle, ShieldAlert, Sparkles, Phone, Mail, CreditCard } from 'lucide-react';
import { Seat, Member, ShulEvent } from '../../types/shul';
import { formatCurrency } from '../../utils/hebrewCalendar';
import { useI18n } from '../../utils/i18n';

interface SeatDetailModalProps {
  seat: Seat | null;
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onSaveSeat: (updatedSeat: Seat) => void;
  onToggleCart: (seat: Seat) => void;
  isInCart: boolean;
  activeEvent: ShulEvent;
}

export const SeatDetailModal: React.FC<SeatDetailModalProps> = ({
  seat,
  isOpen,
  onClose,
  members,
  onSaveSeat,
  onToggleCart,
  isInCart,
  activeEvent
}) => {
  const { t, language } = useI18n();
  const isHeb = language === 'he' || language === 'yi';

  if (!isOpen || !seat) return null;

  const [editMode, setEditMode] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(seat.reservedForMemberId || '');
  const [customName, setCustomName] = useState(seat.reservedForMemberName || '');
  const [customHebrewName, setCustomHebrewName] = useState(seat.reservedForHebrewName || '');
  const [price, setPrice] = useState(seat.price || 180);
  const [tier, setTier] = useState(seat.tier);
  const [hasShtender, setHasShtender] = useState(!!seat.hasShtender);
  const [isAccessible, setIsAccessible] = useState(!!seat.isAccessible);
  const [notes, setNotes] = useState(seat.reservationNotes || '');
  const [status, setStatus] = useState(seat.status);

  const handleMemberSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
    if (!memberId) {
      setCustomName('');
      setCustomHebrewName('');
      return;
    }
    const member = members.find(m => m.id === memberId);
    if (member) {
      setCustomName(`${member.firstName} ${member.lastName}`);
      setCustomHebrewName(member.hebrewName);
    }
  };

  const handleSave = () => {
    const isNowReserved = (customName.trim().length > 0 || selectedMemberId.length > 0) && status !== 'blocked';
    const updatedSeat: Seat = {
      ...seat,
      tier,
      price: Number(price),
      hasShtender,
      isAccessible,
      reservationNotes: notes,
      status: status === 'blocked' ? 'blocked' : (isNowReserved ? 'reserved' : 'available'),
      reservedForMemberId: selectedMemberId || undefined,
      reservedForMemberName: customName.trim() || undefined,
      reservedForHebrewName: customHebrewName.trim() || undefined
    };
    onSaveSeat(updatedSeat);
    setEditMode(false);
    onClose();
  };

  const handleRelease = () => {
    const releasedSeat: Seat = {
      ...seat,
      status: 'available',
      reservedForMemberId: undefined,
      reservedForMemberName: undefined,
      reservedForHebrewName: undefined,
      reservationNotes: undefined
    };
    onSaveSeat(releasedSeat);
    setEditMode(false);
    onClose();
  };

  const assignedMember = members.find(m => m.id === seat.reservedForMemberId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-800">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-mono font-bold text-xs shadow-xs">
              {seat.code}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {t('seat_code')}: {seat.code}
                <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                  seat.status === 'reserved'
                    ? 'bg-blue-100 text-blue-700'
                    : seat.status === 'blocked'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {t(`status_${seat.status}`, seat.status)}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {t('row')} {seat.row} • #{seat.number} • {t(`section_${seat.sectionId}`, seat.sectionId)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {!editMode ? (
            <>
              {/* Current Occupant Details */}
              {seat.status === 'reserved' ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {t('assigned_to')}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">
                        {seat.reservedForMemberName}
                      </h4>
                      {seat.reservedForHebrewName && (
                        <p className="text-xs font-serif text-slate-700 font-semibold dir-rtl">
                          {seat.reservedForHebrewName}
                        </p>
                      )}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                      {seat.reservedForMemberName?.substring(0, 2).toUpperCase() || 'KM'}
                    </div>
                  </div>

                  {assignedMember && (
                    <div className="pt-2.5 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{assignedMember.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-slate-600 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{assignedMember.email}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-between text-xs pt-1">
                        <span>
                          {isHeb ? 'חברות:' : 'Membership:'} <strong className="text-slate-800">{assignedMember.membershipTier}</strong>
                        </span>
                        {assignedMember.isDuesPaid ? (
                          <span className="text-[11px] font-bold text-emerald-600">
                            {isHeb ? '✓ דמי חבר שולמו במלואם' : '✓ Dues Paid in Full'}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-600">
                            {isHeb
                              ? `⚠️ יתרת תשלום (${formatCurrency(assignedMember.annualDuesAmount - assignedMember.duesPaidAmount)})`
                              : `⚠️ Balance Due ($${assignedMember.annualDuesAmount - assignedMember.duesPaidAmount})`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {seat.reservationNotes && (
                    <div className="text-xs bg-white p-2.5 rounded border border-slate-200 text-slate-700 italic">
                      {isHeb ? 'הערות גבאי:' : 'Notes:'} "{seat.reservationNotes}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3.5 text-center space-y-1">
                  <span className="text-blue-800 font-bold text-xs">{t('status_available')}</span>
                  <p className="text-[11px] text-slate-500">
                    {isHeb
                      ? `פנוי להקצאת מקומות עבור ${activeEvent.titleHe || activeEvent.title}.`
                      : `Available for ${activeEvent.title} seat allocations.`}
                  </p>
                </div>
              )}

              {/* Seat Specs Grid */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">{t('tier')}</span>
                  <p className="font-bold text-slate-800 mt-0.5 capitalize">{t(`tier_${seat.tier}`, seat.tier)}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">{t('price')}</span>
                  <p className="font-bold text-blue-600 mt-0.5">{formatCurrency(seat.price)}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    {isHeb ? 'ציוד' : 'Equipment'}
                  </span>
                  <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                    {seat.hasShtender ? `📖 ${t('shtender')}` : (isHeb ? 'כסא' : 'Chair')}
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Edit / Reassign Mode Form */
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold text-[11px] mb-1 uppercase tracking-wider">
                  {isHeb ? 'בחירת חבר ממאגר בית הכנסת (סנכרון)' : 'Select Shul Member (Database Sync)'}
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => handleMemberSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">{isHeb ? '-- אורח / ללא שיוך לחבר קבוע --' : '-- Non-Member / Custom Guest --'}</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {isHeb ? `${m.hebrewName || m.lastName + ' ' + m.firstName} (${m.membershipTier})` : `${m.lastName}, ${m.firstName} (${m.hebrewName}) - ${m.membershipTier}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold text-[11px] mb-1 uppercase tracking-wider">
                    {isHeb ? 'שם באנגלית' : 'English Name'}
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={isHeb ? 'למשל Abraham Goldberg' : 'e.g. Abraham Goldberg'}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-[11px] mb-1 uppercase tracking-wider">
                    {isHeb ? 'שם מלא בעברית לתפילה' : 'Hebrew Name (שם בעברית)'}
                  </label>
                  <input
                    type="text"
                    value={customHebrewName}
                    onChange={(e) => setCustomHebrewName(e.target.value)}
                    placeholder="אברהם בן יצחק הלוי"
                    dir="rtl"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-serif"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] mb-1 uppercase">{t('tier')}</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize text-xs"
                  >
                    <option value="mizrach">{t('tier_mizrach')}</option>
                    <option value="vip">{t('tier_vip')}</option>
                    <option value="premium">{t('tier_premium')}</option>
                    <option value="standard">{t('tier_standard')}</option>
                    <option value="accessible">{t('tier_accessible')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] mb-1 uppercase">{t('price')} ($)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] mb-1 uppercase">
                    {isHeb ? 'סטטוס' : 'Status'}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  >
                    <option value="available">{t('status_available')}</option>
                    <option value="reserved">{t('status_reserved')}</option>
                    <option value="blocked">{t('status_blocked')}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4 rtl:space-x-reverse pt-1">
                <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasShtender}
                    onChange={(e) => setHasShtender(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-slate-700 font-medium">{t('has_shtender')}</span>
                </label>

                <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAccessible}
                    onChange={(e) => setIsAccessible(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-slate-700 font-medium">{isHeb ? '♿ נגיש' : 'Accessible'}</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-[10px] mb-1 uppercase">
                  {isHeb ? 'הערות גבאי פרטיות' : 'Gabbai Private Notes'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder={isHeb ? 'לדוגמה: שילם במזומן לגבאי, מבקש מושב קרוב לשביל' : 'e.g. Paid cash to Gabbai, needs front aisle'}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {!editMode ? (
            <>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => setEditMode(true)}
                  className="px-3 py-1.5 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {isHeb ? 'עריכה / שיוך מחדש' : `${t('edit_member')} / Reassign`}
                </button>
                {seat.status === 'reserved' && (
                  <button
                    onClick={handleRelease}
                    className="px-3 py-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer"
                  >
                    {isHeb ? 'שחרר מושב' : 'Release Seat'}
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => onToggleCart(seat)}
                  className={`px-4 py-1.5 rounded text-xs font-bold transition shadow-xs cursor-pointer ${
                    isInCart
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <span>
                    {isInCart
                      ? (isHeb ? 'הסר מההזמנה' : 'Remove from Cart')
                      : (isHeb ? 'בחר להזמנה' : 'Select for Cart')}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition cursor-pointer"
              >
                {isHeb ? 'ביטול' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                {t('save_seat_changes')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
