import React, { useState } from 'react';
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
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Seat, Member, ShulEvent, Reservation, Transaction } from '../../types/shul';
import { formatCurrency, generateLabelQRUrl } from '../../utils/hebrewCalendar';

interface ReservationWizardProps {
  cartSeats: Seat[];
  onRemoveFromCart: (seatId: string) => void;
  onClearCart: () => void;
  members: Member[];
  activeEvent: ShulEvent;
  onCompleteReservation: (reservation: Reservation, transaction?: Transaction) => void;
  onGoToSeatingMap: () => void;
}

export const ReservationWizard: React.FC<ReservationWizardProps> = ({
  cartSeats,
  onRemoveFromCart,
  onClearCart,
  members,
  activeEvent,
  onCompleteReservation,
  onGoToSeatingMap
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [hebrewName, setHebrewName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Additional donations / pledges
  const [includeMembershipDues, setIncludeMembershipDues] = useState(false);
  const [kolNidrePledge, setKolNidrePledge] = useState<number>(180);
  const [yizkorBookDonation, setYizkorBookDonation] = useState<number>(36);

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState<'Credit Card' | 'Check' | 'ACH Bank Transfer' | 'Cash' | 'Zelle'>('Credit Card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [checkNumber, setCheckNumber] = useState('');

  // Submission state
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

  // Member auto-fill
  const handleMemberSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
    if (!memberId) {
      setFirstName('');
      setLastName('');
      setHebrewName('');
      setEmail('');
      setPhone('');
      return;
    }
    const member = members.find(m => m.id === memberId);
    if (member) {
      setFirstName(member.firstName);
      setLastName(member.lastName);
      setHebrewName(member.hebrewName);
      setEmail(member.email);
      setPhone(member.phone);
    }
  };

  const selectedMember = members.find(m => m.id === selectedMemberId);

  // Totals calculation
  const seatSubtotal = cartSeats.reduce((acc, s) => acc + s.price, 0);
  const duesAmount = includeMembershipDues && selectedMember ? Math.max(0, selectedMember.annualDuesAmount - selectedMember.duesPaidAmount) : 0;
  const grandTotal = seatSubtotal + duesAmount + Number(kolNidrePledge) + Number(yizkorBookDonation);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartSeats.length === 0) return;
    if (!firstName || !lastName || !email) {
      alert('Please fill in attendee First Name, Last Name, and Email.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const reservationId = `res-${Date.now()}`;
      const transactionId = `tx-${Date.now()}`;
      const fullName = `${firstName} ${lastName}`;

      const reservation: Reservation = {
        id: reservationId,
        eventId: activeEvent.id,
        eventName: activeEvent.title,
        memberId: selectedMemberId || 'guest',
        memberName: fullName,
        memberEmail: email,
        memberPhone: phone,
        hebrewName: hebrewName || fullName,
        seatIds: cartSeats.map(s => s.id),
        seatCodes: cartSeats.map(s => s.code),
        totalAmount: grandTotal,
        paidAmount: grandTotal,
        paymentStatus: 'paid',
        paymentMethod,
        transactionId,
        createdAt: new Date().toISOString().split('T')[0],
        assignedBy: 'Online Portal',
        specialRequests
      };

      const transaction: Transaction = {
        id: transactionId,
        memberId: selectedMemberId || 'guest',
        memberName: fullName,
        type: 'Holiday Seats',
        amount: grandTotal,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        paymentMethod: `${paymentMethod} ${paymentMethod === 'Credit Card' ? `(Stripe ****4242)` : ''}`,
        referenceNumber: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        receiptSent: true
      };

      onCompleteReservation(reservation, transaction);
      setConfirmedReservation(reservation);
      setIsProcessing(false);

      // Trigger Confetti!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6']
      });
    }, 1000);
  };

  // If already confirmed, display the Digital Boarding Pass & Receipt
  if (confirmedReservation) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 max-w-3xl mx-auto shadow-xs text-slate-800 space-y-5 font-sans">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wider">Seats Successfully Reserved!</h2>
          <p className="text-xs text-slate-500">
            A confirmation receipt and digital seat pass have been recorded for{' '}
            <strong className="text-blue-600">{confirmedReservation.eventName}</strong>.
          </p>
        </div>

        {/* Digital Boarding Pass Ticket */}
        <div className="bg-slate-50 border border-slate-300 rounded-xl p-5 relative overflow-hidden shadow-xs">
          <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-0.5 rounded-bl-lg font-bold text-[10px] uppercase">
            CONFIRMED TICKET
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2 space-y-2.5">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                  Congregation Beth Sholom
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{confirmedReservation.memberName}</h3>
                {confirmedReservation.hebrewName && (
                  <p className="text-xs font-serif text-slate-700">{confirmedReservation.hebrewName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Reserved Seats</span>
                  <p className="font-bold text-blue-600 text-sm mt-0.5">
                    {confirmedReservation.seatCodes.join(', ')}
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Total Paid</span>
                  <p className="font-bold text-emerald-700 text-sm mt-0.5">
                    {formatCurrency(confirmedReservation.totalAmount)}
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-slate-400">
                Reservation Ref: <span className="font-mono text-slate-700">{confirmedReservation.id}</span> • Method: {confirmedReservation.paymentMethod}
              </p>
            </div>

            {/* QR Verification Code */}
            <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded border border-slate-200 text-center">
              <img
                src={generateLabelQRUrl(confirmedReservation.seatCodes[0] || 'SEAT', confirmedReservation.memberName, confirmedReservation.eventId)}
                alt="Seat Verification QR"
                className="w-24 h-24"
              />
              <span className="text-[9px] font-bold text-slate-700 mt-1 uppercase">Digital Pass QR</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center space-x-1.5 border border-slate-300"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>Print Pass</span>
          </button>
          <button
            onClick={() => {
              setConfirmedReservation(null);
              onGoToSeatingMap();
            }}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
          >
            Return to Seating Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 sm:p-6 text-slate-800 font-sans">
      {/* Left 2 Cols: Form & Member Details */}
      <div className="lg:col-span-2 space-y-4">
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          {/* Section Header */}
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <Users className="w-4 h-4 text-blue-600" />
              Member & Seat Allocation Wizard
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select existing member profile to sync dues, or enter attendee details for {activeEvent.title}.
            </p>
          </div>

          {/* 1. Member Profile Picker */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Step 1: Choose Synagogue Member (CRM Sync)
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => handleMemberSelect(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- New Guest / Non-Member Attendee --</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.lastName}, {m.firstName} ({m.hebrewName}) • {m.membershipTier} Member
                </option>
              ))}
            </select>

            {selectedMember && (
              <div className="text-xs bg-white p-2.5 rounded border border-slate-200 grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  Membership: <strong className="text-slate-900">{selectedMember.membershipTier}</strong>
                </div>
                <div>
                  Annual Dues: <strong className="text-slate-900">${selectedMember.annualDuesAmount}</strong>{' '}
                  ({selectedMember.isDuesPaid ? <span className="text-emerald-600 font-bold">Paid in Full</span> : <span className="text-amber-600 font-bold">Pending</span>})
                </div>
                <div className="col-span-2 text-slate-500 text-[11px]">
                  Family Members on File:{' '}
                  {selectedMember.familyMembers.length > 0
                    ? selectedMember.familyMembers.map(f => `${f.name} (${f.relationship})`).join(', ')
                    : 'None listed'}
                </div>
              </div>
            )}
          </div>

          {/* 2. Attendee Contact Details */}
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Step 2: Attendee & Label Information
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Avraham"
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Goldstein"
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
                  Hebrew Name for Label (שם בעברית)
                </label>
                <input
                  type="text"
                  value={hebrewName}
                  onChange={(e) => setHebrewName(e.target.value)}
                  placeholder="אברהם בן יצחק הלוי"
                  dir="rtl"
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-serif text-right"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(212) 555-0192"
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Email Address (for Digital Seating Pass) *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="a.goldstein@example.com"
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="text-xs">
              <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Gabbai Seating Requests / Notes</label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={2}
                placeholder="e.g. Near aisle, seated next to family, accessible entrance"
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* 3. Bundled Pledges & Synagogue Dues */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Step 3: Synagogue Dues & High Holiday Pledges
            </label>

            {selectedMember && !selectedMember.isDuesPaid && (
              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer p-2 rounded bg-white border border-slate-200">
                <input
                  type="checkbox"
                  checked={includeMembershipDues}
                  onChange={(e) => setIncludeMembershipDues(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-blue-600 bg-slate-50 border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-900">Include Annual Membership Balance</span>
                  <span className="text-blue-600 font-bold ml-1.5">
                    +{formatCurrency(selectedMember.annualDuesAmount - selectedMember.duesPaidAmount)}
                  </span>
                </div>
              </label>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium text-[10px] uppercase mb-1">Kol Nidre Appeal Pledge ($)</label>
                <input
                  type="number"
                  value={kolNidrePledge}
                  onChange={(e) => setKolNidrePledge(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium text-[10px] uppercase mb-1">Yizkor Book Memorial Listing ($)</label>
                <input
                  type="number"
                  value={yizkorBookDonation}
                  onChange={(e) => setYizkorBookDonation(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 4. Payment Method & Processing */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              Step 4: Integrated Payment Processing
            </label>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Credit Card', label: 'Credit Card' },
                { id: 'Check', label: 'Check # to Shul' },
                { id: 'ACH Bank Transfer', label: 'ACH Transfer' },
                { id: 'Zelle', label: 'Zelle / Direct' }
              ].map(m => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-1.5 px-2 rounded text-xs font-bold border transition ${
                    paymentMethod === m.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {paymentMethod === 'Credit Card' ? (
              <div className="p-3 bg-white rounded border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold">
                  <span>Secure 256-Bit Encrypted Payment</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] uppercase mb-0.5">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase mb-0.5">Expires (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px] uppercase mb-0.5">CVC / CVV</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : paymentMethod === 'Check' ? (
              <div className="p-3 bg-white rounded border border-slate-200 text-xs">
                <label className="block text-slate-500 text-[10px] uppercase mb-1">Check Number / Check Date</label>
                <input
                  type="text"
                  value={checkNumber}
                  onChange={(e) => setCheckNumber(e.target.value)}
                  placeholder="e.g. Check #4892 (Given to Gabbai)"
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
                />
              </div>
            ) : (
              <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-700">
                Payment marked as <strong className="text-blue-600">{paymentMethod}</strong>. Official tax receipt will be sent automatically.
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={cartSeats.length === 0 || isProcessing}
            className="w-full py-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <span>Processing Payment & Allocating Seats...</span>
            ) : (
              <>
                <span>Complete Reservation • {formatCurrency(grandTotal)}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Selected Seats Cart Summary */}
      <div className="space-y-3">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3 sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              <span>Seating Basket ({cartSeats.length})</span>
            </h3>
            {cartSeats.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-[10px] text-rose-600 hover:text-rose-700 font-bold"
              >
                Clear Cart
              </button>
            )}
          </div>

          {cartSeats.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 space-y-2">
              <p>No seats selected yet.</p>
              <button
                onClick={onGoToSeatingMap}
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
              >
                Open Map
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {cartSeats.map((seat) => (
                <div
                  key={seat.id}
                  className="bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-900">Seat {seat.code}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-200 text-slate-700 uppercase font-bold">
                        {seat.tier}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Row {seat.row} • {seat.sectionId.replace('_', ' ').toUpperCase()}
                      {seat.hasShtender && ' • 📖 Shtender'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{formatCurrency(seat.price)}</span>
                    <button
                      onClick={() => onRemoveFromCart(seat.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition"
                      title="Remove Seat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pricing Breakdown */}
          {cartSeats.length > 0 && (
            <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Seat Subtotal ({cartSeats.length} seats)</span>
                <span className="text-slate-900 font-bold">{formatCurrency(seatSubtotal)}</span>
              </div>

              {includeMembershipDues && duesAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Membership Dues</span>
                  <span className="text-blue-600 font-bold">{formatCurrency(duesAmount)}</span>
                </div>
              )}

              {kolNidrePledge > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Kol Nidre Appeal</span>
                  <span className="text-slate-900 font-bold">{formatCurrency(kolNidrePledge)}</span>
                </div>
              )}

              {yizkorBookDonation > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Yizkor Memorial</span>
                  <span className="text-slate-900 font-bold">{formatCurrency(yizkorBookDonation)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-bold text-slate-900">
                <span>Grand Total Due</span>
                <span className="text-blue-600 text-sm">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
