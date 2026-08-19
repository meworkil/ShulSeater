import { Seat, LayoutElement, Member, ShulEvent, Reservation, Transaction, EmailTemplate, ShulSection } from '../types/shul';
import { INITIAL_SECTIONS, INITIAL_EVENTS, INITIAL_MEMBERS, INITIAL_TRANSACTIONS, INITIAL_EMAIL_TEMPLATES, generateInitialSanctuaryLayout } from '../data/mockShulData';

const STORAGE_KEYS = {
  SEATS: 'shulseat_seats_v1',
  ELEMENTS: 'shulseat_elements_v1',
  MEMBERS: 'shulseat_members_v1',
  EVENTS: 'shulseat_events_v1',
  RESERVATIONS: 'shulseat_reservations_v1',
  TRANSACTIONS: 'shulseat_transactions_v1',
  EMAIL_TEMPLATES: 'shulseat_email_templates_v1',
  SECTIONS: 'shulseat_sections_v1',
  SHUL_CONFIG: 'shulseat_config_v1'
};

export interface ShulConfig {
  name: string;
  hebrewName: string;
  activeYear: number;
  activeHebrewYear: string;
  secularYear: string;
  rabbiName: string;
  presidentName: string;
  address: string;
  phone: string;
  email: string;
  taxId: string; // 501(c)(3) EIN
  currencySymbol: string;
  activeEventId: string;
}

export const DEFAULT_SHUL_CONFIG: ShulConfig = {
  name: 'Congregation Beth Sholom',
  hebrewName: 'קהילת בית שלום',
  activeYear: 5787,
  activeHebrewYear: 'תשפ״ז',
  secularYear: '2026-2027',
  rabbiName: 'Rabbi Yaakov Stern (Mara D’Asra)',
  presidentName: 'Mr. David Levy (President)',
  address: '142 West 86th Street, New York, NY 10024',
  phone: '(212) 555-8300',
  email: 'office@bethsholomny.org',
  taxId: '13-5892104',
  currencySymbol: '$',
  activeEventId: 'rh-5787'
};

export function loadSeats(): Seat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEATS);
    if (raw) return JSON.parse(raw);
    const gen = generateInitialSanctuaryLayout();
    saveSeats(gen.seats);
    saveElements(gen.elements);
    return gen.seats;
  } catch (e) {
    return generateInitialSanctuaryLayout().seats;
  }
}

export function loadElements(): LayoutElement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ELEMENTS);
    if (raw) return JSON.parse(raw);
    const gen = generateInitialSanctuaryLayout();
    return gen.elements;
  } catch (e) {
    return generateInitialSanctuaryLayout().elements;
  }
}

export function loadMembers(): Member[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    return raw ? JSON.parse(raw) : INITIAL_MEMBERS;
  } catch (e) {
    return INITIAL_MEMBERS;
  }
}

export function loadEvents(): ShulEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return raw ? JSON.parse(raw) : INITIAL_EVENTS;
  } catch (e) {
    return INITIAL_EVENTS;
  }
}

export function loadSections(): ShulSection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SECTIONS);
    return raw ? JSON.parse(raw) : INITIAL_SECTIONS;
  } catch (e) {
    return INITIAL_SECTIONS;
  }
}

export function saveSections(sections: ShulSection[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
  } catch (e) {
    console.error('Failed to save sections', e);
  }
}

export function loadReservations(): Reservation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    if (raw) return JSON.parse(raw);
    const initial: Reservation[] = [
      {
        id: 'res-901',
        eventId: 'event-rosh-hashanah-5787',
        eventName: 'Rosh Hashanah 5787 Services',
        memberId: 'mem-101',
        memberName: 'Avraham Goldstein',
        memberEmail: 'a.goldstein@example.com',
        memberPhone: '(212) 555-0192',
        hebrewName: 'אברהם בן יצחק הלוי',
        seatIds: ['seat-m-mizrach-01', 'seat-m-mizrach-02', 'seat-w-balc-01'],
        seatCodes: ['M-MIZ-1', 'M-MIZ-2', 'W-BALC-A01'],
        totalAmount: 1250,
        paidAmount: 1250,
        paymentStatus: 'paid',
        paymentMethod: 'Credit Card',
        transactionId: 'tx-501',
        createdAt: '2026-08-15',
        assignedBy: 'Online Portal'
      },
      {
        id: 'res-902',
        eventId: 'event-rosh-hashanah-5787',
        eventName: 'Rosh Hashanah 5787 Services',
        memberId: 'mem-102',
        memberName: 'Dr. Michael Klein',
        memberEmail: 'dr.mklein@medny.org',
        memberPhone: '(212) 555-0348',
        hebrewName: 'מיכאל אהרן בן שמואל',
        seatIds: ['seat-m-a-01', 'seat-w-balc-a05'],
        seatCodes: ['M-A-01', 'W-BALC-A05'],
        totalAmount: 500,
        paidAmount: 500,
        paymentStatus: 'paid',
        paymentMethod: 'Credit Card',
        transactionId: 'tx-503',
        createdAt: '2026-08-12',
        assignedBy: 'Gabbai Admin'
      }
    ];
    saveReservations(initial);
    return initial;
  } catch (e) {
    return [];
  }
}

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return raw ? JSON.parse(raw) : INITIAL_TRANSACTIONS;
  } catch (e) {
    return INITIAL_TRANSACTIONS;
  }
}

export function loadEmailTemplates(): EmailTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EMAIL_TEMPLATES);
    return raw ? JSON.parse(raw) : INITIAL_EMAIL_TEMPLATES;
  } catch (e) {
    return INITIAL_EMAIL_TEMPLATES;
  }
}

export function saveEmailTemplates(templates: EmailTemplate[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.EMAIL_TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to save email templates', e);
  }
}

export function loadConfig(): ShulConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHUL_CONFIG);
    if (!raw) return DEFAULT_SHUL_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SHUL_CONFIG,
      ...parsed,
      activeYear: parsed.activeYear || 5787,
      activeHebrewYear: parsed.activeHebrewYear || 'תשפ״ז',
      secularYear: parsed.secularYear || '2026-2027'
    };
  } catch (e) {
    return DEFAULT_SHUL_CONFIG;
  }
}

export function loadShulData() {
  let seats: Seat[] = [];
  let elements: LayoutElement[] = [];
  let members: Member[] = [];
  let events: ShulEvent[] = [];
  let reservations: Reservation[] = [];
  let transactions: Transaction[] = [];
  let emailTemplates: EmailTemplate[] = [];
  let sections: ShulSection[] = [];
  let config: ShulConfig = DEFAULT_SHUL_CONFIG;

  try {
    const rawSeats = localStorage.getItem(STORAGE_KEYS.SEATS);
    const rawElements = localStorage.getItem(STORAGE_KEYS.ELEMENTS);
    const rawMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    const rawEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
    const rawReservations = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    const rawTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const rawTemplates = localStorage.getItem(STORAGE_KEYS.EMAIL_TEMPLATES);
    const rawSections = localStorage.getItem(STORAGE_KEYS.SECTIONS);
    const rawConfig = localStorage.getItem(STORAGE_KEYS.SHUL_CONFIG);

    if (rawSeats && rawElements) {
      seats = JSON.parse(rawSeats);
      elements = JSON.parse(rawElements);
    } else {
      const generated = generateInitialSanctuaryLayout();
      seats = generated.seats;
      elements = generated.elements;
      saveSeats(seats);
      saveElements(elements);
    }

    members = rawMembers ? JSON.parse(rawMembers) : INITIAL_MEMBERS;
    events = rawEvents ? JSON.parse(rawEvents) : INITIAL_EVENTS;
    transactions = rawTransactions ? JSON.parse(rawTransactions) : INITIAL_TRANSACTIONS;
    emailTemplates = rawTemplates ? JSON.parse(rawTemplates) : INITIAL_EMAIL_TEMPLATES;
    sections = rawSections ? JSON.parse(rawSections) : INITIAL_SECTIONS;
    config = rawConfig ? JSON.parse(rawConfig) : DEFAULT_SHUL_CONFIG;

    if (rawReservations) {
      reservations = JSON.parse(rawReservations);
    } else {
      // Seed initial reservations from reserved seats
      reservations = [
        {
          id: 'res-901',
          eventId: 'rh-5787',
          eventName: 'Rosh Hashanah 5787 Services',
          memberId: 'mem-101',
          memberName: 'Avraham Goldstein',
          memberEmail: 'a.goldstein@example.com',
          memberPhone: '(212) 555-0192',
          hebrewName: 'אברהם בן יצחק',
          seatIds: ['seat-m-mizrach-01', 'seat-m-mizrach-02', 'seat-w-balc-01'],
          seatCodes: ['M-MIZ-1', 'M-MIZ-2', 'W-BALC-A01'],
          totalAmount: 1250,
          paidAmount: 1250,
          paymentStatus: 'paid',
          paymentMethod: 'Credit Card',
          transactionId: 'tx-501',
          createdAt: '2026-08-15',
          assignedBy: 'Online Portal'
        },
        {
          id: 'res-902',
          eventId: 'rh-5787',
          eventName: 'Rosh Hashanah 5787 Services',
          memberId: 'mem-102',
          memberName: 'Dr. Michael Klein',
          memberEmail: 'dr.mklein@medny.org',
          memberPhone: '(212) 555-0348',
          hebrewName: 'מיכאל אהרן בן שמואל',
          seatIds: ['seat-m-a-01', 'seat-w-balc-a05'],
          seatCodes: ['M-A-01', 'W-BALC-A05'],
          totalAmount: 500,
          paidAmount: 500,
          paymentStatus: 'paid',
          paymentMethod: 'Credit Card',
          transactionId: 'tx-503',
          createdAt: '2026-08-12',
          assignedBy: 'Gabbai Admin'
        }
      ];
      saveReservations(reservations);
    }
  } catch (err) {
    console.error('Error loading Shul data from storage:', err);
    const generated = generateInitialSanctuaryLayout();
    seats = generated.seats;
    elements = generated.elements;
    members = INITIAL_MEMBERS;
    events = INITIAL_EVENTS;
    transactions = INITIAL_TRANSACTIONS;
    emailTemplates = INITIAL_EMAIL_TEMPLATES;
    sections = INITIAL_SECTIONS;
  }

  return {
    seats,
    elements,
    members,
    events,
    reservations,
    transactions,
    emailTemplates,
    sections,
    config
  };
}

export function saveSeats(seats: Seat[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(seats));
  } catch (e) {
    console.error('Failed to save seats to localStorage', e);
  }
}

export function saveElements(elements: LayoutElement[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.ELEMENTS, JSON.stringify(elements));
  } catch (e) {
    console.error('Failed to save elements to localStorage', e);
  }
}

export function saveMembers(members: Member[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  } catch (e) {
    console.error('Failed to save members to localStorage', e);
  }
}

export function saveEvents(events: ShulEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save events to localStorage', e);
  }
}

export function saveReservations(reservations: Reservation[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
  } catch (e) {
    console.error('Failed to save reservations to localStorage', e);
  }
}

export function saveTransactions(transactions: Transaction[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save transactions to localStorage', e);
  }
}

export function saveConfig(config: ShulConfig) {
  try {
    localStorage.setItem(STORAGE_KEYS.SHUL_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config to localStorage', e);
  }
}

export function exportFullBackupJSON(): string {
  const data = {
    version: '1.0',
    exportTimestamp: new Date().toISOString(),
    config: JSON.parse(localStorage.getItem(STORAGE_KEYS.SHUL_CONFIG) || '{}'),
    seats: JSON.parse(localStorage.getItem(STORAGE_KEYS.SEATS) || '[]'),
    elements: JSON.parse(localStorage.getItem(STORAGE_KEYS.ELEMENTS) || '[]'),
    members: JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS) || '[]'),
    events: JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || '[]'),
    reservations: JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVATIONS) || '[]'),
    transactions: JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]'),
    sections: JSON.parse(localStorage.getItem(STORAGE_KEYS.SECTIONS) || '[]')
  };
  return JSON.stringify(data, null, 2);
}

export function importFullBackupJSON(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!data.seats || !data.members) {
      throw new Error('Invalid backup file structure.');
    }
    if (data.seats) saveSeats(data.seats);
    if (data.elements) saveElements(data.elements);
    if (data.members) saveMembers(data.members);
    if (data.events) saveEvents(data.events);
    if (data.reservations) saveReservations(data.reservations);
    if (data.transactions) saveTransactions(data.transactions);
    if (data.config) saveConfig(data.config);
    return true;
  } catch (err) {
    console.error('Error importing backup JSON:', err);
    return false;
  }
}

export function exportMembersToCSV(members: Member[]): string {
  const headers = ['ID', 'First Name', 'Last Name', 'Hebrew Name', 'Email', 'Phone', 'Membership Tier', 'Status', 'Annual Dues', 'Dues Paid', 'Assigned Seats', 'Family Members'];
  const rows = members.map(m => [
    m.id,
    `"${m.firstName}"`,
    `"${m.lastName}"`,
    `"${m.hebrewName}"`,
    m.email,
    `"${m.phone}"`,
    m.membershipTier,
    m.membershipStatus,
    m.annualDuesAmount,
    m.duesPaidAmount,
    `"${m.assignedSeatIds.join(', ')}"`,
    `"${m.familyMembers.map(f => f.name + ' (' + f.relationship + ')').join('; ')}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function exportSeatingRosterToCSV(seats: Seat[], members: Member[]): string {
  const headers = ['Seat Code', 'Section', 'Row', 'Number', 'Tier', 'Price', 'Status', 'Reserved For', 'Hebrew Name', 'Has Shtender', 'Accessible'];
  const rows = seats.map(s => [
    s.code,
    s.sectionId,
    s.row,
    s.number,
    s.tier,
    s.price,
    s.status,
    `"${s.reservedForMemberName || ''}"`,
    `"${s.reservedForHebrewName || ''}"`,
    s.hasShtender ? 'YES' : 'NO',
    s.isAccessible ? 'YES' : 'NO'
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
