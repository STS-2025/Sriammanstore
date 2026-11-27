import type { DeliverySlot } from "../types";

const SLOT_TIME_PATTERN = /(\d{1,2})(?:[:.](\d{2}))?\s*(AM|PM)?/gi;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function getSlotEndMinutes(title: string): number | null {
  const times = [...title.matchAll(SLOT_TIME_PATTERN)];
  if (times.length < 2) return null;

  const start = times[times.length - 2];
  const end = times[times.length - 1];
  const toMinutes = (match: RegExpMatchArray, meridiem?: string | null) => {
    let hours = Number(match[1]);
    const minutes = Number(match[2] || 0);
    const period = (meridiem || match[3] || "").toUpperCase();

    if (period === "AM" || period === "PM") {
      hours %= 12;
      if (period === "PM") hours += 12;
    }
    return hours * 60 + minutes;
  };

  let endMinutes = toMinutes(end, end[3] || start[3]);
  const startMinutes = toMinutes(start);
  // Handle compact ranges such as "12 to 1.00" as noon to 1 PM.
  if (!end[3] && !start[3] && endMinutes < startMinutes && startMinutes >= 12 * 60) {
    endMinutes += 12 * 60;
  }
  return endMinutes;
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Expands configured daily slots into bookable choices for today and tomorrow. */
export function getBookableDeliverySlots(
  configuredSlots: DeliverySlot[],
  now: Date,
): DeliverySlot[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return [0, 1].flatMap((dayOffset) => {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dayName = dayOffset === 0 ? "Today" : "Tomorrow";
    const dateLabel = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(date);

    return configuredSlots.flatMap((slot) => {
      if (dayOffset === 0) {
        const endMinutes = getSlotEndMinutes(slot.title);
        if (endMinutes !== null) {
          const slotEnd = new Date(date);
          slotEnd.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
          if (now.getTime() > slotEnd.getTime() - TWO_HOURS_MS) return [];
        }
      }

      return [{
        ...slot,
        id: `${dateKey(date)}_${slot.id}`,
        title: `${dayName} (${dateLabel}) · ${slot.title}`,
      }];
    });
  });
}
