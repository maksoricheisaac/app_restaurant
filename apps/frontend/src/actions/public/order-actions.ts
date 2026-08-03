'use server';

const API = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export async function getTableById({ tableId }: { tableId: string }) {
  try {
    // Endpoint public — aucune authentification requise.
    const res = await fetch(`${API}/tables/${tableId}`, { cache: 'no-store' });
    if (!res.ok) return { data: null };
    const table = await res.json();
    return { data: { table } };
  } catch {
    return { data: null };
  }
}
