export function formatEnvId(date, serial) {
  const d = date ?? new Date();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const yyyy = d.getFullYear();
  const serialStr = String(serial).padStart(3, "0");
  return `ENV-${m}${day}${yyyy}-${serialStr}`;
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}
