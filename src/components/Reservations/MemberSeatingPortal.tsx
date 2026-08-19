import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  CreditCard, 
  User, 
  Users, 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Download, 
  Printer, 
  Receipt,
  Heart,
  BookOpen,
  Calendar,
  Compass,
  Building,
  Check,
  Search,
  Lock,
  Phone,
  Mail,
  MapPin,
  HelpCircle,
  Clock,
  QrCode,
  Layers,
  ChevronRight,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Seat, Member, ShulEvent, Reservation, Transaction, ShulSection, LayoutElement, SectionType } from '../../types/shul';
import { formatCurrency, generateLabelQRUrl } from '../../utils/hebrewCalendar';
import { useI18n } from '../../utils/i18n';
import { ShulConfig } from '../../utils/storage';

interface MemberSeatingPortalProps {
  seats: Seat[];
  elements: LayoutElement[];
  sections: ShulSection[];
  activeEvent: ShulEvent;
  members: Member[];
  shulConfig?: ShulConfig;
  onCompleteReservation: (reservation: Reservation, transaction?: Transaction) => void;
  onSwitchToGabbaiMode?: () => void;
}

export const MemberSeatingPortal: React.FC<MemberSeatingPortalProps> = ({
  seats,
  elements,
  sections,
  activeEvent,
  members,
  shulConfig,
  onCompleteReservation,
  onSwitchToGabbaiMode
}) => {
  const { t, language } = useI18n();
  const isHeb = language === 'he' || language === 'yi';

  // Section Navigation
  const [activeSectionId, setActiveSectionId] = useState<SectionType>(sections[0]?.id || 'mens_main');

  // Step 1: Member Identification / Login
  const [loginMode, setLoginMode] = useState<'member_search' | 'guest_form'>('member_search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Guest fields
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestHebrewName, setGuestHebrewName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestAddress, setGuestAddress] = useState('');

  // Step 2: Selected Seats Cart
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [attendeeAllocations, setAttendeeAllocations] = useState<Record<string, { name: string; hebrewName: string; relationship: string }>>({});
  const [specialRequests, setSpecialRequests] = useState('');

  // Step 3: Optional Donations & Pledges
  const [includeMembershipDues, setIncludeMembershipDues] = useState(false);
  const [kolNidrePledge, setKolNidrePledge] = useState<number>(180);
  const [yizkorBookDonation, setYizkorBookDonation] = useState<number>(36);

  // Step 4: Payment Method Details
  const [paymentMethod, setPaymentMethod] = useState<'Credit Card' | 'Member Account' | 'Digital Wallet' | 'Check or Cash Pledge'>('Credit Card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardZip, setCardZip] = useState('');

  // Submission / Confirmation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);
  const [confirmedTransaction, setConfirmedTransaction] = useState<Transaction | null>(null);

  // Filtered members for login search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members.slice(0, 8);
    const q = searchQuery.toLowerCase().trim();
    return members.filter(m => 
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      (m.hebrewName && m.hebrewName.includes(q)) ||
      m.phone.includes(q) ||
      m.email.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [members, searchQuery]);

  const currentSection = sections.find(s => s.id === activeSectionId) || sections[0];
  const sectionSeats = useMemo(() => seats.filter(s => s.sectionId === activeSectionId), [seats, activeSectionId]);
  const sectionElements = useMemo(() => elements.filter(e => e.sectionId === activeSectionId), [elements, activeSectionId]);

  const selectedSeats = useMemo(() => seats.filter(s => selectedSeatIds.includes(s.id)), [seats, selectedSeatIds]);

  // Handle seat click (Toggles selection)
  const handleToggleSeat = (seat: Seat) => {
    if (seat.status === 'blocked' || (seat.status === 'reserved' && !selectedSeatIds.includes(seat.id))) {
      return; // Safe: cannot select already booked seats
    }

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds(prev => prev.filter(id => id !== seat.id));
      setAttendeeAllocations(prev => {
        const next = { ...prev };
        delete next[seat.id];
        return next;
      });
    } else {
      setSelectedSeatIds(prev => [...prev, seat.id]);
      // Default attendee name to current member or guest
      const defaultName = selectedMember 
        ? `${selectedMember.firstName} ${selectedMember.lastName}`
        : `${guestFirstName} ${guestLastName}`.trim();
      const defaultHebName = selectedMember?.hebrewName || guestHebrewName;

      setAttendeeAllocations(prev => ({
        ...prev,
        [seat.id]: {
          name: defaultName,
          hebrewName: defaultHebName,
          relationship: selectedSeatIds.length === 0 ? 'Self' : 'Family Member'
        }
      }));
    }
  };

  // Price calculations
  const seatsSubtotal = selectedSeats.reduce((acc, s) => acc + (s.price || 180), 0);
  const duesAmount = includeMembershipDues && selectedMember 
    ? Math.max(0, selectedMember.annualDuesAmount - selectedMember.duesPaidAmount) 
    : 0;
  const grandTotal = seatsSubtotal + duesAmount + Number(kolNidrePledge || 0) + Number(yizkorBookDonation || 0);

  // Submit and Pay
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSeats.length === 0) {
      alert(isHeb ? 'אנא בחר לפחות מקום ישיבה אחד במפה.' : 'Please select at least one seat on the seating map.');
      return;
    }

    const payerName = selectedMember 
      ? `${selectedMember.firstName} ${selectedMember.lastName}`
      : `${guestFirstName} ${guestLastName}`.trim();
    const payerHebrew = selectedMember?.hebrewName || guestHebrewName || payerName;
    const payerEmail = selectedMember?.email || guestEmail;
    const payerPhone = selectedMember?.phone || guestPhone;

    if (!payerName || !payerEmail) {
      alert(isHeb ? 'אנא מלא שם מלא וכתובת דוא"ל לקבלת אישור ההזמנה.' : 'Please enter your full name and email for the confirmation ticket.');
      return;
    }

    if (paymentMethod === 'Credit Card') {
      if (cardNumber.replace(/\s/g, '').length < 12) {
        alert(isHeb ? 'אנא הזן מספר כרטיס אשראי תקין.' : 'Please enter a valid credit card number.');
        return;
      }
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const reservationId = `res-${Date.now()}`;
      const transactionId = `tx-${Date.now()}`;
      const nowIso = new Date().toISOString().split('T')[0];

      const newReservation: Reservation = {
        id: reservationId,
        eventId: activeEvent.id,
        eventName: activeEvent.title,
        memberId: selectedMember?.id || 'guest',
        memberName: payerName,
        memberEmail: payerEmail,
        memberPhone: payerPhone,
        hebrewName: payerHebrew,
        seatIds: selectedSeats.map(s => s.id),
        seatCodes: selectedSeats.map(s => s.code),
        totalAmount: grandTotal,
        paidAmount: grandTotal,
        paymentStatus: paymentMethod === 'Check or Cash Pledge' ? 'unpaid' : 'paid',
        paymentMethod: paymentMethod === 'Check or Cash Pledge' ? 'Check' : 'Credit Card',
        transactionId,
        createdAt: nowIso,
        assignedBy: 'Online Portal',
        specialRequests
      };

      const newTransaction: Transaction = {
        id: transactionId,
        memberId: selectedMember?.id || 'guest',
        memberName: payerName,
        type: 'Holiday Seats',
        amount: grandTotal,
        date: nowIso,
        status: paymentMethod === 'Check or Cash Pledge' ? 'Pending' : 'Completed',
        paymentMethod: paymentMethod === 'Credit Card' ? `Credit Card (Stripe ****${cardNumber.slice(-4) || '4242'})` : paymentMethod,
        referenceNumber: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        receiptSent: true
      };

      onCompleteReservation(newReservation, newTransaction);
      setConfirmedReservation(newReservation);
      setConfirmedTransaction(newTransaction);
      setIsSubmitting(false);

      // Trigger Festive Confetti
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6']
      });
    }, 1200);
  };

  const shulTitle = shulConfig?.name || 'Congregation Beth Sholom';
  const shulHebTitle = shulConfig?.hebrewName || 'קהילת בית שלום';

  // Digital Ticket view once confirmed
  if (confirmedReservation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 font-sans">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {isHeb ? 'ההזמנה הושלמה בהצלחה! מקומותיכם שוריינו' : 'Seat Reservation Confirmed & Paid!'}
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            {isHeb 
              ? `אישור רשמי וכרטיס כניסה דיגיטלי נשלחו לכתובת ${confirmedReservation.memberEmail}. תזכו לשנים רבות וטובות!`
              : `A confirmation ticket and digital receipt have been issued for ${confirmedReservation.memberName}. We look forward to welcoming you!`}
          </p>
        </div>

        {/* Digital Boarding Pass Ticket */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-xl text-slate-800">
          <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 border-b-4 border-blue-600">
            <div>
              <span className="text-xs uppercase font-bold text-blue-400 tracking-widest block">
                {isHeb ? 'כרטיס כניסה רשמי לבית הכנסת' : 'Official Synagogue Entry Pass'}
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">
                {isHeb ? shulHebTitle : shulTitle}
              </h2>
              <p className="text-xs text-slate-300">
                {activeEvent.title} • {activeEvent.hebrewDate || 'תשפ״ז'}
              </p>
            </div>
            <div className="text-right rtl:text-left bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">{isHeb ? 'מספר קבלה' : 'Receipt Ref'}</span>
              <span className="font-mono text-sm font-bold text-blue-300">{confirmedTransaction?.referenceNumber}</span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{isHeb ? 'שם המתפלל' : 'Member / Attendee'}</span>
                  <p className="text-base font-bold text-slate-900">{confirmedReservation.memberName}</p>
                  {confirmedReservation.hebrewName && (
                    <p className="text-xs font-serif font-semibold text-slate-600">{confirmedReservation.hebrewName}</p>
                  )}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{isHeb ? 'אופן תשלום' : 'Payment Method'}</span>
                  <p className="text-sm font-bold text-slate-900">{confirmedReservation.paymentMethod}</p>
                  <span className="text-xs font-bold text-emerald-600">
                    {confirmedReservation.paymentStatus === 'paid' ? '✓ Paid in Full' : '⚠️ Pledge - Pending'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                  {isHeb ? 'מקומות הישיבה שהוקצו' : 'Reserved Seat Allocations'} ({confirmedReservation.seatCodes.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {confirmedReservation.seatCodes.map(code => (
                    <div key={code} className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-mono font-bold text-sm shadow-xs">
                      🪑 {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500 space-y-1">
                <p>• {isHeb ? 'אנא הצג כרטיס זה או מסור שמך לסדרן בכניסה.' : 'Please present this digital pass or your name to the usher at the entrance.'}</p>
                <p>• {isHeb ? 'תפילות החג יחלו בזמן הנקוב. שנה טובה ומתוקה!' : 'Services will commence promptly as scheduled. Shana Tova Umetukah!'}</p>
              </div>
            </div>

            {/* QR Code Verification */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
              <img 
                src={generateLabelQRUrl(confirmedReservation.seatCodes.join(','), confirmedReservation.memberName, confirmedReservation.eventId)}
                alt="Digital Pass QR"
                className="w-32 h-32 rounded-lg border border-slate-300 shadow-xs"
              />
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                {isHeb ? 'סריקת אימות מהירה' : 'Fast Usher Check-In'}
              </span>
            </div>
          </div>

          <div className="bg-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>{isHeb ? 'הדפס כרטיס וקבלה' : 'Print Ticket Pass'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmedReservation(null);
                setSelectedSeatIds([]);
              }}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              {isHeb ? 'הזמן מקומות נוספים' : 'Reserve Additional Seats'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner with Safe Mode Notice */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-5 sm:p-6 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="bg-blue-600/60 border border-blue-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {isHeb ? 'פורטל מתפללים מאובטח' : 'Member & Public Reservation Portal'}
            </span>
            <span className="flex items-center text-[11px] text-emerald-300 font-medium">
              <Lock className="w-3 h-3 mr-1 rtl:ml-1" />
              {isHeb ? 'מפה מאובטחת לבחירה בלבד (ללא שינוי מבנה)' : 'Safe Seating Map (Read-Only Layout)'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            {isHeb ? `הזמנת מקומות עבור ${activeEvent.hebrewTitle || activeEvent.title}` : `Reserve Seats for ${activeEvent.title}`}
          </h1>
          <p className="text-xs text-blue-200">
            {isHeb ? shulHebTitle : shulTitle} • {activeEvent.hebrewDate || 'תשפ״ז'} • {activeEvent.timeRange}
          </p>
        </div>

        {onSwitchToGabbaiMode && (
          <button
            type="button"
            onClick={onSwitchToGabbaiMode}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition cursor-pointer"
          >
            {isHeb ? 'חזור לתצוגת גבאי מלאה' : 'Switch to Gabbai Admin View'}
          </button>
        )}
      </div>

      {/* Main Grid: Left is Member Login & Safe Interactive Seating Map, Right is Order Summary & Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Member Login & Map (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">

          {/* 1. Member Login / Identification Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {isHeb ? 'שלב 1: זיהוי מתפלל / חבר קהילה' : 'Step 1: Member Identification or Guest Registration'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isHeb ? 'התחבר לאיתור המקום הקבוע שלך או המשך כאורח' : 'Log in to locate your reserved Makom Kavua, or register as a guest.'}
                  </p>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('member_search');
                  }}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    loginMode === 'member_search' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isHeb ? 'חבר קהילה רשום' : 'Shul Member'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('guest_form');
                    setSelectedMember(null);
                  }}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    loginMode === 'guest_form' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isHeb ? 'אורח חדש' : 'Guest / New'}
                </button>
              </div>
            </div>

            {loginMode === 'member_search' ? (
              <div className="space-y-3">
                {selectedMember ? (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {selectedMember.firstName[0]}{selectedMember.lastName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">
                            {selectedMember.firstName} {selectedMember.lastName}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-200 text-blue-800">
                            {selectedMember.membershipTier}
                          </span>
                        </div>
                        {selectedMember.hebrewName && (
                          <p className="text-xs font-serif font-semibold text-slate-700">
                            {selectedMember.hebrewName}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500">
                          {selectedMember.email} • {selectedMember.phone}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedMember(null)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    >
                      {isHeb ? 'החלף משתמש' : 'Change Member'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isHeb ? 'חפש לפי שם, שם בעברית, טלפון או דוא"ל...' : 'Search members by name, Hebrew name, phone, or email...'}
                        className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {filteredMembers.map(m => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMember(m);
                            setSearchQuery('');
                          }}
                          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-xs text-slate-900">{m.lastName}, {m.firstName}</p>
                            {m.hebrewName && (
                              <p className="text-[11px] font-serif text-slate-600 font-medium">{m.hebrewName}</p>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-200">
                            {m.membershipTier}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Guest Form */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    {isHeb ? 'שם פרטי (באנגלית)' : 'First Name'} *
                  </label>
                  <input
                    type="text"
                    value={guestFirstName}
                    onChange={(e) => setGuestFirstName(e.target.value)}
                    placeholder="Abraham"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    {isHeb ? 'שם משפחה' : 'Last Name'} *
                  </label>
                  <input
                    type="text"
                    value={guestLastName}
                    onChange={(e) => setGuestLastName(e.target.value)}
                    placeholder="Goldberg"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    {isHeb ? 'שם מלא בעברית לתפילות (בן/בת)' : 'Hebrew Name for Prayers (בן/בת)'}
                  </label>
                  <input
                    type="text"
                    value={guestHebrewName}
                    onChange={(e) => setGuestHebrewName(e.target.value)}
                    placeholder="אברהם בן יצחק"
                    dir="rtl"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-serif"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    {isHeb ? 'דואר אלקטרוני' : 'Email Address'} *
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="abraham@example.com"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    {isHeb ? 'טלפון ליצירת קשר' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    {isHeb ? 'כתובת מגורים' : 'Home Address'}
                  </label>
                  <input
                    type="text"
                    value={guestAddress}
                    onChange={(e) => setGuestAddress(e.target.value)}
                    placeholder="123 Main St, Brooklyn NY"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Safe Interactive Seating Map Selection */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
            {/* Section Tabs Bar */}
            <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Compass className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {isHeb ? 'שלב 2: בחירת מושבים במפת בית הכנסת' : 'Step 2: Pick Your Seats on the Sanctuary Map'}
                </h3>
              </div>

              {/* Section Selectors */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {sections.map(sec => {
                  const isSecActive = sec.id === activeSectionId;
                  const secAvail = seats.filter(s => s.sectionId === sec.id && s.status === 'available').length;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setActiveSectionId(sec.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        isSecActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{isHeb ? sec.hebrewName : sec.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSecActive ? 'bg-blue-800 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {secAvail} {isHeb ? 'פנויים' : 'avail'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend Bar */}
            <div className="bg-slate-100/70 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-white border-2 border-slate-300" />
                  <span>{isHeb ? 'פנוי לבחירה' : 'Available'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-blue-600 border-2 border-blue-700 shadow-xs" />
                  <span className="font-bold text-blue-700">{isHeb ? 'נבחר על ידך' : 'Selected in Cart'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-slate-300 border-2 border-slate-400 opacity-60" />
                  <span>{isHeb ? 'שמור / תפוס' : 'Reserved'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-amber-100 border-2 border-amber-500" />
                  <span>{isHeb ? 'מזרח / כבוד' : 'Mizrach / VIP'}</span>
                </div>
              </div>

              <span className="text-[11px] font-bold text-blue-600">
                {isHeb ? 'לחץ על מושב פנוי להוספה לסל' : 'Click any available seat to reserve'}
              </span>
            </div>

            {/* Safe Read-Only Seating Canvas View */}
            <div className="relative bg-slate-50/60 overflow-auto min-h-[480px] p-6 border-b border-slate-200">
              <div 
                className="relative min-w-[700px] min-h-[500px]"
                style={{ width: 900, height: 600 }}
              >
                {/* Architectural Elements (Aron Kodesh, Bimah, Amud, Mechitza, Tables) - Purely Visual, NO EDIT HANDLES */}
                {sectionElements.map(el => {
                  return (
                    <div
                      key={el.id}
                      className="absolute rounded-xl shadow-xs flex items-center justify-center font-bold text-center border pointer-events-none select-none"
                      style={{
                        left: el.x,
                        top: el.y,
                        width: el.width,
                        height: el.height,
                        backgroundColor: el.color || '#334155',
                        borderColor: 'rgba(0,0,0,0.15)',
                        color: '#ffffff'
                      }}
                    >
                      <div className="p-1 leading-tight">
                        <span className="text-[11px] block">{isHeb && el.hebrewLabel ? el.hebrewLabel : el.label}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Safe Seats Rendering */}
                {sectionSeats.map(seat => {
                  const isSelectedInCart = selectedSeatIds.includes(seat.id);
                  const isReserved = seat.status === 'reserved';
                  const isBlocked = seat.status === 'blocked';
                  const isMizrach = seat.tier === 'mizrach';
                  const isVip = seat.tier === 'vip';
                  const isPremium = seat.tier === 'premium';
                  const isMakomKavua = selectedMember && selectedMember.assignedSeatIds?.includes(seat.id);

                  let bgStyle = 'bg-white text-slate-800 border-slate-300 hover:border-blue-500 hover:scale-105 cursor-pointer shadow-xs';

                  if (isSelectedInCart) {
                    bgStyle = 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500 ring-offset-1 scale-105 shadow-md cursor-pointer font-black z-30';
                  } else if (isReserved) {
                    bgStyle = 'bg-slate-200 text-slate-400 border-slate-300 opacity-60 cursor-not-allowed';
                  } else if (isBlocked) {
                    bgStyle = 'bg-rose-100 text-rose-400 border-rose-200 opacity-50 cursor-not-allowed';
                  } else if (isMakomKavua) {
                    bgStyle = 'bg-purple-100 text-purple-900 border-purple-400 ring-2 ring-purple-400 cursor-pointer shadow-sm hover:scale-105';
                  } else if (isMizrach) {
                    bgStyle = 'bg-amber-50 text-amber-950 border-amber-400 hover:border-amber-600 hover:scale-105 cursor-pointer shadow-xs';
                  } else if (isVip) {
                    bgStyle = 'bg-indigo-50 text-indigo-950 border-indigo-400 hover:border-indigo-600 hover:scale-105 cursor-pointer shadow-xs';
                  } else if (isPremium) {
                    bgStyle = 'bg-sky-50 text-sky-950 border-sky-400 hover:border-sky-600 hover:scale-105 cursor-pointer shadow-xs';
                  }

                  return (
                    <div
                      key={seat.id}
                      onClick={() => handleToggleSeat(seat)}
                      className={`absolute w-[44px] h-[44px] rounded-lg transition-all flex flex-col items-center justify-center border-2 text-[10px] font-bold select-none ${bgStyle}`}
                      style={{
                        left: seat.x,
                        top: seat.y,
                        zIndex: isSelectedInCart ? 30 : 20
                      }}
                      title={`${seat.code} • Row ${seat.row} #${seat.number} • $${seat.price} ${seat.hasShtender ? '• Includes Shtender' : ''} ${isReserved ? '• Reserved' : ''}`}
                    >
                      {seat.hasShtender && (
                        <span className="w-full h-1 bg-amber-700/80 rounded-t-sm absolute top-0" />
                      )}
                      <span className="text-[10px] font-black leading-none">{seat.code}</span>
                      <span className="text-[8px] font-medium opacity-80 mt-0.5">
                        {isSelectedInCart ? '✓' : isReserved ? 'שמור' : `$${seat.price}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cart, Attendee Assign & Payment Method (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5 sticky top-20">
            
            {/* Header */}
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center justify-between">
                <span>{isHeb ? 'שלב 3: סל מקומות ותשלום' : 'Step 3: Reservation & Checkout'}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  {selectedSeats.length} {isHeb ? 'מקומות' : 'seats'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isHeb ? 'הקצאת שמות המתפללים וביצוע תשלום מאובטח' : 'Assign attendee names and complete secure checkout.'}
              </p>
            </div>

            {/* Selected Seats List */}
            {selectedSeats.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-500 space-y-1">
                <Compass className="w-8 h-8 mx-auto text-slate-400 mb-1" />
                <p className="font-bold text-xs text-slate-700">
                  {isHeb ? 'טרם נבחרו מקומות ישיבה' : 'No Seats Selected Yet'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isHeb ? 'אנא לחץ על המושבים הפנויים במפה לבחירתם.' : 'Click on available seats on the map to add them to your reservation.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {selectedSeats.map(seat => (
                  <div key={seat.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <div className="w-6 h-6 rounded bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                          {seat.code}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {seat.code} • {isHeb ? `שורה ${seat.row}` : `Row ${seat.row}`}
                          </p>
                          <p className="text-[10px] text-slate-500 capitalize">
                            {t(`tier_${seat.tier}`, seat.tier)} {seat.hasShtender ? '• 📖 Shtender' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span className="font-bold text-blue-600">${seat.price}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSeat(seat)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Attendee Name Input */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                      <input
                        type="text"
                        value={attendeeAllocations[seat.id]?.name || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAttendeeAllocations(prev => ({
                            ...prev,
                            [seat.id]: {
                              ...(prev[seat.id] || { hebrewName: '', relationship: 'Family' }),
                              name: val
                            }
                          }));
                        }}
                        placeholder={isHeb ? 'שם המתפלל (English)' : 'Attendee Name'}
                        className="p-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={attendeeAllocations[seat.id]?.hebrewName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAttendeeAllocations(prev => ({
                            ...prev,
                            [seat.id]: {
                              ...(prev[seat.id] || { name: '', relationship: 'Family' }),
                              hebrewName: val
                            }
                          }));
                        }}
                        placeholder={isHeb ? 'שם בעברית לתפילה' : 'Hebrew Name'}
                        dir="rtl"
                        className="p-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-serif"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Optional Donations */}
            {selectedSeats.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isHeb ? 'תרומות והשתתפות בפעילות בית הכנסת' : 'Holiday Appeals & Contributions'}
                </span>

                {selectedMember && selectedMember.annualDuesAmount > selectedMember.duesPaidAmount && (
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <input
                        type="checkbox"
                        checked={includeMembershipDues}
                        onChange={(e) => setIncludeMembershipDues(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span>{isHeb ? 'תשלום יתרת דמי חבר' : 'Pay Synagogue Annual Dues'}</span>
                    </div>
                    <span className="font-bold text-amber-700">
                      +${selectedMember.annualDuesAmount - selectedMember.duesPaidAmount}
                    </span>
                  </label>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">{isHeb ? 'נדר כל נדרי / פדיון כפרות' : 'Kol Nidre Appeal'}</span>
                  <select
                    value={kolNidrePledge}
                    onChange={(e) => setKolNidrePledge(Number(e.target.value))}
                    className="p-1 rounded bg-white border border-slate-300 text-xs font-bold text-slate-800"
                  >
                    <option value={0}>$0</option>
                    <option value={100}>$100</option>
                    <option value={180}>$180 (ח״י)</option>
                    <option value={360}>$360 (ב׳ ח״י)</option>
                    <option value={500}>$500</option>
                    <option value={1000}>$1,000</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">{isHeb ? 'הנצחה בספר יזכור' : 'Yizkor Book Dedication'}</span>
                  <select
                    value={yizkorBookDonation}
                    onChange={(e) => setYizkorBookDonation(Number(e.target.value))}
                    className="p-1 rounded bg-white border border-slate-300 text-xs font-bold text-slate-800"
                  >
                    <option value={0}>$0</option>
                    <option value={36}>$36 (ח״י כפול)</option>
                    <option value={72}>$72</option>
                    <option value={180}>$180</option>
                  </select>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            {selectedSeats.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isHeb ? 'אמצעי תשלום' : 'Select Payment Method'}
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Credit Card')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === 'Credit Card' 
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{isHeb ? 'כרטיס אשראי' : 'Credit Card'}</span>
                  </button>

                  {selectedMember ? (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Member Account')}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        paymentMethod === 'Member Account' 
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Building className="w-4 h-4" />
                      <span>{isHeb ? 'חיוב כרטיס חבר' : 'Bill Account'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Digital Wallet')}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        paymentMethod === 'Digital Wallet' 
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>📱 Apple / Google</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Check or Cash Pledge')}
                    className={`col-span-2 p-2 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      paymentMethod === 'Check or Cash Pledge' 
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{isHeb ? 'התחייבות / המחאה או מזומן לגבאי' : 'Check / Cash Pledge to Gabbai'}</span>
                  </button>
                </div>

                {/* Credit Card Input Form */}
                {paymentMethod === 'Credit Card' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        {isHeb ? 'מספר כרטיס אשראי' : 'Card Number'}
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4532 •••• •••• 8892"
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          {isHeb ? 'תוקף' : 'Expiry'}
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          CVC
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="123"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          ZIP
                        </label>
                        <input
                          type="text"
                          value={cardZip}
                          onChange={(e) => setCardZip(e.target.value)}
                          placeholder="11219"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{isHeb ? 'תשלום מאובטח ומוצפן 256-bit SSL' : '256-bit SSL Encrypted & PCI-DSS Compliant'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Price Summary & Checkout Button */}
            {selectedSeats.length > 0 && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{isHeb ? 'סה״כ מקומות:' : 'Seats Subtotal:'}</span>
                    <span>{formatCurrency(seatsSubtotal)}</span>
                  </div>
                  {duesAmount > 0 && (
                    <div className="flex justify-between text-amber-700 font-medium">
                      <span>{isHeb ? 'דמי חבר:' : 'Annual Dues:'}</span>
                      <span>+{formatCurrency(duesAmount)}</span>
                    </div>
                  )}
                  {Number(kolNidrePledge) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>{isHeb ? 'נדר כל נדרי:' : 'Kol Nidre Pledge:'}</span>
                      <span>+{formatCurrency(Number(kolNidrePledge))}</span>
                    </div>
                  )}
                  {Number(yizkorBookDonation) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>{isHeb ? 'ספר יזכור:' : 'Yizkor Book:'}</span>
                      <span>+{formatCurrency(Number(yizkorBookDonation))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>{isHeb ? 'לתשלום סופי:' : 'Grand Total:'}</span>
                    <span className="text-blue-600">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleProcessPayment}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isHeb ? 'מעבד תשלום ושומר מקומות...' : 'Processing Reservation & Payment...'}</span>
                    </div>
                  ) : (
                    <>
                      <span>{isHeb ? `אשר והזמן מקומות (${formatCurrency(grandTotal)})` : `Confirm & Pay ${formatCurrency(grandTotal)}`}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
