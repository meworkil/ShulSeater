import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  ArrowLeftRight, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Filter,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Seat, Reservation, ShulSection, ShulEvent, Member } from '../../types/shul';
import { formatCurrency } from '../../utils/hebrewCalendar';

interface OccupancyDashboardProps {
  seats: Seat[];
  sections: ShulSection[];
  reservations: Reservation[];
  members: Member[];
  activeEvent: ShulEvent;
  onSwapSeats: (seatIdA: string, seatIdB: string) => void;
  onGoToSeatingMap: () => void;
}

export const OccupancyDashboard: React.FC<OccupancyDashboardProps> = ({
  seats,
  sections,
  reservations,
  members,
  activeEvent,
  onSwapSeats,
  onGoToSeatingMap
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [swapSeatA, setSwapSeatA] = useState('');
  const [swapSeatB, setSwapSeatB] = useState('');
  const [swapSuccessMessage, setSwapSuccessMessage] = useState<string | null>(null);

  // High-level Calculations
  const totalSeats = seats.length;
  const reservedSeats = seats.filter(s => s.status === 'reserved').length;
  const availableSeats = totalSeats - reservedSeats;
  const occupancyRate = totalSeats > 0 ? Math.round((reservedSeats / totalSeats) * 100) : 0;

  const totalRevenueCollected = reservations.reduce((acc, r) => acc + r.paidAmount, 0);
  const potentialTotalRevenue = seats.reduce((acc, s) => acc + s.price, 0);

  // Quick Seat Swap Handler
  const handlePerformSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapSeatA || !swapSeatB) return;
    if (swapSeatA === swapSeatB) {
      alert('Please select two distinct seats to swap.');
      return;
    }

    onSwapSeats(swapSeatA, swapSeatB);
    const seatA = seats.find(s => s.id === swapSeatA);
    const seatB = seats.find(s => s.id === swapSeatB);
    setSwapSuccessMessage(`Successfully swapped Seat ${seatA?.code} and Seat ${seatB?.code}!`);
    setSwapSeatA('');
    setSwapSeatB('');
    setTimeout(() => setSwapSuccessMessage(null), 4000);
  };

  // Filtered reservations
  const filteredReservations = reservations.filter(r => 
    r.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.seatCodes.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.hebrewName && r.hebrewName.includes(searchQuery))
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 text-slate-800 font-sans">
      {/* High Density Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Sanctuary Occupancy */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sanctuary Occupancy</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{occupancyRate}%</span>
            <span className="text-xs text-slate-500 font-medium">({reservedSeats} / {totalSeats} seats)</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${occupancyRate}%` }} 
            />
          </div>
        </div>

        {/* Metric 2: Open Available Seats */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Seats</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-600">{availableSeats}</span>
            <span className="text-xs text-slate-500">open for booking</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 truncate">
            {activeEvent.title}
          </p>
        </div>

        {/* Metric 3: Total Revenue Collected */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue Collected</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{formatCurrency(totalRevenueCollected)}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Seats, annual dues & appeal pledges
          </p>
        </div>

        {/* Metric 4: Active Congregation Members */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Congregation Roster</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{members.length}</span>
            <span className="text-xs text-slate-500">Families</span>
          </div>
          <p className="text-[10px] text-blue-600 font-bold mt-2">
            {members.filter(m => m.isDuesPaid).length} Dues Paid in Full
          </p>
        </div>
      </div>

      {/* Section Capacity Breakdown */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              Live Section-by-Section Capacity
            </h3>
            <p className="text-[11px] text-slate-500">Real-time occupancy tracking across sanctuary wings</p>
          </div>
          <button
            onClick={onGoToSeatingMap}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
          >
            <span>Open Seating Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {sections.map((sec) => {
            const secSeats = seats.filter(s => s.sectionId === sec.id);
            const secReserved = secSeats.filter(s => s.status === 'reserved').length;
            const secTotal = secSeats.length;
            const secPercent = secTotal > 0 ? Math.round((secReserved / secTotal) * 100) : 0;

            return (
              <div 
                key={sec.id}
                className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{sec.name}</h4>
                    <span className="text-[10px] font-serif text-slate-500 font-medium">{sec.hebrewName}</span>
                  </div>
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: sec.color }} 
                  />
                </div>

                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500 font-medium">Occupancy:</span>
                  <span className="font-bold text-slate-900">{secPercent}% ({secReserved}/{secTotal})</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${secPercent}%`,
                      backgroundColor: sec.color 
                    }}
                  />
                </div>

                <div className="pt-0.5 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Available: <strong className="text-emerald-700">{secTotal - secReserved}</strong></span>
                  <span>Floor: {sec.floor.split('/')[0]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Seat Swap Tool */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
            Gabbai Quick Seat Swap Tool
          </h3>
          <p className="text-[11px] text-slate-500">
            Instant 1-click swap between two seats (automatically updates names, labels, and member seat records).
          </p>
        </div>

        {swapSuccessMessage && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-2 rounded text-xs font-semibold flex items-center space-x-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{swapSuccessMessage}</span>
          </div>
        )}

        <form onSubmit={handlePerformSwap} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs items-end">
          <div>
            <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">First Seat</label>
            <select
              value={swapSeatA}
              onChange={(e) => setSwapSeatA(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
            >
              <option value="">-- Choose First Seat --</option>
              {seats.map(s => (
                <option key={s.id} value={s.id}>
                  Seat {s.code} ({s.status === 'reserved' ? s.reservedForMemberName : 'Available'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Second Seat to Swap</label>
            <select
              value={swapSeatB}
              onChange={(e) => setSwapSeatB(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
            >
              <option value="">-- Choose Second Seat --</option>
              {seats.map(s => (
                <option key={s.id} value={s.id}>
                  Seat {s.code} ({s.status === 'reserved' ? s.reservedForMemberName : 'Available'})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!swapSeatA || !swapSeatB || swapSeatA === swapSeatB}
            className="py-1.5 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 h-8"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Execute Seat Swap</span>
          </button>
        </form>
      </div>

      {/* Real-time Reservations Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Confirmed Reservations ({reservations.length})
            </h3>
            <p className="text-[11px] text-slate-500">All registered seat reservations for {activeEvent.title}</p>
          </div>

          <div className="relative w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member or seat #..."
              className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-2.5">Ref ID</th>
                <th className="p-2.5">Congregant / Hebrew Name</th>
                <th className="p-2.5">Seats</th>
                <th className="p-2.5">Amount</th>
                <th className="p-2.5">Method</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Booking Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReservations.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50 transition">
                  <td className="p-2.5 font-mono text-slate-500">{res.id}</td>
                  <td className="p-2.5">
                    <div className="font-bold text-slate-900">{res.memberName}</div>
                    {res.hebrewName && (
                      <div className="text-[11px] font-serif text-slate-600">{res.hebrewName}</div>
                    )}
                  </td>
                  <td className="p-2.5">
                    <div className="flex flex-wrap gap-1">
                      {res.seatCodes.map((code) => (
                        <span key={code} className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono text-[10px] font-bold">
                          {code}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-2.5 font-bold text-slate-900">{formatCurrency(res.totalAmount)}</td>
                  <td className="p-2.5 text-slate-600">{res.paymentMethod || 'Online'}</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                      {res.paymentStatus}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-500">{res.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
