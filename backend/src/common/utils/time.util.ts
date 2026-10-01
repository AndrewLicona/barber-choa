/**
 * Time utility functions for schedule and appointment calculations.
 * Standardizes time manipulation across backend modules.
 */

export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function minutesToTime(minutes: number): string {
  const safeMins = Math.max(0, minutes);
  const hrs = Math.floor(safeMins / 60);
  const mins = safeMins % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function hasTimeOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number,
): boolean {
  return start1 < end2 && end1 > start2;
}

export function generateTimeSlots(
  startMinutes: number,
  endMinutes: number,
  slotDurationMinutes: number,
  excludedRanges: Array<{ start: number; end: number }> = [],
): string[] {
  const slots: string[] = [];
  for (let t = startMinutes; t + slotDurationMinutes <= endMinutes; t += slotDurationMinutes) {
    const slotEnd = t + slotDurationMinutes;
    const isOverlapping = excludedRanges.some((range) =>
      hasTimeOverlap(t, slotEnd, range.start, range.end),
    );
    if (!isOverlapping) {
      slots.push(minutesToTime(t));
    }
  }
  return slots;
}
