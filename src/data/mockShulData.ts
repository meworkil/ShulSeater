import { Member, Seat, ShulEvent, ShulSection, LayoutElement, Transaction, EmailTemplate } from '../types/shul';

export const INITIAL_SECTIONS: ShulSection[] = [
  {
    id: 'mens_main',
    name: "Men's Main Sanctuary",
    hebrewName: 'בית הכנסת הגדול - עזרת אנשים',
    description: 'Ground floor main hall facing Mizrach wall with Aron Kodesh and central Bimah.',
    capacity: 120,
    floor: 'Ground Floor',
    color: '#2563eb'
  },
  {
    id: 'womens_balcony',
    name: "Women's Balcony (Ezras Nashim)",
    hebrewName: 'עזרת נשים - יציע עליון',
    description: 'Upper mezzanine gallery overlooking the sanctuary with unobstructed sightline.',
    capacity: 70,
    floor: 'Balcony / 2nd Floor',
    color: '#9333ea'
  },
  {
    id: 'womens_main',
    name: "Women's Main Hall (Mechitza)",
    hebrewName: 'עזרת נשים - קומת קרקע (מחיצה)',
    description: 'Ground level sanctuary wing separated by lattice mechitza with easy accessibility.',
    capacity: 45,
    floor: 'Ground Floor',
    color: '#db2777'
  },
  {
    id: 'beis_midrash',
    name: 'Beis Midrash / Daily Minyan Hall',
    hebrewName: 'בית המדרש - חדר תפילה ולימוד',
    description: 'Study hall fitted with multi-seater tables, shtenders, and Seforim library.',
    capacity: 55,
    floor: 'Ground Floor',
    color: '#d97706'
  }
];

export const INITIAL_EVENTS: ShulEvent[] = [
  {
    id: 'rh-5787',
    title: 'Rosh Hashanah 5787 Services',
    hebrewTitle: 'תפילות ראש השנה תשפ״ז',
    category: 'high_holidays',
    date: '2026-09-11',
    hebrewDate: 'א׳-ב׳ תשרי תשפ״ז',
    timeRange: 'Shacharis 7:30 AM | Shofar 10:30 AM | Neilas Hachag 6:45 PM',
    description: 'Annual High Holiday Yamim Noraim seat allocations for Day 1 & Day 2.',
    requiresReservation: true,
    pricing: {
      mizrach: 500,
      vip: 360,
      premium: 250,
      standard: 180,
      youth: 75
    },
    isActive: true,
    totalSeatsBooked: 84
  },
  {
    id: 'yk-5787',
    title: 'Yom Kippur 5787 Services',
    hebrewTitle: 'תפילות יום הכיפורים תשפ״ז',
    category: 'high_holidays',
    date: '2026-09-20',
    hebrewDate: 'י׳ תשרי תשפ״ז',
    timeRange: 'Kol Nidre 6:15 PM | Shacharis 8:00 AM | Neilah 5:30 PM',
    description: 'Holiest day of the year seat reservations including Kol Nidre & Neilah.',
    requiresReservation: true,
    pricing: {
      mizrach: 500,
      vip: 360,
      premium: 250,
      standard: 180,
      youth: 75
    },
    isActive: true,
    totalSeatsBooked: 92
  },
  {
    id: 'sukkot-5787',
    title: 'Sukkot & Simchat Torah 5787',
    hebrewTitle: 'סוכות ושמחת תורה תשפ״ז',
    category: 'high_holidays',
    date: '2026-09-25',
    hebrewDate: 'ט״ו-כ״ג תשרי תשפ״ז',
    timeRange: 'Chag Shacharis 8:30 AM | Hakafot Simchat Torah 7:30 PM',
    description: 'Yom Tov & Chol Hamoed seating + Sukkah meals & Hakafot reservation.',
    requiresReservation: true,
    pricing: {
      mizrach: 200,
      vip: 150,
      premium: 100,
      standard: 75,
      youth: 36
    },
    isActive: false,
    totalSeatsBooked: 40
  },
  {
    id: 'shabbat-makom',
    title: 'Year-Round Shabbat Makom Kavua',
    hebrewTitle: 'מקום קבוע - שבת קודש כל השנה',
    category: 'shabbat',
    date: '2026-08-22',
    hebrewDate: 'כל שבתות השנה',
    timeRange: 'Friday Mincha 7:00 PM | Shabbat Shacharis 8:45 AM',
    description: 'Permanent Shabbat seat reserved exclusively for full-time shul members.',
    requiresReservation: true,
    pricing: {
      mizrach: 360,
      vip: 250,
      premium: 180,
      standard: 120,
      youth: 50
    },
    isActive: false,
    totalSeatsBooked: 65
  },
  {
    id: 'daily-hashkama',
    title: 'Daily Hashkama & Beis Midrash Minyan',
    hebrewTitle: 'מנין ותיקין ובית המדרש יומי',
    category: 'daily_minyan',
    date: '2026-08-19',
    hebrewDate: 'ימי חול',
    timeRange: 'Hashkama 6:15 AM | 2nd Shacharis 7:30 AM | Mincha/Maariv 7:45 PM',
    description: 'Weekday morning & evening minyan seat and personal shtender locker.',
    requiresReservation: false,
    pricing: {
      mizrach: 0,
      vip: 0,
      premium: 0,
      standard: 0,
      youth: 0
    },
    isActive: false,
    totalSeatsBooked: 35
  }
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-101',
    firstName: 'Avraham',
    lastName: 'Goldstein',
    hebrewName: 'אברהם בן יצחק הלוי',
    email: 'a.goldstein@example.com',
    phone: '(212) 555-0192',
    address: '142 West End Ave, Apt 8B, New York, NY',
    membershipTier: 'Family',
    membershipStatus: 'active',
    annualDuesAmount: 1800,
    duesPaidAmount: 1800,
    isDuesPaid: true,
    assignedSeatIds: ['seat-m-mizrach-01', 'seat-m-mizrach-02', 'seat-w-balc-01'],
    familyMembers: [
      { name: 'Sarah Goldstein', hebrewName: 'שרה בת דוד', relationship: 'Spouse', seatId: 'seat-w-balc-01' },
      { name: 'Yitzchak Goldstein', hebrewName: 'יצחק בן אברהם', relationship: 'Son', age: 16, seatId: 'seat-m-mizrach-02' },
      { name: 'Rivka Goldstein', hebrewName: 'רבקה בת אברהם', relationship: 'Daughter', age: 13 }
    ],
    notes: 'Parnas HaChodesh donor. Prefers Mizrach wall front seats.',
    joinedYear: 2014,
    totalDonationsYear: 5400
  },
  {
    id: 'mem-102',
    firstName: 'Dr. Michael',
    lastName: 'Klein',
    hebrewName: 'מיכאל אהרן בן שמואל',
    email: 'dr.mklein@medny.org',
    phone: '(212) 555-0348',
    address: '88 Central Park West, New York, NY',
    membershipTier: 'Full Member',
    membershipStatus: 'active',
    annualDuesAmount: 1200,
    duesPaidAmount: 1200,
    isDuesPaid: true,
    assignedSeatIds: ['seat-m-a-01', 'seat-w-balc-05'],
    familyMembers: [
      { name: 'Chana Klein', hebrewName: 'חנה בת אליעזר', relationship: 'Spouse', seatId: 'seat-w-balc-05' }
    ],
    notes: 'On-call Hatzalah physician. Needs aisle seat for quick exit.',
    joinedYear: 2018,
    totalDonationsYear: 3600
  },
  {
    id: 'mem-103',
    firstName: 'Rabbi Yaakov',
    lastName: 'Stern',
    hebrewName: 'הרב יעקב בן חיים צבי',
    email: 'rabbistern@shul.org',
    phone: '(212) 555-0811',
    address: '215 West 90th St, New York, NY',
    membershipTier: 'Family',
    membershipStatus: 'honorary',
    annualDuesAmount: 0,
    duesPaidAmount: 0,
    isDuesPaid: true,
    assignedSeatIds: ['seat-rabbi-01'],
    familyMembers: [
      { name: 'Rebbetzin Miriam Stern', hebrewName: 'מרים בת מאיר', relationship: 'Spouse', seatId: 'seat-w-front-01' }
    ],
    notes: 'Morah D’Asra - Rabbi Seat North of Aron Kodesh.',
    joinedYear: 2010,
    totalDonationsYear: 0
  },
  {
    id: 'mem-104',
    firstName: 'Cantor Daniel',
    lastName: 'Adler',
    hebrewName: 'דניאל יהודה בן פנחס',
    email: 'chazan.adler@shul.org',
    phone: '(212) 555-0452',
    address: '320 Riverside Dr, New York, NY',
    membershipTier: 'Full Member',
    membershipStatus: 'active',
    annualDuesAmount: 800,
    duesPaidAmount: 800,
    isDuesPaid: true,
    assignedSeatIds: ['seat-chazan-01'],
    familyMembers: [
      { name: 'Tova Adler', hebrewName: 'טובה רחל בת יוסף', relationship: 'Spouse', seatId: 'seat-w-balc-02' }
    ],
    notes: 'Baal Tefillah / Chazan. Seat at Amud in front of Aron.',
    joinedYear: 2015,
    totalDonationsYear: 1200
  },
  {
    id: 'mem-105',
    firstName: 'Binyamin',
    lastName: 'Friedman',
    hebrewName: 'בנימין זאב בן נחום',
    email: 'ben.friedman@capitalfirm.com',
    phone: '(917) 555-0994',
    address: '500 West End Ave, New York, NY',
    membershipTier: 'Family',
    membershipStatus: 'active',
    annualDuesAmount: 1800,
    duesPaidAmount: 900,
    isDuesPaid: false,
    assignedSeatIds: ['seat-m-b-03', 'seat-m-b-04', 'seat-w-balc-07', 'seat-w-balc-08'],
    familyMembers: [
      { name: 'Esther Friedman', hebrewName: 'אסתר לאה בת ברוך', relationship: 'Spouse', seatId: 'seat-w-balc-07' },
      { name: 'Noam Friedman', hebrewName: 'נעם בן בנימין', relationship: 'Son', age: 14, seatId: 'seat-m-b-04' },
      { name: 'Elisheva Friedman', hebrewName: 'אלישבע בת בנימין', relationship: 'Daughter', age: 11, seatId: 'seat-w-balc-08' }
    ],
    notes: 'Paid 50% dues, 2nd installment due Elul 1st.',
    joinedYear: 2019,
    totalDonationsYear: 2500
  },
  {
    id: 'mem-106',
    firstName: 'Shimon',
    lastName: 'Berkowitz',
    hebrewName: 'שמעון אריה בן דוב',
    email: 'sberkowitz@techrealms.io',
    phone: '(347) 555-0128',
    address: '740 Columbus Ave, New York, NY',
    membershipTier: 'Young Couple',
    membershipStatus: 'active',
    annualDuesAmount: 900,
    duesPaidAmount: 900,
    isDuesPaid: true,
    assignedSeatIds: ['seat-m-c-02', 'seat-w-main-02'],
    familyMembers: [
      { name: 'Tamar Berkowitz', hebrewName: 'תמר מלכה בת גרשון', relationship: 'Spouse', seatId: 'seat-w-main-02' }
    ],
    notes: 'New young couple member. Requested ground floor mechitza for stroller access.',
    joinedYear: 2024,
    totalDonationsYear: 1800
  },
  {
    id: 'mem-107',
    firstName: 'Ephraim',
    lastName: 'Schwartz',
    hebrewName: 'אפרים פישל בן קלונימוס',
    email: 'e.schwartz@lawgroup.com',
    phone: '(212) 555-0671',
    address: '175 West 79th St, New York, NY',
    membershipTier: 'Senior',
    membershipStatus: 'active',
    annualDuesAmount: 750,
    duesPaidAmount: 750,
    isDuesPaid: true,
    assignedSeatIds: ['seat-m-a-06'],
    familyMembers: [],
    notes: 'Needs accessible seat with wide legroom near front aisle.',
    joinedYear: 1998,
    totalDonationsYear: 4200
  },
  {
    id: 'mem-108',
    firstName: 'Yosef',
    lastName: 'Rosenberg',
    hebrewName: 'יוסף חיים בן ישראל',
    email: 'yosef.rosenberg@gmail.com',
    phone: '(917) 555-0443',
    address: '610 Amsterdam Ave, New York, NY',
    membershipTier: 'Associate',
    membershipStatus: 'pending',
    annualDuesAmount: 600,
    duesPaidAmount: 0,
    isDuesPaid: false,
    assignedSeatIds: [],
    familyMembers: [],
    notes: 'Visiting for Rosh Hashanah & Yom Kippur from out of town.',
    joinedYear: 2026,
    totalDonationsYear: 500
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-501',
    memberId: 'mem-101',
    memberName: 'Avraham Goldstein',
    type: 'Holiday Seats',
    amount: 1360,
    date: '2026-08-15',
    status: 'Completed',
    paymentMethod: 'Credit Card (Stripe ****4242)',
    referenceNumber: 'CH-982401',
    receiptSent: true
  },
  {
    id: 'tx-502',
    memberId: 'mem-101',
    memberName: 'Avraham Goldstein',
    type: 'Membership Dues',
    amount: 1800,
    date: '2026-07-01',
    status: 'Completed',
    paymentMethod: 'ACH Bank Transfer',
    referenceNumber: 'ACH-11094',
    receiptSent: true
  },
  {
    id: 'tx-503',
    memberId: 'mem-102',
    memberName: 'Dr. Michael Klein',
    type: 'Holiday Seats',
    amount: 610,
    date: '2026-08-12',
    status: 'Completed',
    paymentMethod: 'Credit Card (Amex ****8003)',
    referenceNumber: 'CH-448201',
    receiptSent: true
  },
  {
    id: 'tx-504',
    memberId: 'mem-105',
    memberName: 'Binyamin Friedman',
    type: 'Membership Dues',
    amount: 900,
    date: '2026-08-01',
    status: 'Completed',
    paymentMethod: 'Zelle / Bank Transfer',
    referenceNumber: 'ZEL-7729',
    receiptSent: true
  },
  {
    id: 'tx-505',
    memberId: 'mem-106',
    memberName: 'Shimon Berkowitz',
    type: 'Holiday Seats',
    amount: 430,
    date: '2026-08-10',
    status: 'Completed',
    paymentMethod: 'Credit Card (Visa ****1199)',
    referenceNumber: 'CH-332190',
    receiptSent: true
  },
  {
    id: 'tx-506',
    memberId: 'mem-107',
    memberName: 'Ephraim Schwartz',
    type: 'Aliyah Pledge',
    amount: 1000,
    date: '2026-08-08',
    status: 'Completed',
    paymentMethod: 'Check #4802',
    referenceNumber: 'CHK-4802',
    receiptSent: true
  }
];

export const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tmpl-confirmation',
    name: 'High Holiday Seat Confirmation & Ticket Pass',
    category: 'confirmation',
    subject: 'Seat Reservation Confirmation - {{event_name}} at Congregation Beth Sholom',
    variables: ['{{member_name}}', '{{hebrew_name}}', '{{event_name}}', '{{seat_numbers}}', '{{section_name}}', '{{amount_paid}}', '{{rabbi_message}}'],
    body: `Shalom {{member_name}} ({{hebrew_name}}),

We are pleased to confirm your seat reservations for {{event_name}} at Congregation Beth Sholom.

SEAT DETAILS:
• Section: {{section_name}}
• Reserved Seats: {{seat_numbers}}
• Amount Paid: \${{amount_paid}}

Please find your digital seating pass and entry details attached. If you require any special assistance or seat adjustments, kindly notify the Gabbaim before Rosh Chodesh Elul.

May you and your entire family be inscribed in the Book of Life for a year of health, joy, and peace.

Kesiva VaChasima Tova,
Rabbi Yaakov Stern & The Gabbaim Committee`
  },
  {
    id: 'tmpl-renewal',
    name: 'Makom Kavua (Permanent Seat) Priority Renewal',
    category: 'renewal',
    subject: 'Priority Renewal: Reserve your Makom Kavua for High Holidays 5787',
    variables: ['{{member_name}}', '{{previous_seats}}', '{{deadline_date}}', '{{renewal_link}}'],
    body: `Dear {{member_name}},

As we prepare for the upcoming Yamim Noraim 5787, we are holding your permanent seats ({{previous_seats}}) with exclusive priority until {{deadline_date}}.

To guarantee your family’s traditional seating location, please confirm your renewal and membership dues at {{renewal_link}} or reply directly to the Shul office.

Warmest regards,
Beth Sholom Seating Committee`
  },
  {
    id: 'tmpl-invoice',
    name: 'Annual Synagogue Membership & Dues Invoice',
    category: 'invoice',
    subject: 'Official 501(c)(3) Receipt & Synagogue Dues Statement - {{member_name}}',
    variables: ['{{member_name}}', '{{invoice_number}}', '{{total_due}}', '{{tax_deductible_amount}}', '{{payment_link}}'],
    body: `Dear {{member_name}},

Thank you for your foundational dedication to our Synagogue and community. 

Attached please find your official tax-deductible contribution statement and annual membership statement for the year 5787.

Invoice Number: {{invoice_number}}
Total Amount: \${{total_due}}
Tax-Deductible Portion: \${{tax_deductible_amount}}

Thank you for keeping our sanctuary vibrant and thriving. Tizku L'Mitzvos!`
  }
];

// Helper to generate full realistic floor layout with 100+ seats, Bimah, Aron Kodesh, Tables, Shtenders, Mechitza
export function generateInitialSanctuaryLayout(): { seats: Seat[]; elements: LayoutElement[] } {
  const seats: Seat[] = [];
  const elements: LayoutElement[] = [];

  // ==========================================
  // SECTION 1: MEN'S MAIN SANCTUARY (mens_main)
  // Grid coordinates: Canvas is ~1000 x 850
  // ==========================================

  // 1. Aron Kodesh on North (Mizrach) Wall
  elements.push({
    id: 'elem-aron-kodesh',
    type: 'aron_kodesh',
    label: 'Holy Ark (Aron Kodesh)',
    hebrewLabel: 'ארון הקודש - כותל מזרח',
    sectionId: 'mens_main',
    x: 360,
    y: 20,
    width: 280,
    height: 60,
    color: '#854d0e' // Gold / Rich Wood
  });

  // 2. Rabbi Podium & Dayan Seats
  elements.push({
    id: 'elem-rabbi-desk',
    type: 'rabbi_podium',
    label: "Rabbi's Lectern",
    hebrewLabel: 'עמוד הרב',
    sectionId: 'mens_main',
    x: 270,
    y: 35,
    width: 60,
    height: 40,
    color: '#78350f'
  });

  seats.push({
    id: 'seat-rabbi-01',
    code: 'M-RABBI-01',
    sectionId: 'mens_main',
    row: 'Mizrach',
    number: 1,
    x: 275,
    y: 80,
    tier: 'mizrach',
    price: 500,
    status: 'reserved',
    reservedForMemberId: 'mem-103',
    reservedForMemberName: 'Rabbi Yaakov Stern',
    reservedForHebrewName: 'הרב יעקב שטרן',
    hasShtender: true
  });

  // 3. Cantor / Chazan Amud
  elements.push({
    id: 'elem-chazan-amud',
    type: 'chazan_amud',
    label: "Chazan's Amud",
    hebrewLabel: 'עמוד החזן',
    sectionId: 'mens_main',
    x: 480,
    y: 95,
    width: 40,
    height: 35,
    color: '#b45309'
  });

  seats.push({
    id: 'seat-chazan-01',
    code: 'M-CHAZAN-01',
    sectionId: 'mens_main',
    row: 'Amud',
    number: 1,
    x: 480,
    y: 135,
    tier: 'vip',
    price: 360,
    status: 'reserved',
    reservedForMemberId: 'mem-104',
    reservedForMemberName: 'Cantor Daniel Adler',
    reservedForHebrewName: 'דניאל יהודה אדלר',
    hasShtender: true
  });

  // 4. Mizrach Front Wall VIP Chairs (Goldstein, President, Gabbaim)
  const mizrachOwners = [
    { name: 'Avraham Goldstein', hebrew: 'אברהם בן יצחק', id: 'mem-101', status: 'reserved' as const },
    { name: 'Yitzchak Goldstein', hebrew: 'יצחק בן אברהם', id: 'mem-101', status: 'reserved' as const },
    { name: 'President David Levy', hebrew: 'דוד בן חיים', id: 'mem-109', status: 'reserved' as const },
    { name: 'Gabbai Menachem Shifman', hebrew: 'מנחם בן זליג', id: 'mem-110', status: 'reserved' as const },
    { name: '', hebrew: '', id: '', status: 'available' as const },
    { name: '', hebrew: '', id: '', status: 'available' as const }
  ];

  for (let i = 0; i < 6; i++) {
    const isLeft = i < 2;
    const isRight = i >= 2;
    const xPos = isLeft ? 140 + i * 55 : 670 + (i - 2) * 55;
    const owner = mizrachOwners[i];

    seats.push({
      id: `seat-m-mizrach-${i + 1 < 10 ? '0' + (i + 1) : i + 1}`,
      code: `M-MIZ-${i + 1}`,
      sectionId: 'mens_main',
      row: 'Mizrach',
      number: i + 1,
      x: xPos,
      y: 80,
      tier: 'mizrach',
      price: 500,
      status: owner.status,
      reservedForMemberId: owner.id || undefined,
      reservedForMemberName: owner.name || undefined,
      reservedForHebrewName: owner.hebrew || undefined,
      hasShtender: true
    });
  }

  // 5. Central Bimah (Torah Reading Table)
  elements.push({
    id: 'elem-bimah',
    type: 'bimah',
    label: 'Central Bimah (Shulchan)',
    hebrewLabel: 'הבימה המרכזית ושלחן קריאת התורה',
    sectionId: 'mens_main',
    x: 410,
    y: 350,
    width: 180,
    height: 140,
    color: '#065f46' // Rich Emerald / Velvet
  });

  // Bimah Gabbai Seats
  seats.push({
    id: 'seat-bimah-gab-01',
    code: 'M-BIMAH-G1',
    sectionId: 'mens_main',
    row: 'Bimah',
    number: 1,
    x: 375,
    y: 400,
    tier: 'vip',
    price: 360,
    status: 'reserved',
    reservedForMemberName: 'Gabbai Rishon (Ohev Shalom)',
    hasShtender: true
  });

  seats.push({
    id: 'seat-bimah-gab-02',
    code: 'M-BIMAH-G2',
    sectionId: 'mens_main',
    row: 'Bimah',
    number: 2,
    x: 595,
    y: 400,
    tier: 'vip',
    price: 360,
    status: 'available',
    hasShtender: true
  });

  // 6. Main Sanctuary Left Bank (Rows A - F)
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const leftXStart = 80;
  const yStart = 190;
  const rowSpacing = 85;

  rows.forEach((rowLetter, rIdx) => {
    const y = yStart + rIdx * rowSpacing;

    // Left Bank Pew/Row (5 seats per row)
    for (let c = 1; c <= 5; c++) {
      const x = leftXStart + (c - 1) * 52;
      const seatCode = `M-${rowLetter}-${c < 10 ? '0' + c : c}`;
      const seatId = `seat-m-${rowLetter.toLowerCase()}-${c < 10 ? '0' + c : c}`;
      
      let status: 'available' | 'reserved' | 'makom_kavua' = 'available';
      let memberName: string | undefined = undefined;
      let hebrewName: string | undefined = undefined;
      let memberId: string | undefined = undefined;

      // Assign realistic members
      if (rowLetter === 'A' && c === 1) {
        status = 'reserved';
        memberName = 'Dr. Michael Klein';
        hebrewName = 'מיכאל אהרן בן שמואל';
        memberId = 'mem-102';
      } else if (rowLetter === 'A' && c === 6) {
        status = 'reserved';
        memberName = 'Ephraim Schwartz';
        hebrewName = 'אפרים פישל בן קלונימוס';
        memberId = 'mem-107';
      } else if (rowLetter === 'B' && c === 3) {
        status = 'reserved';
        memberName = 'Binyamin Friedman';
        hebrewName = 'בנימין זאב בן נחום';
        memberId = 'mem-105';
      } else if (rowLetter === 'B' && c === 4) {
        status = 'reserved';
        memberName = 'Noam Friedman';
        hebrewName = 'נעם בן בנימין';
        memberId = 'mem-105';
      } else if (rowLetter === 'C' && c === 2) {
        status = 'reserved';
        memberName = 'Shimon Berkowitz';
        hebrewName = 'שמעון אריה בן דוב';
        memberId = 'mem-106';
      } else if ((rIdx * 5 + c) % 3 === 0) {
        status = 'reserved';
        memberName = `Member #${100 + rIdx * 5 + c}`;
        hebrewName = `ר׳ פלוני אלמוני`;
      }

      seats.push({
        id: seatId,
        code: seatCode,
        sectionId: 'mens_main',
        row: rowLetter,
        number: c,
        x,
        y,
        tier: rIdx < 2 ? 'premium' : 'standard',
        price: rIdx < 2 ? 250 : 180,
        status,
        reservedForMemberId: memberId,
        reservedForMemberName: memberName,
        reservedForHebrewName: hebrewName,
        hasShtender: rIdx % 2 === 0,
        isAccessible: c === 5 // Aisle seat
      });
    }

    // Right Bank (5 seats per row)
    const rightXStart = 660;
    for (let c = 1; c <= 5; c++) {
      const x = rightXStart + (c - 1) * 52;
      const seatNum = c + 5;
      const seatCode = `M-${rowLetter}-${seatNum < 10 ? '0' + seatNum : seatNum}`;
      const seatId = `seat-m-${rowLetter.toLowerCase()}-${seatNum < 10 ? '0' + seatNum : seatNum}`;

      const isReserved = (rIdx + c) % 4 === 1;

      seats.push({
        id: seatId,
        code: seatCode,
        sectionId: 'mens_main',
        row: rowLetter,
        number: seatNum,
        x,
        y,
        tier: rIdx < 2 ? 'premium' : 'standard',
        price: rIdx < 2 ? 250 : 180,
        status: isReserved ? 'reserved' : 'available',
        reservedForMemberName: isReserved ? `Congregant ${rowLetter}${seatNum}` : undefined,
        reservedForHebrewName: isReserved ? `ר׳ משפחת ${seatNum}` : undefined,
        hasShtender: true,
        isAccessible: c === 1 // Aisle seat
      });
    }
  });

  // Pillars with sightlines
  elements.push({
    id: 'elem-pillar-1',
    type: 'pillar',
    label: 'Support Column',
    sectionId: 'mens_main',
    x: 40,
    y: 360,
    width: 24,
    height: 24,
    color: '#64748b'
  });
  elements.push({
    id: 'elem-pillar-2',
    type: 'pillar',
    label: 'Support Column',
    sectionId: 'mens_main',
    x: 935,
    y: 360,
    width: 24,
    height: 24,
    color: '#64748b'
  });

  // ==========================================
  // SECTION 2: WOMEN'S BALCONY (womens_balcony)
  // Upper mezzanine with rows A, B, C, D
  // ==========================================
  const wBalcRows = ['A', 'B', 'C', 'D'];
  wBalcRows.forEach((rowLetter, rIdx) => {
    const y = 140 + rIdx * 80;
    for (let c = 1; c <= 10; c++) {
      const x = 120 + (c - 1) * 75;
      const seatCode = `W-BALC-${rowLetter}${c < 10 ? '0' + c : c}`;
      const seatId = `seat-w-balc-${rowLetter.toLowerCase()}-${c < 10 ? '0' + c : c}`;

      let status: 'available' | 'reserved' = 'available';
      let memberName: string | undefined;
      let hebrewName: string | undefined;

      if (rowLetter === 'A' && c === 1) {
        status = 'reserved';
        memberName = 'Sarah Goldstein';
        hebrewName = 'שרה בת דוד';
      } else if (rowLetter === 'A' && c === 2) {
        status = 'reserved';
        memberName = 'Tova Adler';
        hebrewName = 'טובה רחל אדלר';
      } else if (rowLetter === 'A' && c === 5) {
        status = 'reserved';
        memberName = 'Chana Klein';
        hebrewName = 'חנה קליין';
      } else if (rowLetter === 'B' && c === 7) {
        status = 'reserved';
        memberName = 'Esther Friedman';
        hebrewName = 'אסתר לאה פרידמן';
      } else if (rowLetter === 'B' && c === 8) {
        status = 'reserved';
        memberName = 'Elisheva Friedman';
        hebrewName = 'אלישבע פרידמן';
      } else if ((rIdx + c) % 3 === 0) {
        status = 'reserved';
        memberName = `Member Guest ${rowLetter}-${c}`;
      }

      seats.push({
        id: seatId,
        code: seatCode,
        sectionId: 'womens_balcony',
        row: rowLetter,
        number: c,
        x,
        y,
        tier: rIdx === 0 ? 'premium' : 'standard',
        price: rIdx === 0 ? 250 : 180,
        status,
        reservedForMemberName: memberName,
        reservedForHebrewName: hebrewName,
        isAccessible: c === 1 || c === 10
      });
    }
  });

  // Balcony Railing / Mechitza Indicator
  elements.push({
    id: 'elem-balcony-railing',
    type: 'mechitza',
    label: 'Balcony Overlook Railing & Sightline Glass',
    hebrewLabel: 'מעקה היציע וקו ראייה ישיר',
    sectionId: 'womens_balcony',
    x: 100,
    y: 80,
    width: 800,
    height: 18,
    color: '#9333ea'
  });

  // ==========================================
  // SECTION 3: WOMEN'S MAIN GROUND (womens_main)
  // Behind decorative Mechitza
  // ==========================================
  elements.push({
    id: 'elem-mechitza-ground',
    type: 'mechitza',
    label: 'Artisan Wooden Mechitza Divider',
    hebrewLabel: 'מחיצת עץ מפוארת',
    sectionId: 'womens_main',
    x: 80,
    y: 60,
    width: 840,
    height: 24,
    color: '#db2777'
  });

  ['A', 'B', 'C'].forEach((rowLetter, rIdx) => {
    const y = 140 + rIdx * 90;
    for (let c = 1; c <= 8; c++) {
      const x = 150 + (c - 1) * 85;
      const seatCode = `W-MAIN-${rowLetter}${c < 10 ? '0' + c : c}`;
      const seatId = `seat-w-main-${rowLetter.toLowerCase()}-${c < 10 ? '0' + c : c}`;

      let status: 'available' | 'reserved' = 'available';
      let memberName: string | undefined;
      let hebrewName: string | undefined;

      if (rowLetter === 'A' && c === 1) {
        status = 'reserved';
        memberName = 'Rebbetzin Miriam Stern';
        hebrewName = 'הרבנית מרים שטרן';
      } else if (rowLetter === 'A' && c === 2) {
        status = 'reserved';
        memberName = 'Tamar Berkowitz';
        hebrewName = 'תמר מלכה ברקוביץ';
      }

      seats.push({
        id: seatId,
        code: seatCode,
        sectionId: 'womens_main',
        row: rowLetter,
        number: c,
        x,
        y,
        tier: rIdx === 0 ? 'vip' : 'standard',
        price: rIdx === 0 ? 300 : 180,
        status,
        reservedForMemberName: memberName,
        reservedForHebrewName: hebrewName,
        isAccessible: true
      });
    }
  });

  // ==========================================
  // SECTION 4: BEIS MIDRASH / STUDY HALL
  // Tables with chairs & individual shtenders
  // ==========================================
  // Table 1 (North)
  elements.push({
    id: 'elem-bm-table-1',
    type: 'table',
    label: 'Daf Yomi Study Table North',
    hebrewLabel: 'שלחן דף היומי צפון',
    sectionId: 'beis_midrash',
    x: 200,
    y: 180,
    width: 240,
    height: 90,
    color: '#b45309'
  });

  // Table 1 Chairs (4 north, 4 south)
  for (let c = 1; c <= 4; c++) {
    seats.push({
      id: `seat-bm-t1-n-${c}`,
      code: `BM-T1-${c}`,
      sectionId: 'beis_midrash',
      row: 'Table 1 North',
      number: c,
      x: 210 + (c - 1) * 60,
      y: 130,
      tier: 'standard',
      price: 120,
      status: c === 1 ? 'reserved' : 'available',
      reservedForMemberName: c === 1 ? 'Daf Yomi Maggid Shiur' : undefined,
      hasShtender: true
    });

    seats.push({
      id: `seat-bm-t1-s-${c}`,
      code: `BM-T1-${c + 4}`,
      sectionId: 'beis_midrash',
      row: 'Table 1 South',
      number: c + 4,
      x: 210 + (c - 1) * 60,
      y: 290,
      tier: 'standard',
      price: 120,
      status: 'available',
      hasShtender: true
    });
  }

  // Table 2 (South)
  elements.push({
    id: 'elem-bm-table-2',
    type: 'table',
    label: 'Chavrusa Study Table South',
    hebrewLabel: 'שלחן חברותות דרום',
    sectionId: 'beis_midrash',
    x: 550,
    y: 180,
    width: 240,
    height: 90,
    color: '#b45309'
  });

  for (let c = 1; c <= 4; c++) {
    seats.push({
      id: `seat-bm-t2-n-${c}`,
      code: `BM-T2-${c}`,
      sectionId: 'beis_midrash',
      row: 'Table 2 North',
      number: c,
      x: 560 + (c - 1) * 60,
      y: 130,
      tier: 'standard',
      price: 120,
      status: 'available',
      hasShtender: true
    });

    seats.push({
      id: `seat-bm-t2-s-${c}`,
      code: `BM-T2-${c + 4}`,
      sectionId: 'beis_midrash',
      row: 'Table 2 South',
      number: c + 4,
      x: 560 + (c - 1) * 60,
      y: 290,
      tier: 'standard',
      price: 120,
      status: 'available',
      hasShtender: true
    });
  }

  // Row of dedicated Personal Wooden Shtenders along West Wall
  for (let s = 1; s <= 6; s++) {
    const x = 160 + (s - 1) * 110;
    const y = 480;

    elements.push({
      id: `elem-shtender-podium-${s}`,
      type: 'shtender',
      label: `Personal Shtender #${s}`,
      hebrewLabel: `שטענדער #${s}`,
      sectionId: 'beis_midrash',
      x: x + 5,
      y: y - 25,
      width: 45,
      height: 25,
      color: '#78350f'
    });

    seats.push({
      id: `seat-bm-shtender-${s}`,
      code: `BM-SHT-${s}`,
      sectionId: 'beis_midrash',
      row: 'Shtender Row',
      number: s,
      x: x + 10,
      y: y + 10,
      tier: 'premium',
      price: 180,
      status: s === 1 ? 'reserved' : 'available',
      reservedForMemberName: s === 1 ? 'Gabbai Beis Midrash' : undefined,
      hasShtender: true
    });
  }

  return { seats, elements };
}
