import { notFound, redirect } from 'next/navigation';

export default async function MenuRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ tableId?: string }>;
}) {
  const { tableId } = await searchParams;

  if (!tableId) return notFound();

  const apiBase =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3000/api/v1';

  try {
    const res = await fetch(`${apiBase}/public-menu/by-table/${tableId}`, {
      cache: 'no-store',
    });
    if (!res.ok) return notFound();
    const { slug } = (await res.json()) as { slug: string };
    redirect(`/menu/${slug}?tableId=${tableId}`);
  } catch {
    return notFound();
  }
}
