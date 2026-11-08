export interface LocationOption {
  apiId: string;
  name: string;
}

export async function fetchDistricts(): Promise<LocationOption[]> {
  const res = await fetch('/api/locations/districts');
  const data = await res.json();
  return data.map((d: { _id: string; name: string }) => ({ apiId: d._id, name: d.name }));
}

export async function fetchChildren(parentId: string, level: string): Promise<LocationOption[]> {
  const res = await fetch(
    `/api/locations/children?parentId=${encodeURIComponent(parentId)}&level=${level}`,
  );
  const data = await res.json();
  return data.map((d: { _id: string; name: string }) => ({ apiId: d._id, name: d.name }));
}
