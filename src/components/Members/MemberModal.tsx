import React, { useState } from 'react';
import { X, Plus, Trash2, User, Phone, Mail, MapPin, DollarSign, Users } from 'lucide-react';
import { Member } from '../../types/shul';

interface MemberModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Member) => void;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  member,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const isEditing = !!member;

  const [firstName, setFirstName] = useState(member?.firstName || '');
  const [lastName, setLastName] = useState(member?.lastName || '');
  const [hebrewName, setHebrewName] = useState(member?.hebrewName || '');
  const [email, setEmail] = useState(member?.email || '');
  const [phone, setPhone] = useState(member?.phone || '');
  const [address, setAddress] = useState(member?.address || '');
  const [membershipTier, setMembershipTier] = useState<Member['membershipTier']>(member?.membershipTier || 'Family');
  const [membershipStatus, setMembershipStatus] = useState<Member['membershipStatus']>(member?.membershipStatus || 'active');
  const [annualDuesAmount, setAnnualDuesAmount] = useState(member?.annualDuesAmount ?? 1800);
  const [duesPaidAmount, setDuesPaidAmount] = useState(member?.duesPaidAmount ?? 1800);
  const [notes, setNotes] = useState(member?.notes || '');
  const [familyMembers, setFamilyMembers] = useState(member?.familyMembers || []);
  const [yahrzeits, setYahrzeits] = useState(member?.yahrzeits || []);
  const [aliyahPreference, setAliyahPreference] = useState<Member['aliyahPreference']>(member?.aliyahPreference || undefined);

  const [newFamName, setNewFamName] = useState('');
  const [newFamHebrew, setNewFamHebrew] = useState('');
  const [newFamRel, setNewFamRel] = useState<'Spouse' | 'Son' | 'Daughter' | 'Parent' | 'Other'>('Spouse');

  // Yahrzeit temporary states
  const [newYahrzeitName, setNewYahrzeitName] = useState('');
  const [newYahrzeitHebrew, setNewYahrzeitHebrew] = useState('');
  const [newYahrzeitRel, setNewYahrzeitRel] = useState('Parent');
  const [newYahrzeitDate, setNewYahrzeitDate] = useState('');

  const handleAddFamilyMember = () => {
    if (!newFamName.trim()) return;
    setFamilyMembers([
      ...familyMembers,
      {
        name: newFamName.trim(),
        hebrewName: newFamHebrew.trim(),
        relationship: newFamRel
      }
    ]);
    setNewFamName('');
    setNewFamHebrew('');
  };

  const handleRemoveFamilyMember = (idx: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== idx));
  };

  const handleAddYahrzeit = () => {
    if (!newYahrzeitName.trim() || !newYahrzeitDate.trim()) return;
    setYahrzeits([
      ...yahrzeits,
      {
        id: `yz-${Date.now()}`,
        deceasedName: newYahrzeitName.trim(),
        deceasedHebrewName: newYahrzeitHebrew.trim(),
        relationship: newYahrzeitRel,
        hebrewDate: newYahrzeitDate.trim()
      }
    ]);
    setNewYahrzeitName('');
    setNewYahrzeitHebrew('');
    setNewYahrzeitDate('');
  };

  const handleRemoveYahrzeit = (idx: number) => {
    setYahrzeits(yahrzeits.filter((_, i) => i !== idx));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    const saved: Member = {
      id: member?.id || `mem-${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      hebrewName: hebrewName.trim() || `${firstName} ${lastName}`,
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      membershipTier,
      membershipStatus,
      annualDuesAmount: Number(annualDuesAmount),
      duesPaidAmount: Number(duesPaidAmount),
      isDuesPaid: Number(duesPaidAmount) >= Number(annualDuesAmount),
      assignedSeatIds: member?.assignedSeatIds || [],
      familyMembers,
      yahrzeits,
      aliyahPreference,
      notes: notes.trim(),
      joinedYear: member?.joinedYear || new Date().getFullYear(),
      totalDonationsYear: member?.totalDonationsYear || 0,
      pledgeBalance: member?.pledgeBalance || 0
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-800">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <User className="w-4 h-4 text-blue-600" />
              {isEditing ? `Edit Member: ${member.firstName} ${member.lastName}` : 'Add New Synagogue Member'}
            </h3>
            <p className="text-[11px] text-slate-500">Database record and family seating profile</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
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
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">
              Hebrew Name (שם לתפילה ושלט שטענדער)
            </label>
            <input
              type="text"
              value={hebrewName}
              onChange={(e) => setHebrewName(e.target.value)}
              placeholder="אברהם בן יצחק הלוי"
              dir="rtl"
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-serif"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="sm:col-span-3">
              <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Home Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Aliyah (Kohain/Levi)</label>
              <select
                value={aliyahPreference || ''}
                onChange={(e) => setAliyahPreference(e.target.value ? e.target.value as any : undefined)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">None / Yisrael</option>
                <option value="Kohen">Kohen (כֹּהֵן)</option>
                <option value="Levi">Levi (לֵוִי)</option>
                <option value="Yisrael">Yisrael (יִשְׂרָאֵל)</option>
              </select>
            </div>
          </div>

          {/* Membership Tier & Dues */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Membership Tier & Annual Dues
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-slate-500 text-[10px] uppercase mb-1">Category</label>
                <select
                  value={membershipTier}
                  onChange={(e) => setMembershipTier(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                >
                  <option value="Family">Family ($1,800)</option>
                  <option value="Full Member">Full Member ($1,200)</option>
                  <option value="Young Couple">Young Couple ($900)</option>
                  <option value="Senior">Senior ($750)</option>
                  <option value="Associate">Associate ($600)</option>
                  <option value="Student">Student ($360)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase mb-1">Status</label>
                <select
                  value={membershipStatus}
                  onChange={(e) => setMembershipStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="honorary">Honorary</option>
                  <option value="lapsed">Lapsed</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase mb-1">Annual Dues ($)</label>
                <input
                  type="number"
                  value={annualDuesAmount}
                  onChange={(e) => setAnnualDuesAmount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase mb-1">Amount Paid ($)</label>
                <input
                  type="number"
                  value={duesPaidAmount}
                  onChange={(e) => setDuesPaidAmount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-emerald-700 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Family Members List */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center justify-between">
              <span>Family Members ({familyMembers.length})</span>
            </h4>

            {familyMembers.length > 0 && (
              <div className="space-y-1.5">
                {familyMembers.map((fam, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900">{fam.name}</span>
                      <span className="text-slate-500 ml-1.5">({fam.relationship})</span>
                      {fam.hebrewName && (
                        <span className="text-slate-700 ml-1.5 font-serif text-[11px]">{fam.hebrewName}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFamilyMember(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Family Member row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5 pt-1">
              <input
                type="text"
                placeholder="Family Name"
                value={newFamName}
                onChange={(e) => setNewFamName(e.target.value)}
                className="sm:col-span-1 bg-white border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
              />
              <input
                type="text"
                placeholder="Hebrew Name"
                value={newFamHebrew}
                onChange={(e) => setNewFamHebrew(e.target.value)}
                dir="rtl"
                className="sm:col-span-1 bg-white border border-slate-300 rounded p-1.5 text-slate-900 font-serif text-right text-xs"
              />
              <select
                value={newFamRel}
                onChange={(e) => setNewFamRel(e.target.value as any)}
                className="sm:col-span-1 bg-white border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
              >
                <option value="Spouse">Spouse</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Parent">Parent</option>
                <option value="Other">Other</option>
              </select>
              <button
                type="button"
                onClick={handleAddFamilyMember}
                className="sm:col-span-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-1.5 px-2 rounded flex items-center justify-center space-x-1 shadow-xs text-xs"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Yahrzeits List */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center justify-between">
              <span>Yahrzeit Tracker ({yahrzeits.length})</span>
            </h4>

            {yahrzeits.length > 0 && (
              <div className="space-y-1.5">
                {yahrzeits.map((yz, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900">{yz.deceasedName}</span>
                      <span className="text-slate-500 ml-1.5">({yz.relationship})</span>
                      {yz.deceasedHebrewName && (
                        <span className="text-slate-700 ml-1.5 font-serif text-[11px]">{yz.deceasedHebrewName}</span>
                      )}
                      <div className="text-[10px] text-blue-600 font-bold mt-0.5">{yz.hebrewDate}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveYahrzeit(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Yahrzeit row */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 pt-1">
              <input
                type="text"
                placeholder="Deceased English Name"
                value={newYahrzeitName}
                onChange={(e) => setNewYahrzeitName(e.target.value)}
                className="sm:col-span-1 bg-white border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
              />
              <input
                type="text"
                placeholder="Hebrew Name (בן/בת)"
                value={newYahrzeitHebrew}
                onChange={(e) => setNewYahrzeitHebrew(e.target.value)}
                dir="rtl"
                className="sm:col-span-1 bg-white border border-slate-300 rounded p-1.5 text-slate-900 font-serif text-right text-xs"
              />
              <select
                value={newYahrzeitRel}
                onChange={(e) => setNewYahrzeitRel(e.target.value)}
                className="sm:col-span-1 bg-white border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
              >
                <option value="Parent">Parent</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Hebrew Date (e.g. 15 Adar)"
                value={newYahrzeitDate}
                onChange={(e) => setNewYahrzeitDate(e.target.value)}
                className="sm:col-span-1 bg-white border border-slate-300 rounded p-1.5 text-slate-900 text-xs"
              />
              <button
                type="button"
                onClick={handleAddYahrzeit}
                className="sm:col-span-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-1.5 px-2 rounded flex items-center justify-center space-x-1 shadow-xs text-xs"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Gabbai Private Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Baal Koreh, honors donor, requires front aisle"
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2.5 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
            >
              Save Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
