type LinkedRecord = { data: Record<string, string> };
type LinkField = "parentAreaId" | "dependsOnId";

export function createsCircularLink(ownId: string | undefined, parentId: string, field: LinkField, byId: ReadonlyMap<string, LinkedRecord>) {
  const visited = new Set(ownId ? [ownId] : []);
  let cursor = parentId;
  while (cursor) {
    if (visited.has(cursor)) return true;
    visited.add(cursor);
    cursor = byId.get(cursor)?.data[field] || "";
  }
  return false;
}

export function isFutureObservation(value: string, today = new Date().toISOString().slice(0, 10)) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && value > today;
}
