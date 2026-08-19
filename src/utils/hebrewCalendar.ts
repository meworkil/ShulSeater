export const HEBREW_MONTHS = [
  'Nisan', 'Iyyar', 'Sivan', 'Tammuz', 'Av', 'Elul',
  'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar'
];

export const HOLIDAY_METADATA: Record<string, {
  hebrewName: string;
  englishName: string;
  dates: string;
  candleLighting: string;
  shacharisTime: string;
  shofarTime: string;
  yizkor: boolean;
  neilah: boolean;
}> = {
  'rh-5787': {
    hebrewName: 'ראש השנה תשפ״ז',
    englishName: 'Rosh Hashanah 5787',
    dates: 'Sept 11 - 13, 2026 (1-2 Tishrei 5787)',
    candleLighting: '6:54 PM',
    shacharisTime: '7:30 AM',
    shofarTime: '10:30 AM',
    yizkor: false,
    neilah: false
  },
  'yk-5787': {
    hebrewName: 'יום הכיפורים תשפ״ז',
    englishName: 'Yom Kippur 5787',
    dates: 'Sept 20 - 21, 2026 (10 Tishrei 5787)',
    candleLighting: '6:38 PM',
    shacharisTime: '8:00 AM',
    shofarTime: '7:37 PM (Neilah conclusion)',
    yizkor: true,
    neilah: true
  },
  'sukkot-5787': {
    hebrewName: 'סוכות ושמחת תורה תשפ״ז',
    englishName: 'Sukkot & Simchat Torah 5787',
    dates: 'Sept 25 - Oct 4, 2026 (15-23 Tishrei 5787)',
    candleLighting: '6:30 PM',
    shacharisTime: '8:30 AM',
    shofarTime: '',
    yizkor: true,
    neilah: false
  },
  'shabbat-makom': {
    hebrewName: 'שבת קודש - שנת תשפ״ז',
    englishName: 'Shabbat Regular Minyan 5787',
    dates: 'Year-Round Weekly (Shabbat)',
    candleLighting: 'Weekly Schedule',
    shacharisTime: '8:45 AM (Hashkama 7:15 AM)',
    shofarTime: '',
    yizkor: false,
    neilah: false
  }
};

/**
 * Standard Hebrew Alef-Bet row letters sequence for Synagogue seating
 * א, ב, ג, ד, ה, ו, ז, ח, ט, י, יא, יב, יג, יד, טו, טז, יז, יח, יט, כ, כא...
 */
export const HEBREW_ROW_LETTERS: string[] = [
  'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
  'יא', 'יב', 'יג', 'יד', 'טו', 'טז', 'יז', 'יח', 'יט', 'כ',
  'כא', 'כב', 'כג', 'כד', 'כה', 'כו', 'כז', 'כח', 'כט', 'ל',
  'לא', 'לב', 'לג', 'לד', 'לה', 'לו', 'לז', 'לח', 'לט', 'מ',
  'מא', 'מב', 'מג', 'מד', 'מה', 'מו', 'מז', 'מח', 'מט', 'נ'
];

/**
 * Convert numeric index (0-based or 1-based) to Hebrew row letter
 */
export function numberToHebrewRowLetter(num: number): string {
  const index = num <= 0 ? 0 : num - 1;
  if (index < HEBREW_ROW_LETTERS.length) {
    return HEBREW_ROW_LETTERS[index];
  }
  return `שורה ${num}`;
}

/**
 * Convert year number (e.g. 5787) to proper Hebrew Gematria year string (e.g. תשפ״ז with Peh)
 */
export function getHebrewYearString(year: number): string {
  // Pre-calculated modern years
  const knownYears: Record<number, string> = {
    5784: 'תשפ״ד',
    5785: 'תשפ״ה',
    5786: 'תשפ״ו',
    5787: 'תשפ״ז', // Tav=400 + Shin=300 + Peh=80 + Zayin=7 = 787
    5788: 'תשפ״ח',
    5789: 'תשפ״ט',
    5790: 'תש״צ',
    5791: 'תשצ״א',
    5792: 'תשצ״ב',
    5793: 'תשצ״ג',
    5794: 'תשצ״ד',
    5795: 'תשצ״ה'
  };

  if (knownYears[year]) {
    return knownYears[year];
  }

  // Calculate for 5000+ years
  const remainder = year % 1000;
  // 700 is תש (Tav + Shin)
  const hundreds = Math.floor((remainder % 1000) / 100);
  const tens = Math.floor((remainder % 100) / 10);
  const units = remainder % 10;

  let result = 'ת';
  if (hundreds === 7) result = 'תש';
  else if (hundreds === 8) result = 'תת';
  else if (hundreds === 9) result = 'תתק';

  const tensMap: Record<number, string> = {
    1: 'י', 2: 'כ', 3: 'ל', 4: 'מ', 5: 'נ', 6: 'ס', 7: 'ע', 8: 'פ', 9: 'צ'
  };
  const unitsMap: Record<number, string> = {
    1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט'
  };

  // Special cases for 15, 16
  const lastTwo = tens * 10 + units;
  if (lastTwo === 15) {
    result += 'ט״ו';
  } else if (lastTwo === 16) {
    result += 'ט״ז';
  } else {
    if (tensMap[tens]) result += tensMap[tens];
    if (unitsMap[units]) {
      // Add gershayim before last letter
      result += '״' + unitsMap[units];
    } else {
      result += '״';
    }
  }

  return result;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

export function generateLabelQRUrl(seatCode: string, memberName: string, eventId: string): string {
  // SVG encoded QR or verification code string
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `BETH_SHOLOM_SEAT:${eventId}:${seatCode}:${memberName}`
  )}`;
}

/**
 * Synchronize shul events list with the active congregation year (e.g. 5787 • תשפ״ז)
 */
export function syncEventsWithYear(events: any[], year: number, hebrewYear: string): any[] {
  const secularStart = year - 3761;

  return events.map(evt => {
    // If it's a High Holiday event or year-specific service, update titles and dates
    if (evt.id.startsWith('rh-') || (evt.category === 'high_holidays' && evt.title.includes('Rosh Hashanah'))) {
      return {
        ...evt,
        id: `rh-${year}`,
        title: `Rosh Hashanah ${year} Services`,
        hebrewTitle: `תפילות ראש השנה ${hebrewYear}`,
        date: `${secularStart}-09-11`,
        hebrewDate: `א׳-ב׳ תשרי ${hebrewYear}`
      };
    }
    if (evt.id.startsWith('yk-') || (evt.category === 'high_holidays' && evt.title.includes('Yom Kippur'))) {
      return {
        ...evt,
        id: `yk-${year}`,
        title: `Yom Kippur ${year} Services`,
        hebrewTitle: `תפילות יום הכיפורים ${hebrewYear}`,
        date: `${secularStart}-09-20`,
        hebrewDate: `י׳ תשרי ${hebrewYear}`
      };
    }
    if (evt.id.startsWith('sukkot-') || evt.title.includes('Sukkot')) {
      return {
        ...evt,
        id: `sukkot-${year}`,
        title: `Sukkot & Simchat Torah ${year}`,
        hebrewTitle: `סוכות ושמחת תורה ${hebrewYear}`,
        date: `${secularStart}-09-25`,
        hebrewDate: `ט״ו-כ״ג תשרי ${hebrewYear}`
      };
    }
    if (evt.id === 'shabbat-makom' || evt.category === 'shabbat') {
      return {
        ...evt,
        title: `Year-Round Shabbat Makom Kavua (${year})`,
        hebrewTitle: `מקום קבוע - שבת קודש (${hebrewYear})`,
        hebrewDate: `שנת ${hebrewYear}`
      };
    }
    if (evt.id === 'daily-hashkama' || evt.category === 'daily_minyan') {
      return {
        ...evt,
        title: `Daily Minyan & Study Hall (${year})`,
        hebrewTitle: `מנין יומי ובית המדרש (${hebrewYear})`,
        hebrewDate: `שנת ${hebrewYear}`
      };
    }
    return evt;
  });
}
