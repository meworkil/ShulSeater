import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  Mail, 
  Filter,
  DollarSign
} from 'lucide-react';
import { Member, Seat } from '../../types/shul';
import { MemberModal } from './MemberModal';
import { DatabaseSyncModal } from './DatabaseSyncModal';
import { formatCurrency } from '../../utils/hebrewCalendar';

interface MemberListProps {
  members: Member[];
  seats: Seat[];
  onSaveMember: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  onImportMembers: (newMembers: Member[]) => void;
  onFullRestore: () => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  seats,
  onSaveMember,
  onDeleteMember,
  onImportMembers,
  onFullRestore
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [duesFilter, setDuesFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Filter members
  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery) ||
      m.hebrewName.includes(searchQuery);

    const matchesTier = tierFilter === 'all' || m.membershipTier === tierFilter;
    const matchesDues = 
      duesFilter === 'all' ||
      (duesFilter === 'paid' && m.isDuesPaid) ||
      (duesFilter === 'unpaid' && !m.isDuesPaid);

    return matchesSearch && matchesTier && matchesDues;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 text-slate-800 font-sans">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <Users className="w-4 h-4 text-blue-600" />
            Member Directory & Synagogue Database
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Manage membership tiers, Hebrew names, annual dues, and permanent assigned seats.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="px-3 py-1.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Database Sync & CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingMember(null);
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-xs text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member by English or Hebrew name, email, phone..."
            className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-bold text-[11px] uppercase">Tier:</span>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
          >
            <option value="all">All Tiers</option>
            <option value="Family">Family</option>
            <option value="Full Member">Full Member</option>
            <option value="Young Couple">Young Couple</option>
            <option value="Senior">Senior</option>
            <option value="Associate">Associate</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-bold text-[11px] uppercase">Dues:</span>
          <select
            value={duesFilter}
            onChange={(e) => setDuesFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Dues Paid</option>
            <option value="unpaid">Balance Due</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Member Name</th>
                <th className="p-3">Hebrew Name & Aliyah</th>
                <th className="p-3">Contact Info</th>
                <th className="p-3">Tier & Family</th>
                <th className="p-3">Financials</th>
                <th className="p-3">Seats & Yahrzeits</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((m) => {
                const memberSeats = seats.filter(s => s.reservedForMemberId === m.id || m.assignedSeatIds.includes(s.id));

                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 text-xs">
                        {m.lastName}, {m.firstName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Member since {m.joinedYear}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-serif text-slate-700 text-xs font-semibold dir-rtl">
                        {m.hebrewName || '—'}
                      </div>
                      {m.aliyahPreference && m.aliyahPreference !== 'Yisrael' && (
                        <div className="text-[10px] font-bold text-blue-700 mt-0.5 bg-blue-50 px-1.5 py-0.5 rounded w-max">
                          {m.aliyahPreference}
                        </div>
                      )}
                    </td>

                    <td className="p-3 space-y-0.5">
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{m.phone || 'No phone'}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-slate-500">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[150px]">{m.email}</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px]">
                        {m.membershipTier}
                      </span>
                      {m.familyMembers.length > 0 && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          +{m.familyMembers.length} Family ({m.familyMembers.map(f => f.name.split(' ')[0]).join(', ')})
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Dues</div>
                      <div className="font-bold text-slate-900 text-xs">
                        {formatCurrency(m.duesPaidAmount)} / {formatCurrency(m.annualDuesAmount)}
                      </div>
                      <div className="mt-0.5">
                        {m.isDuesPaid ? (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5" /> Paid
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" /> Due {formatCurrency(m.annualDuesAmount - m.duesPaidAmount)}
                          </span>
                        )}
                      </div>
                      
                      {m.pledgeBalance !== undefined && m.pledgeBalance > 0 && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> Pledges: {formatCurrency(m.pledgeBalance)}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      {memberSeats.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {memberSeats.map(s => (
                            <span key={s.id} className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono text-[10px] font-bold">
                              {s.code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px] block mb-1.5">No seats assigned</span>
                      )}

                      {m.yahrzeits && m.yahrzeits.length > 0 && (
                        <div className="text-[10px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 inline-block">
                          🕯️ {m.yahrzeits.length} Yahrzeits tracked
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => {
                            setEditingMember(m);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Edit Member"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ${m.firstName} ${m.lastName} from member directory?`)) {
                              onDeleteMember(m.id);
                            }
                          }}
                          className="p-1 rounded bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                          title="Delete Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Add/Edit Modal */}
      <MemberModal
        member={editingMember}
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingMember(null);
        }}
        onSave={(saved) => {
          onSaveMember(saved);
        }}
      />

      {/* Database Sync Modal */}
      <DatabaseSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        members={members}
        onImportMembers={onImportMembers}
        onFullRestore={onFullRestore}
      />
    </div>
  );
};
