import React, { useState } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Receipt, 
  Download, 
  Printer, 
  Plus, 
  Search, 
  CheckCircle, 
  Clock, 
  ShieldCheck,
  Building,
  FileText
} from 'lucide-react';
import { Transaction, Member, ShulEvent } from '../../types/shul';
import { formatCurrency } from '../../utils/hebrewCalendar';
import { ShulConfig } from '../../utils/storage';

interface FinancialManagerProps {
  transactions: Transaction[];
  members: Member[];
  onAddTransaction: (transaction: Transaction) => void;
  shulConfig: ShulConfig;
}

export const FinancialManager: React.FC<FinancialManagerProps> = ({
  transactions,
  members,
  onAddTransaction,
  shulConfig
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  // Manual payment modal state
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [payerName, setPayerName] = useState('');
  const [txType, setTxType] = useState<Transaction['type']>('Membership Dues');
  const [amount, setAmount] = useState(1800);
  const [paymentMethod, setPaymentMethod] = useState('Check');
  const [refNum, setRefNum] = useState(`CHK-${Math.floor(1000 + Math.random() * 9000)}`);

  // Financial aggregates
  const totalCollected = transactions.reduce((acc, t) => acc + (t.status === 'Completed' ? t.amount : 0), 0);
  const totalDues = transactions.filter(t => t.type === 'Membership Dues' && t.status === 'Completed').reduce((acc, t) => acc + t.amount, 0);
  const totalHolidaySeats = transactions.filter(t => t.type === 'Holiday Seats' && t.status === 'Completed').reduce((acc, t) => acc + t.amount, 0);
  const totalAliyosPledges = transactions.filter(t => (t.type === 'Aliyah Pledge' || t.type === 'General Donation' || t.type === 'Kiddush Sponsorship') && t.status === 'Completed').reduce((acc, t) => acc + t.amount, 0);
  const totalOutstandingPledges = transactions.filter(t => t.status === 'Pending').reduce((acc, t) => acc + t.amount, 0);

  const [eventInfo, setEventInfo] = useState('');
  const [txNotes, setTxNotes] = useState('');

  const handleMemberSelect = (mId: string) => {
    setSelectedMemberId(mId);
    const m = members.find(x => x.id === mId);
    if (m) {
      setPayerName(`${m.firstName} ${m.lastName}`);
      if (txType === 'Membership Dues') {
        setAmount(Math.max(0, m.annualDuesAmount - m.duesPaidAmount) || m.annualDuesAmount);
      }
    }
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerName || amount <= 0) return;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      memberId: selectedMemberId || 'guest',
      memberName: payerName,
      type: txType,
      amount: Number(amount),
      date: new Date().toISOString().split('T')[0],
      status: paymentMethod === 'Unpaid Pledge (Billed)' ? 'Pending' : 'Completed',
      paymentMethod,
      referenceNumber: refNum,
      receiptSent: paymentMethod !== 'Unpaid Pledge (Billed)',
      eventOrParshaInfo: eventInfo.trim() || undefined,
      notes: txNotes.trim() || undefined
    };

    onAddTransaction(newTx);
    setIsAddTxOpen(false);
    
    // Reset form
    setEventInfo('');
    setTxNotes('');
    
    if (newTx.status === 'Completed') {
      setSelectedReceiptTx(newTx);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 text-slate-800 font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <CreditCard className="w-4 h-4 text-blue-600" />
            Financial Management & Synagogue Dues
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Process annual dues, High Holiday seating collections, Aliyah pledges & 501(c)(3) tax receipts.
          </p>
        </div>

        <button
          onClick={() => setIsAddTxOpen(true)}
          className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Synagogue Collections</span>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{formatCurrency(totalCollected)}</p>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 block">5787 Fiscal Year to Date</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Membership Dues Collected</span>
          <p className="text-2xl font-black text-blue-600 mt-1.5">{formatCurrency(totalDues)}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Annual member commitments</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">High Holiday Seats</span>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{formatCurrency(totalHolidaySeats)}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Rosh Hashanah & Yom Kippur</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aliyah & General Pledges</span>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{formatCurrency(totalAliyosPledges)}</p>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] text-slate-400 block">Torah honors & funds</span>
            {totalOutstandingPledges > 0 && (
              <span className="text-[10px] text-rose-600 font-bold">({formatCurrency(totalOutstandingPledges)} unpaid)</span>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by congregant name or reference number..."
              className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-bold text-[10px] uppercase">Category:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
            >
              <option value="all">All Payment Types</option>
              <option value="Membership Dues">Membership Dues</option>
              <option value="Holiday Seats">Holiday Seats</option>
              <option value="Aliyah Pledge">Aliyah Pledge</option>
              <option value="General Donation">General Donation</option>
              <option value="Building Fund">Building Fund</option>
              <option value="Kiddush Sponsorship">Kiddush</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-2.5">Ref #</th>
                <th className="p-2.5">Congregant Name</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Amount</th>
                <th className="p-2.5">Payment Method</th>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5 text-right">Tax Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition">
                  <td className="p-2.5 font-mono text-slate-500">{tx.referenceNumber}</td>
                  <td className="p-2.5 font-bold text-slate-900">{tx.memberName}</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                      {tx.type}
                    </span>
                    {tx.eventOrParshaInfo && (
                      <div className="text-[10px] text-blue-600 mt-0.5 max-w-[120px] truncate" title={tx.eventOrParshaInfo}>
                        {tx.eventOrParshaInfo}
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 font-bold text-slate-900">{formatCurrency(tx.amount)}</td>
                  <td className="p-2.5 text-slate-600">
                    {tx.paymentMethod}
                    {tx.status === 'Pending' && <div className="text-[10px] text-rose-600 font-bold mt-0.5">Unpaid Pledge</div>}
                  </td>
                  <td className="p-2.5 text-slate-500">{tx.date}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      tx.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
                      tx.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-right">
                    {tx.status === 'Completed' ? (
                      <button
                        onClick={() => setSelectedReceiptTx(tx)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold transition flex items-center space-x-1 ml-auto text-[10px]"
                      >
                        <FileText className="w-3 h-3" />
                        <span>501(c)(3) Receipt</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                           // Action to mark as paid could go here
                           alert("Feature to mark pledge as paid coming soon.");
                        }}
                        className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold transition flex items-center space-x-1 ml-auto text-[10px]"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Collect</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isAddTxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-5 space-y-3.5 shadow-2xl text-slate-800 text-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <DollarSign className="w-4 h-4 text-blue-600" />
              Record Synagogue Payment / Pledge
            </h3>

            <form onSubmit={handleCreateTransaction} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Select Member (CRM Sync)</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => handleMemberSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
                >
                  <option value="">-- Guest / Other Payer --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.lastName}, {m.firstName} ({m.hebrewName}) - Dues: ${m.annualDuesAmount}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Payer Full Name *</label>
                <input
                  type="text"
                  required
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Payment Type</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
                  >
                    <option value="Membership Dues">Membership Dues</option>
                    <option value="Holiday Seats">Holiday Seats</option>
                    <option value="Aliyah Pledge">Aliyah Pledge (Nedava)</option>
                    <option value="General Donation">General Donation</option>
                    <option value="Building Fund">Building Fund</option>
                    <option value="Kiddush Sponsorship">Kiddush Sponsorship</option>
                    <option value="Yizkor Donation">Yizkor Donation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-bold text-xs"
                  />
                </div>
              </div>

              {['Aliyah Pledge', 'Kiddush Sponsorship', 'General Donation'].includes(txType) && (
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Parsha / Honor / Event Info</label>
                  <input
                    type="text"
                    value={eventInfo}
                    onChange={(e) => setEventInfo(e.target.value)}
                    placeholder="e.g. Shabbos Bereishis - Shlishi or Gala Dinner"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
                  >
                    <option value="Check">Check</option>
                    <option value="Credit Card (Stripe)">Credit Card (Stripe)</option>
                    <option value="ACH Bank Transfer">ACH Transfer</option>
                    <option value="Cash to Gabbai">Cash to Gabbai</option>
                    <option value="Zelle">Zelle</option>
                    <option value="Unpaid Pledge (Billed)">Unpaid Pledge (Bill to Account)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Ref # / Check #</label>
                  <input
                    type="text"
                    value={refNum}
                    onChange={(e) => setRefNum(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Notes</label>
                <input
                  type="text"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  placeholder="Additional context or memory..."
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddTxOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Save & Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official 501(c)(3) Printable Tax Receipt Modal */}
      {selectedReceiptTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-xl w-full max-w-xl p-6 space-y-4 shadow-2xl relative print:shadow-none print:border-none">
            {/* Header of Receipt */}
            <div className="border-b border-slate-200 pb-3 text-center space-y-0.5">
              <span className="text-[10px] font-serif font-bold text-slate-500 tracking-widest uppercase">
                בס״ד • Official Charitable Donation Receipt
              </span>
              <h2 className="text-lg font-serif font-black text-slate-900">
                {shulConfig.name}
              </h2>
              <p className="text-[11px] text-slate-600">{shulConfig.address} • Tel: {shulConfig.phone}</p>
              <p className="text-[10px] font-mono text-slate-400">IRS 501(c)(3) EIN Tax-Exempt ID: {shulConfig.taxId}</p>
            </div>

            {/* Receipt Body */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Receipt Number:</span>
                  <strong className="font-mono text-slate-900 text-xs">{selectedReceiptTx.referenceNumber}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Date of Contribution:</span>
                  <strong className="text-slate-900 text-xs">{selectedReceiptTx.date}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Received with Gratitude from:</span>
                  <strong className="text-sm text-slate-950">{selectedReceiptTx.memberName}</strong>
                </div>
              </div>

              <div className="border-t border-b border-slate-200 py-2.5 space-y-1.5">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600">Contribution Purpose:</span>
                  <span className="font-bold text-slate-900">{selectedReceiptTx.type}</span>
                </div>
                {selectedReceiptTx.eventOrParshaInfo && (
                  <div className="flex justify-between font-medium text-[11px]">
                    <span className="text-slate-500">Honor / Event:</span>
                    <span className="text-slate-700">{selectedReceiptTx.eventOrParshaInfo}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span className="text-slate-600">Payment Method:</span>
                  <span className="text-slate-800">{selectedReceiptTx.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Tax-Deductible Amount:</span>
                  <span className="text-emerald-700">{formatCurrency(selectedReceiptTx.amount)}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                * No goods or services were provided in exchange for this contribution other than intangible religious benefits. Keep this receipt for your income tax deduction records.
              </p>
            </div>

            {/* Signature Line */}
            <div className="flex justify-between items-end pt-3 border-t border-slate-200">
              <div>
                <p className="text-xs font-serif font-bold text-slate-800">{shulConfig.rabbiName}</p>
                <span className="text-[10px] text-slate-500">Mara D'Asra / Rabbi</span>
              </div>
              <div className="text-right">
                <div className="w-36 border-b border-slate-400 pb-1 mb-0.5 font-serif text-xs italic text-slate-800">
                  {shulConfig.presidentName.split('(')[0]}
                </div>
                <span className="text-[10px] text-slate-500">Synagogue Treasurer / Parnas</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-1 print:hidden">
              <button
                onClick={() => setSelectedReceiptTx(null)}
                className="px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
