export const DELIVERY_FEE_CENTS = 1600;
export const DELIVERY_RADIUS_MILES = 20;
export const DELIVERY_ORIGIN = { lat: 31.77373, lng: -106.29631 };
export const STORE_TIME_ZONE = "America/Denver";
export const LEAD_TIME_HOURS = 48;
export const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export function localSlot(instant: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STORE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(instant);
  const get = (name: string) => parts.find(p => p.type === name)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

export function slotInstant(date: string, time: string) {
  const wall = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(wall)) throw new Error("Choose a valid delivery date and time.");
  let instant = wall;
  for (let i = 0; i < 3; i++) {
    const local = localSlot(new Date(instant));
    instant += wall - Date.parse(`${local.date}T${local.time}:00Z`);
  }
  const roundTrip = localSlot(new Date(instant));
  if (roundTrip.date !== date || roundTrip.time !== time) throw new Error("Choose a valid delivery date and time.");
  return new Date(instant);
}

export function earliestSlot(now = new Date()) {
  let t = new Date(Math.ceil((now.getTime() + LEAD_TIME_HOURS * 3600000) / 900000) * 900000);
  let slot = localSlot(t);
  while (slot.time < "09:00" || slot.time > "21:00") {
    t = new Date(t.getTime() + 900000);
    slot = localSlot(t);
  }
  return slot;
}

export function validateSlot(date: string, time: string, now = new Date()) {
  const instant = slotInstant(date, time);
  if (time < "09:00" || time > "21:00") throw new Error("Delivery hours are 9 AM to 9 PM, El Paso time.");
  if (instant.getTime() < now.getTime() + LEAD_TIME_HOURS * 3600000) throw new Error("Please allow at least 48 hours to prepare your order.");
  if (instant.getTime() > now.getTime() + 90 * 86400000) throw new Error("Please choose a date within the next 90 days.");
  return instant.toISOString();
}

export function distanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (n: number) => n * Math.PI / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 3958.7613 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
