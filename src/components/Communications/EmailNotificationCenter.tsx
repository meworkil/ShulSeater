import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  Eye, 
  Edit3, 
  CheckCircle, 
  Users, 
  Clock, 
  Sparkles, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { EmailTemplate, Member, Reservation, ShulEvent } from '../../types/shul';
import { ShulConfig } from '../../utils/storage';
import { formatCurrency } from '../../utils/hebrewCalendar';

interface EmailNotificationCenterProps {
  emailTemplates: EmailTemplate[];
  members: Member[];
  reservations: Reservation[];
  activeEvent: ShulEvent;
  shulConfig: ShulConfig;
}

export const EmailNotificationCenter: React.FC<EmailNotificationCenterProps> = ({
  emailTemplates,
  members,
  reservations,
  activeEvent,
  shulConfig
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(emailTemplates[0]?.id || 'tmpl-confirmation');
  const [targetAudience, setTargetAudience] = useState<'all_members' | 'confirmed_reservations' | 'dues_pending'>('confirmed_reservations');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'logs'>('preview');
  const [editedSubject, setEditedSubject] = useState(emailTemplates[0]?.subject || '');
  const [editedBody, setEditedBody] = useState(emailTemplates[0]?.body || '');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessNotice, setSendSuccessNotice] = useState<string | null>(null);

  // Email Delivery Logs
  const [deliveryLogs, setDeliveryLogs] = useState<{
    id: string;
    recipientName: string;
    email: string;
    subject: string;
    sentAt: string;
    status: 'Delivered' | 'Opened';
  }[]>([
    {
      id: 'log-1',
      recipientName: 'Avraham Goldstein',
      email: 'a.goldstein@example.com',
      subject: `Seat Reservation Confirmation - ${activeEvent.title}`,
      sentAt: '2026-08-15 14:32',
      status: 'Opened'
    },
    {
      id: 'log-2',
      recipientName: 'Dr. Michael Klein',
      email: 'dr.mklein@medny.org',
      subject: `Seat Reservation Confirmation - ${activeEvent.title}`,
      sentAt: '2026-08-12 10:15',
      status: 'Opened'
    }
  ]);

  const currentTemplate = emailTemplates.find(t => t.id === selectedTemplateId) || emailTemplates[0];

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = emailTemplates.find(t => t.id === templateId);
    if (tmpl) {
      setEditedSubject(tmpl.subject);
      setEditedBody(tmpl.body);
    }
  };

  // Sample recipient for preview substitution
  const sampleMember = members[0] || {
    firstName: 'Avraham',
    lastName: 'Goldstein',
    hebrewName: 'אברהם בן יצחק הלוי',
    email: 'a.goldstein@example.com',
    annualDuesAmount: 1800,
    duesPaidAmount: 1800
  };

  const sampleReservation = reservations[0] || {
    eventName: activeEvent.title,
    seatCodes: ['M-MIZ-01', 'M-MIZ-02', 'W-BALC-01'],
    totalAmount: 1250
  };

  // Generate dynamic preview text
  const generatePreview = (text: string) => {
    return text
      .replace(/{{member_name}}/g, `${sampleMember.firstName} ${sampleMember.lastName}`)
      .replace(/{{hebrew_name}}/g, sampleMember.hebrewName)
      .replace(/{{event_name}}/g, activeEvent.title)
      .replace(/{{seat_numbers}}/g, sampleReservation.seatCodes.join(', '))
      .replace(/{{section_name}}/g, "Men's Main Sanctuary & Women's Balcony")
      .replace(/{{amount_paid}}/g, formatCurrency(sampleReservation.totalAmount))
      .replace(/{{previous_seats}}/g, 'Seats M-MIZ-01, M-MIZ-02')
      .replace(/{{deadline_date}}/g, '29 Elul 5786')
      .replace(/{{renewal_link}}/g, 'https://bethsholom.org/renew-seats')
      .replace(/{{invoice_number}}/g, 'INV-5787-104')
      .replace(/{{total_due}}/g, formatCurrency(sampleMember.annualDuesAmount))
      .replace(/{{tax_deductible_amount}}/g, formatCurrency(sampleMember.annualDuesAmount))
      .replace(/{{payment_link}}/g, 'https://bethsholom.org/dues-pay');
  };

  const handleBroadcastSend = () => {
    setIsSending(true);
    setTimeout(() => {
      const recipientCount = targetAudience === 'confirmed_reservations' ? reservations.length : members.length;
      const newLogs = (targetAudience === 'confirmed_reservations' ? reservations : members).map((r: any) => ({
        id: `log-${Date.now()}-${Math.random()}`,
        recipientName: r.memberName || `${r.firstName} ${r.lastName}`,
        email: r.memberEmail || r.email,
        subject: generatePreview(editedSubject),
        sentAt: 'Just now',
        status: 'Delivered' as const
      }));

      setDeliveryLogs(prev => [...newLogs, ...prev]);
      setIsSending(false);
      setSendSuccessNotice(`Successfully dispatched ${recipientCount} email notifications!`);
      setTimeout(() => setSendSuccessNotice(null), 5000);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 text-slate-800 font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <Mail className="w-4 h-4 text-blue-600" />
            Email Communications & Notifications Center
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Automated digital seating passes, Makom Kavua renewals, and High Holiday announcements.
          </p>
        </div>

        <div className="flex items-center space-x-1.5">
          {['preview', 'editor', 'logs'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1 rounded text-xs font-bold capitalize transition shadow-xs ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab === 'logs' ? `Delivery Logs (${deliveryLogs.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {sendSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{sendSuccessNotice}</span>
        </div>
      )}

      {/* Main Grid: Template Selector & Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Template Chooser & Target Audience */}
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2.5 shadow-xs">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              1. Select Notification Template
            </label>
            <div className="space-y-1.5">
              {emailTemplates.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => handleTemplateChange(tmpl.id)}
                  className={`w-full p-2.5 rounded-lg border text-left transition text-xs ${
                    selectedTemplateId === tmpl.id
                      ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-bold text-slate-900 block">{tmpl.name}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block truncate">{tmpl.subject}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2.5 shadow-xs text-xs">
            <label className="block font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              2. Target Recipient List
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="confirmed_reservations">
                Confirmed Reservations ({reservations.length} Attendees)
              </option>
              <option value="all_members">
                Entire Synagogue Roster ({members.length} Families)
              </option>
              <option value="dues_pending">
                Members with Dues Balance ({members.filter(m => !m.isDuesPaid).length} Members)
              </option>
            </select>

            <button
              onClick={handleBroadcastSend}
              disabled={isSending}
              className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Transmitting Emails...' : 'Send Broadcast'}</span>
            </button>
          </div>
        </div>

        {/* Right 2 Cols: Preview or Editor */}
        <div className="lg:col-span-2">
          {activeTab === 'preview' ? (
            /* Email Mock Preview with Synagogue Email Header */
            <div className="bg-white text-slate-900 border border-slate-200 rounded-lg shadow-xs overflow-hidden">
              {/* Email Client Header */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 space-y-0.5 text-xs text-slate-600">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-700 text-[11px]">From:</span>
                  <span>{shulConfig.name} &lt;{shulConfig.email}&gt;</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-700 text-[11px]">To:</span>
                  <span>{sampleMember.firstName} {sampleMember.lastName} &lt;{sampleMember.email}&gt;</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-700 text-[11px]">Subject:</span>
                  <span className="font-bold text-slate-900">{generatePreview(editedSubject)}</span>
                </div>
              </div>

              {/* Email Content Container */}
              <div className="p-6 space-y-4 max-w-2xl mx-auto text-xs">
                {/* Shul Header Banner */}
                <div className="text-center border-b border-slate-200 pb-3 space-y-0.5">
                  <span className="text-[10px] font-serif text-blue-800 font-bold tracking-widest uppercase">
                    בס״ד • Congregation Beth Sholom
                  </span>
                  <h1 className="text-base font-serif font-black text-slate-950">{shulConfig.name}</h1>
                  <p className="text-[10px] text-slate-500">{shulConfig.address}</p>
                </div>

                {/* Body Message */}
                <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                  {generatePreview(editedBody)}
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-0.5">
                  <p>© 5787 Congregation Beth Sholom • Synagogue Seating & Membership Office</p>
                  <p>For questions or seat reassignment requests, contact Gabbaim at {shulConfig.phone}</p>
                </div>
              </div>
            </div>
          ) : activeTab === 'editor' ? (
            /* Template Editor Form */
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3 text-xs">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                Customize Template Copy & Variables
              </h3>

              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Email Subject Line</label>
                <input
                  type="text"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Email Message Body</label>
                <textarea
                  rows={10}
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-0.5 text-[10px] text-slate-500">
                <span className="font-bold text-slate-700 block uppercase">Supported Dynamic Variables:</span>
                <p className="font-mono text-slate-700">
                  {"{{member_name}}"}, {"{{hebrew_name}}"}, {"{{event_name}}"}, {"{{seat_numbers}}"}, {"{{section_name}}"}, {"{{amount_paid}}"}, {"{{renewal_link}}"}
                </p>
              </div>
            </div>
          ) : (
            /* Delivery Logs Table */
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Recent Notification Transmissions
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Recipient</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Subject</th>
                      <th className="p-2.5">Sent At</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deliveryLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{log.recipientName}</td>
                        <td className="p-2.5 text-slate-500">{log.email}</td>
                        <td className="p-2.5 truncate max-w-xs text-slate-700">{log.subject}</td>
                        <td className="p-2.5 text-slate-400">{log.sentAt}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
