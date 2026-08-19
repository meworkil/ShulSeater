import { Seat, LayoutElement, SectionType, SeatTier } from '../types/shul';

export interface TableConfigOptions {
  tableId: string;
  tableLabel?: string;
  hebrewLabel?: string;
  sectionId: SectionType;
  x: number;
  y: number;
  topSeats: number;
  bottomSeats: number;
  leftSeats?: number;
  rightSeats?: number;
  orientation?: 'horizontal' | 'vertical';
  tableNumber?: number | string;
  prefix?: string;
  defaultPrice?: number;
  defaultTier?: SeatTier;
  hasShtender?: boolean;
}

export function generateTableWithSeats(options: TableConfigOptions): {
  tableElement: LayoutElement;
  seats: Seat[];
} {
  const {
    tableId,
    tableLabel,
    hebrewLabel,
    sectionId,
    x,
    y,
    topSeats,
    bottomSeats,
    leftSeats = 0,
    rightSeats = 0,
    orientation = 'horizontal',
    tableNumber = 1,
    prefix = 'T',
    defaultPrice = 150,
    defaultTier = 'standard',
    hasShtender = true
  } = options;

  const maxSeatsAlongLength = Math.max(topSeats, bottomSeats, 1);
  const seatSpacing = 58;
  const paddingX = 20;

  const isVertical = orientation === 'vertical';
  const calculatedWidth = isVertical ? 80 : Math.max(120, maxSeatsAlongLength * seatSpacing + paddingX * 2);
  const calculatedHeight = isVertical ? Math.max(120, maxSeatsAlongLength * seatSpacing + paddingX * 2) : 75;

  const totalSeats = topSeats + bottomSeats + leftSeats + rightSeats;
  const defaultLabel = tableLabel || `${totalSeats}-Seater Table #${tableNumber}`;
  const defaultHebrew = hebrewLabel || `שולחן ${totalSeats} מקומות #${tableNumber}`;

  const tableElement: LayoutElement = {
    id: tableId,
    type: 'table',
    label: defaultLabel,
    hebrewLabel: defaultHebrew,
    sectionId,
    x,
    y,
    width: calculatedWidth,
    height: calculatedHeight,
    color: '#b45309',
    tableConfig: {
      topSeats,
      bottomSeats,
      leftSeats,
      rightSeats,
      orientation
    }
  };

  const seats: Seat[] = [];
  let seatCounter = 1;

  if (!isVertical) {
    // Horizontal Table (Seats on North/Top and South/Bottom)
    if (topSeats > 0) {
      const startX = x + (calculatedWidth - topSeats * seatSpacing) / 2 + 5;
      for (let s = 1; s <= topSeats; s++) {
        const codeNum = seatCounter;
        seats.push({
          id: `seat-${tableId}-n-${s}`,
          code: `${prefix}${tableNumber}-A${s}`,
          sectionId,
          tableId,
          row: `${prefix}${tableNumber}`,
          number: codeNum,
          x: Math.round(startX + (s - 1) * seatSpacing),
          y: Math.round(y - 45),
          tier: defaultTier,
          price: defaultPrice,
          status: 'available',
          hasShtender
        });
        seatCounter++;
      }
    }

    if (bottomSeats > 0) {
      const startX = x + (calculatedWidth - bottomSeats * seatSpacing) / 2 + 5;
      for (let s = 1; s <= bottomSeats; s++) {
        const codeNum = seatCounter;
        seats.push({
          id: `seat-${tableId}-s-${s}`,
          code: `${prefix}${tableNumber}-B${s}`,
          sectionId,
          tableId,
          row: `${prefix}${tableNumber}`,
          number: codeNum,
          x: Math.round(startX + (s - 1) * seatSpacing),
          y: Math.round(y + calculatedHeight + 8),
          tier: defaultTier,
          price: defaultPrice,
          status: 'available',
          hasShtender
        });
        seatCounter++;
      }
    }
  } else {
    // Vertical Table (Seats on West/Left and East/Right)
    const maxAlongY = Math.max(topSeats, bottomSeats, 1);
    if (topSeats > 0) { // Used as Left/West side
      const startY = y + (calculatedHeight - topSeats * seatSpacing) / 2 + 5;
      for (let s = 1; s <= topSeats; s++) {
        const codeNum = seatCounter;
        seats.push({
          id: `seat-${tableId}-w-${s}`,
          code: `${prefix}${tableNumber}-L${s}`,
          sectionId,
          tableId,
          row: `${prefix}${tableNumber}`,
          number: codeNum,
          x: Math.round(x - 45),
          y: Math.round(startY + (s - 1) * seatSpacing),
          tier: defaultTier,
          price: defaultPrice,
          status: 'available',
          hasShtender
        });
        seatCounter++;
      }
    }

    if (bottomSeats > 0) { // Used as Right/East side
      const startY = y + (calculatedHeight - bottomSeats * seatSpacing) / 2 + 5;
      for (let s = 1; s <= bottomSeats; s++) {
        const codeNum = seatCounter;
        seats.push({
          id: `seat-${tableId}-e-${s}`,
          code: `${prefix}${tableNumber}-R${s}`,
          sectionId,
          tableId,
          row: `${prefix}${tableNumber}`,
          number: codeNum,
          x: Math.round(x + calculatedWidth + 8),
          y: Math.round(startY + (s - 1) * seatSpacing),
          tier: defaultTier,
          price: defaultPrice,
          status: 'available',
          hasShtender
        });
        seatCounter++;
      }
    }
  }

  return { tableElement, seats };
}

export function recalculateTableSeats(
  table: LayoutElement,
  existingSeatsForTable: Seat[],
  newTopSeats: number,
  newBottomSeats: number,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
): { updatedTable: LayoutElement; updatedSeats: Seat[] } {
  const isVertical = orientation === 'vertical';
  const maxSeatsAlongLength = Math.max(newTopSeats, newBottomSeats, 1);
  const seatSpacing = 58;
  const paddingX = 20;

  const calculatedWidth = isVertical ? 80 : Math.max(120, maxSeatsAlongLength * seatSpacing + paddingX * 2);
  const calculatedHeight = isVertical ? Math.max(120, maxSeatsAlongLength * seatSpacing + paddingX * 2) : 75;

  const totalSeats = newTopSeats + newBottomSeats;

  const updatedTable: LayoutElement = {
    ...table,
    width: calculatedWidth,
    height: calculatedHeight,
    label: table.label?.replace(/\d+-Seater/, `${totalSeats}-Seater`) || `${totalSeats}-Seater Table`,
    tableConfig: {
      ...table.tableConfig,
      topSeats: newTopSeats,
      bottomSeats: newBottomSeats,
      orientation
    }
  };

  const updatedSeats: Seat[] = [];
  let seatCounter = 1;
  const prefixMatch = existingSeatsForTable[0]?.code?.match(/^([A-Za-z0-9]+)-/);
  const prefix = prefixMatch ? prefixMatch[1] : 'T';

  if (!isVertical) {
    // Horizontal
    if (newTopSeats > 0) {
      const startX = table.x + (calculatedWidth - newTopSeats * seatSpacing) / 2 + 5;
      for (let s = 1; s <= newTopSeats; s++) {
        const existing = existingSeatsForTable[seatCounter - 1];
        updatedSeats.push({
          id: existing?.id || `seat-${table.id}-n-${s}-${Date.now()}`,
          code: `${prefix}-A${s}`,
          sectionId: table.sectionId,
          tableId: table.id,
          row: existing?.row || prefix,
          number: seatCounter,
          x: Math.round(startX + (s - 1) * seatSpacing),
          y: Math.round(table.y - 45),
          tier: existing?.tier || 'standard',
          price: existing?.price || 150,
          status: existing?.status || 'available',
          reservedForMemberName: existing?.reservedForMemberName,
          reservedForHebrewName: existing?.reservedForHebrewName,
          hasShtender: true
        });
        seatCounter++;
      }
    }

    if (newBottomSeats > 0) {
      const startX = table.x + (calculatedWidth - newBottomSeats * seatSpacing) / 2 + 5;
      for (let s = 1; s <= newBottomSeats; s++) {
        const existing = existingSeatsForTable[seatCounter - 1];
        updatedSeats.push({
          id: existing?.id || `seat-${table.id}-s-${s}-${Date.now()}`,
          code: `${prefix}-B${s}`,
          sectionId: table.sectionId,
          tableId: table.id,
          row: existing?.row || prefix,
          number: seatCounter,
          x: Math.round(startX + (s - 1) * seatSpacing),
          y: Math.round(table.y + calculatedHeight + 8),
          tier: existing?.tier || 'standard',
          price: existing?.price || 150,
          status: existing?.status || 'available',
          reservedForMemberName: existing?.reservedForMemberName,
          reservedForHebrewName: existing?.reservedForHebrewName,
          hasShtender: true
        });
        seatCounter++;
      }
    }
  } else {
    // Vertical
    if (newTopSeats > 0) {
      const startY = table.y + (calculatedHeight - newTopSeats * seatSpacing) / 2 + 5;
      for (let s = 1; s <= newTopSeats; s++) {
        const existing = existingSeatsForTable[seatCounter - 1];
        updatedSeats.push({
          id: existing?.id || `seat-${table.id}-w-${s}-${Date.now()}`,
          code: `${prefix}-L${s}`,
          sectionId: table.sectionId,
          tableId: table.id,
          row: existing?.row || prefix,
          number: seatCounter,
          x: Math.round(table.x - 45),
          y: Math.round(startY + (s - 1) * seatSpacing),
          tier: existing?.tier || 'standard',
          price: existing?.price || 150,
          status: existing?.status || 'available',
          reservedForMemberName: existing?.reservedForMemberName,
          reservedForHebrewName: existing?.reservedForHebrewName,
          hasShtender: true
        });
        seatCounter++;
      }
    }

    if (newBottomSeats > 0) {
      const startY = table.y + (calculatedHeight - newBottomSeats * seatSpacing) / 2 + 5;
      for (let s = 1; s <= newBottomSeats; s++) {
        const existing = existingSeatsForTable[seatCounter - 1];
        updatedSeats.push({
          id: existing?.id || `seat-${table.id}-e-${s}-${Date.now()}`,
          code: `${prefix}-R${s}`,
          sectionId: table.sectionId,
          tableId: table.id,
          row: existing?.row || prefix,
          number: seatCounter,
          x: Math.round(table.x + calculatedWidth + 8),
          y: Math.round(startY + (s - 1) * seatSpacing),
          tier: existing?.tier || 'standard',
          price: existing?.price || 150,
          status: existing?.status || 'available',
          reservedForMemberName: existing?.reservedForMemberName,
          reservedForHebrewName: existing?.reservedForHebrewName,
          hasShtender: true
        });
        seatCounter++;
      }
    }
  }

  return { updatedTable, updatedSeats };
}
