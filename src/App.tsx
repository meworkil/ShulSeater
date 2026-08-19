import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SeatingCanvas } from './components/SeatingMap/SeatingCanvas';
import { LayoutDesigner } from './components/SeatingMap/LayoutDesigner';
import { ReservationWizard } from './components/Reservations/ReservationWizard';
import { OccupancyDashboard } from './components/Dashboard/OccupancyDashboard';
import { MemberList } from './components/Members/MemberList';
import { FinancialManager } from './components/Financials/FinancialManager';
import { PrintManager } from './components/PrintCenter/PrintManager';
import { EmailNotificationCenter } from './components/Communications/EmailNotificationCenter';
import { MemberSeatingPortal } from './components/Reservations/MemberSeatingPortal';
import { OfflineHolidayPack } from './components/OfflineTools/OfflineHolidayPack';
import { SetupModeModal } from './components/Modals/SetupModeModal';
import { CongregationYearModal } from './components/Modals/CongregationYearModal';
import { INITIAL_SECTIONS, INITIAL_MEMBERS, INITIAL_TRANSACTIONS, generateInitialSanctuaryLayout } from './data/mockShulData';
import { syncEventsWithYear } from './utils/hebrewCalendar';

import {
  Seat,
  LayoutElement,
  ShulSection,
  ShulEvent,
  Member,
  Reservation,
  Transaction,
  EmailTemplate
} from './types/shul';

import {
  loadSeats,
  saveSeats,
  loadElements,
  saveElements,
  loadSections,
  saveSections,
  loadEvents,
  saveEvents,
  loadMembers,
  saveMembers,
  loadReservations,
  saveReservations,
  loadTransactions,
  saveTransactions,
  loadEmailTemplates,
  saveEmailTemplates,
  loadConfig,
  saveConfig,
  ShulConfig
} from './utils/storage';

export function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    'seating_map' | 'layout_designer' | 'reservations' | 'member_portal' | 'dashboard' | 'members' | 'financials' | 'print_center' | 'emails'
  >('seating_map');

  // Core Data States (Initialized from offline-first local storage)
  const [seats, setSeats] = useState<Seat[]>(loadSeats);
  const [elements, setElements] = useState<LayoutElement[]>(loadElements);
  const [sections, setSections] = useState<ShulSection[]>(loadSections);
  const [events, setEvents] = useState<ShulEvent[]>(loadEvents);
  const [activeEventId, setActiveEventId] = useState<string>(events[0]?.id || 'event-rosh-hashanah-5787');
  const [members, setMembers] = useState<Member[]>(loadMembers);
  const [reservations, setReservations] = useState<Reservation[]>(loadReservations);
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(loadEmailTemplates);
  const [shulConfig, setShulConfig] = useState<ShulConfig>(loadConfig);

  // Connectivity & Modal States
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isOfflinePackOpen, setIsOfflinePackOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isCongregationModalOpen, setIsCongregationModalOpen] = useState(false);

  // Active Event
  const activeEvent = events.find(e => e.id === activeEventId) || events[0];

  // Sync to localStorage whenever data changes
  useEffect(() => {
    saveSeats(seats);
  }, [seats]);

  useEffect(() => {
    saveElements(elements);
  }, [elements]);

  useEffect(() => {
    saveSections(sections);
  }, [sections]);

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  useEffect(() => {
    saveMembers(members);
  }, [members]);

  useEffect(() => {
    saveReservations(reservations);
  }, [reservations]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveEmailTemplates(emailTemplates);
  }, [emailTemplates]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update Single Seat
  const handleUpdateSeat = (updatedSeat: Seat) => {
    setSeats(prev => prev.map(s => (s.id === updatedSeat.id ? updatedSeat : s)));
  };

  // Quick Seat Swap Handler (Gabbai reallocations)
  const handleSwapSeats = (seatIdA: string, seatIdB: string) => {
    setSeats(prev => {
      const seatA = prev.find(s => s.id === seatIdA);
      const seatB = prev.find(s => s.id === seatIdB);
      if (!seatA || !seatB) return prev;

      return prev.map(s => {
        if (s.id === seatIdA) {
          return {
            ...s,
            status: seatB.status,
            reservedForMemberId: seatB.reservedForMemberId,
            reservedForMemberName: seatB.reservedForMemberName,
            reservedForHebrewName: seatB.reservedForHebrewName
          };
        }
        if (s.id === seatIdB) {
          return {
            ...s,
            status: seatA.status,
            reservedForMemberId: seatA.reservedForMemberId,
            reservedForMemberName: seatA.reservedForMemberName,
            reservedForHebrewName: seatA.reservedForHebrewName
          };
        }
        return s;
      });
    });
  };

  // Complete Reservation Flow
  const handleCompleteReservation = (
    newReservation: Reservation,
    newTransaction?: Transaction
  ) => {
    // 1. Add reservation
    setReservations(prev => [newReservation, ...prev]);

    // 2. Add transaction if created
    if (newTransaction) {
      setTransactions(prev => [newTransaction, ...prev]);
    }

    // 3. Mark selected seats as reserved
    setSeats(prev =>
      prev.map(seat => {
        if (newReservation.seatIds.includes(seat.id)) {
          return {
            ...seat,
            status: 'reserved',
            reservedForMemberId: newReservation.memberId,
            reservedForMemberName: newReservation.memberName,
            reservedForHebrewName: newReservation.hebrewName
          };
        }
        return seat;
      })
    );
  };

  // Member CRUD
  const handleSaveMember = (savedMember: Member) => {
    setMembers(prev => {
      const exists = prev.some(m => m.id === savedMember.id);
      if (exists) {
        return prev.map(m => (m.id === savedMember.id ? savedMember : m));
      }
      return [savedMember, ...prev];
    });
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
    // Release assigned seats
    setSeats(prev =>
      prev.map(s =>
        s.reservedForMemberId === memberId
          ? {
              ...s,
              status: 'available',
              reservedForMemberId: undefined,
              reservedForMemberName: undefined,
              reservedForHebrewName: undefined
            }
          : s
      )
    );
  };

  const handleImportMembers = (newMembers: Member[]) => {
    setMembers(prev => {
      const combined = [...prev];
      newMembers.forEach(nm => {
        const idx = combined.findIndex(x => x.id === nm.id || x.email === nm.email);
        if (idx >= 0) {
          combined[idx] = nm;
        } else {
          combined.push(nm);
        }
      });
      return combined;
    });
  };

  const handleFullRestore = () => {
    setSeats(loadSeats());
    setElements(loadElements());
    setSections(loadSections());
    setEvents(loadEvents());
    setMembers(loadMembers());
    setReservations(loadReservations());
    setTransactions(loadTransactions());
    setShulConfig(loadConfig());
  };

  const handleUpdateShulConfig = (newConfig: ShulConfig) => {
    setShulConfig(newConfig);
    saveConfig(newConfig);
    // Dynamically synchronize all holiday & regular services with the chosen year
    const yr = newConfig.activeYear || 5787;
    const hebYr = newConfig.activeHebrewYear || 'תשפ״ז';
    setEvents(prev => {
      const synced = syncEventsWithYear(prev, yr, hebYr);
      saveEvents(synced);
      return synced;
    });
  };

  // Option 1: Setup with Default Names & Places (Rabbi, Gabbai, Cantor, President, Tables & Shtenders)
  const handleSetupDefaultWithDignitaries = () => {
    const layout = generateInitialSanctuaryLayout();
    setSeats(layout.seats);
    setElements(layout.elements);
    setSections(INITIAL_SECTIONS);
    setMembers(INITIAL_MEMBERS);
    setTransactions(INITIAL_TRANSACTIONS);
    setReservations([]);
    saveSeats(layout.seats);
    saveElements(layout.elements);
    saveSections(INITIAL_SECTIONS);
    saveMembers(INITIAL_MEMBERS);
    saveTransactions(INITIAL_TRANSACTIONS);
    saveReservations([]);
  };

  // Option 2: Blank Setup (Everything Manually Put In — 0 seats, 0 dummy members, 0 dummy reservations)
  const handleSetupBlankManual = () => {
    setSeats([]);
    setElements([]);
    setReservations([]);
    setTransactions([]);
    setMembers([]);
    saveSeats([]);
    saveElements([]);
    saveReservations([]);
    saveTransactions([]);
    saveMembers([]);
  };

  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions(prev => [newTx, ...prev]);

    // If it is dues payment, update member's dues
    if (newTx.type === 'Membership Dues' && newTx.memberId) {
      setMembers(prev =>
        prev.map(m => {
          if (m.id === newTx.memberId) {
            const newPaid = m.duesPaidAmount + newTx.amount;
            return {
              ...m,
              duesPaidAmount: newPaid,
              isDuesPaid: newPaid >= m.annualDuesAmount
            };
          }
          return m;
        })
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Main Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeEvent={activeEvent}
        events={events}
        onSelectEvent={setActiveEventId}
        isOffline={isOffline}
        onOpenOfflineModal={() => setIsOfflinePackOpen(true)}
        onOpenSetupModal={() => setIsSetupModalOpen(true)}
        shulConfig={shulConfig}
        onOpenCongregationModal={() => setIsCongregationModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'seating_map' && (
          <div className="relative">
            <SeatingCanvas
              seats={seats}
              elements={elements}
              sections={sections}
              activeEvent={activeEvent}
              members={members}
              onUpdateSeat={handleUpdateSeat}
              onStartReservation={() => setActiveTab('reservations')}
            />
            <div className="absolute bottom-4 left-4 z-50">
              <a 
                href="/KoveaMakom-Offline.html" 
                download
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg shadow-xl font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Offline App (.html)
              </a>
            </div>
          </div>
        )}

        {activeTab === 'layout_designer' && (
          <LayoutDesigner
            seats={seats}
            elements={elements}
            sections={sections}
            onUpdateLayout={(newSeats, newElements) => {
              setSeats(newSeats);
              setElements(newElements);
            }}
            onUpdateSeats={setSeats}
            onUpdateElements={setElements}
            onUpdateSections={setSections}
            onResetToDefault={handleFullRestore}
            onOpenSetupModal={() => setIsSetupModalOpen(true)}
          />
        )}

        {activeTab === 'reservations' && (
          <ReservationWizard
            cartSeats={seats.filter(s => s.status === 'selected')}
            onRemoveFromCart={(id) => {
              const seat = seats.find(s => s.id === id);
              if (seat) handleUpdateSeat({ ...seat, status: 'available' });
            }}
            onClearCart={() => setSeats(prev => prev.map(s => s.status === 'selected' ? { ...s, status: 'available' } : s))}
            members={members}
            activeEvent={activeEvent}
            onCompleteReservation={handleCompleteReservation}
            onGoToSeatingMap={() => setActiveTab('seating_map')}
          />
        )}

        {activeTab === 'member_portal' && (
          <MemberSeatingPortal
            seats={seats}
            elements={elements}
            sections={sections}
            activeEvent={activeEvent}
            members={members}
            shulConfig={shulConfig}
            onCompleteReservation={handleCompleteReservation}
            onSwitchToGabbaiMode={() => setActiveTab('seating_map')}
          />
        )}

        {activeTab === 'dashboard' && (
          <OccupancyDashboard
            seats={seats}
            sections={sections}
            reservations={reservations}
            members={members}
            activeEvent={activeEvent}
            onSwapSeats={handleSwapSeats}
            onGoToSeatingMap={() => setActiveTab('seating_map')}
          />
        )}

        {activeTab === 'members' && (
          <MemberList
            members={members}
            seats={seats}
            onSaveMember={handleSaveMember}
            onDeleteMember={handleDeleteMember}
            onImportMembers={handleImportMembers}
            onFullRestore={handleFullRestore}
          />
        )}

        {activeTab === 'financials' && (
          <FinancialManager
            transactions={transactions}
            members={members}
            onAddTransaction={handleAddTransaction}
            shulConfig={shulConfig}
          />
        )}

        {activeTab === 'print_center' && (
          <PrintManager
            seats={seats}
            sections={sections}
            activeEvent={activeEvent}
            members={members}
            shulConfig={shulConfig}
          />
        )}

        {activeTab === 'emails' && (
          <EmailNotificationCenter
            emailTemplates={emailTemplates}
            members={members}
            reservations={reservations}
            activeEvent={activeEvent}
            shulConfig={shulConfig}
          />
        )}
      </main>

      {/* Offline Yom Tov Hub & Settings Modal */}
      <OfflineHolidayPack
        isOpen={isOfflinePackOpen}
        onClose={() => setIsOfflinePackOpen(false)}
        isOffline={isOffline}
        shulConfig={shulConfig}
        onUpdateConfig={handleUpdateShulConfig}
        activeEvent={activeEvent}
        seats={seats}
        members={members}
      />

      {/* Sanctuary Setup & Layout Mode Modal (Default Dignitaries vs Blank Manual) */}
      <SetupModeModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onSelectDefaultWithDignitaries={handleSetupDefaultWithDignitaries}
        onSelectBlankManual={handleSetupBlankManual}
        currentSeatsCount={seats.length}
      />

      {/* Congregation & Year Configuration Modal */}
      <CongregationYearModal
        isOpen={isCongregationModalOpen}
        onClose={() => setIsCongregationModalOpen(false)}
        shulConfig={shulConfig}
        onUpdateConfig={handleUpdateShulConfig}
      />
    </div>
  );
}

export default App;
