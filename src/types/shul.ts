export type SectionType = 'mens_main' | 'womens_balcony' | 'womens_main' | 'beis_midrash' | 'youth_minyan' | string;

export type ElementType = 
  | 'seat' 
  | 'pew_row' 
  | 'table' 
  | 'shtender' 
  | 'aron_kodesh' 
  | 'bimah' 
  | 'chazan_amud' 
  | 'mechitza' 
  | 'pillar' 
  | 'door' 
  | 'window' 
  | 'rabbi_podium'
  | 'text_label';

export type SeatTier = 'mizrach' | 'vip' | 'premium' | 'standard' | 'accessible' | 'youth';

export type SeatStatus = 'available' | 'reserved' | 'makom_kavua' | 'blocked' | 'selected';

export interface Seat {
  id: string;
  code: string; // e.g. "M-A-01" or "W-BALC-12"
  sectionId: SectionType;
  tableId?: string; // ID of the parent table if attached to a table
  row: string; // "A", "B", "1", "2"
  number: number;
  x: number; // in grid pixels
  y: number;
  width?: number;
  height?: number;
  rotation?: number; // degrees
  tier: SeatTier;
  price: number; // in USD
  status: SeatStatus;
  reservedForMemberId?: string;
  reservedForMemberName?: string;
  reservedForHebrewName?: string;
  reservationNotes?: string;
  hasShtender?: boolean;
  isAccessible?: boolean;
  isNearPillar?: boolean;
  eventId?: string; // specific event or 'all'
  blockId?: string; // ID of the parent sanctuary block for moving entire block together
  blockLabel?: string; // Label of the block e.g. "Block Alef" or "East Wing"
}

export interface LayoutElement {
  id: string;
  type: ElementType;
  label?: string;
  hebrewLabel?: string;
  sectionId: SectionType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  color?: string;
  seatCount?: number; // for pew rows or tables
  seats?: Seat[];
  tableConfig?: {
    topSeats?: number;
    bottomSeats?: number;
    leftSeats?: number;
    rightSeats?: number;
    orientation?: 'horizontal' | 'vertical';
    woodColor?: string;
  };
}

export interface ShulSection {
  id: SectionType;
  name: string;
  hebrewName: string;
  description: string;
  capacity: number;
  floor: string;
  color: string;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  hebrewName: string; // e.g., "Avraham ben Moshe"
  email: string;
  phone: string;
  address: string;
  membershipTier: 'Family' | 'Full Member' | 'Associate' | 'Young Couple' | 'Senior' | 'Student' | string;
  membershipStatus: 'active' | 'pending' | 'honorary' | 'lapsed';
  annualDuesAmount: number;
  duesPaidAmount: number;
  isDuesPaid: boolean;
  assignedSeatIds: string[]; // Makom Kavua
  familyMembers: {
    name: string;
    hebrewName: string;
    relationship: 'Spouse' | 'Son' | 'Daughter' | 'Parent' | 'Other' | string;
    age?: number;
    seatId?: string;
  }[];
  yahrzeits?: {
    id: string;
    deceasedName: string;
    deceasedHebrewName: string;
    relationship: string;
    hebrewDate: string;
  }[];
  aliyahPreference?: 'Kohen' | 'Levi' | 'Yisrael';
  notes?: string;
  joinedYear: number;
  lastDonationDate?: string;
  totalDonationsYear?: number;
  pledgeBalance?: number;
}

export interface ShulEvent {
  id: string;
  title: string;
  hebrewTitle: string;
  category: 'high_holidays' | 'shabbat' | 'daily_minyan' | 'simcha' | 'special';
  date: string;
  hebrewDate: string;
  timeRange: string;
  description: string;
  requiresReservation: boolean;
  pricing: {
    mizrach: number;
    vip: number;
    premium: number;
    standard: number;
    youth: number;
  };
  isActive: boolean;
  totalSeatsBooked: number;
}

export interface Reservation {
  id: string;
  eventId: string;
  eventName: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  hebrewName: string;
  seatIds: string[];
  seatCodes: string[];
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid' | 'waived';
  paymentMethod?: 'Credit Card' | 'Check' | 'ACH Bank Transfer' | 'Cash' | 'Zelle';
  transactionId?: string;
  createdAt: string;
  assignedBy: 'Online Portal' | 'Gabbai Admin' | 'Office Staff';
  specialRequests?: string;
}

export interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  type: 'Membership Dues' | 'Holiday Seats' | 'Aliyah Pledge' | 'Building Fund' | 'Yizkor Donation' | 'General Donation' | 'Kiddush Sponsorship';
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Refunded';
  paymentMethod: string;
  referenceNumber: string;
  invoiceUrl?: string;
  receiptSent: boolean;
  eventOrParshaInfo?: string; // e.g., "Shabbos Bereishis - Shlishi"
  notes?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'confirmation' | 'reminder' | 'invoice' | 'renewal';
  variables: string[];
}
