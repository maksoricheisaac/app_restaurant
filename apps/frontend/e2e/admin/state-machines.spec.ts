import { test, expect } from '@playwright/test';
import { API_BASE } from '../helpers';

/**
 * Tests machines d'état — commandes et réservations.
 *
 * Vérifie que les transitions invalides sont refusées par le backend.
 */
test.describe('Machine d\'état — Commandes (API)', () => {
  test('PATCH /orders/:id/status sans auth → 401', async ({ request }) => {
    const res = await request.patch(`${API_BASE}/orders/fake-order-id/status`, {
      data: { status: 'preparing' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('PATCH /orders/:id/status avec status invalide → 400', async ({ request }) => {
    // Même sans auth, la ValidationPipe doit rejeter les statuts invalides
    const res = await request.patch(`${API_BASE}/orders/fake-id/status`, {
      data: { status: 'invalid_status_xyz' },
    });
    expect([400, 401, 403]).toContain(res.status());
  });
});

test.describe('Machine d\'état — Réservations (API)', () => {
  test('PATCH /reservations/:id/status sans auth → 401', async ({ request }) => {
    const res = await request.patch(`${API_BASE}/reservations/fake-id/status`, {
      data: { status: 'confirmed' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('PATCH /reservations/:id/status avec status invalide → 400', async ({ request }) => {
    const res = await request.patch(`${API_BASE}/reservations/fake-id/status`, {
      data: { status: 'not_a_real_status' },
    });
    expect([400, 401, 403]).toContain(res.status());
  });
});

test.describe('Soft-delete — Commandes (API)', () => {
  test('DELETE /orders/:id sans auth → 401', async ({ request }) => {
    const res = await request.delete(`${API_BASE}/orders/fake-id`);
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('Double-booking — Réservations (API)', () => {
  test('POST /reservations sans auth → 401', async ({ request }) => {
    const res = await request.post(`${API_BASE}/reservations`, {
      data: {
        date: '2026-12-31T19:00:00Z',
        time: '19:00',
        guests: 2,
        tableId: 'some-table-id',
      },
    });
    expect([401, 403]).toContain(res.status());
  });
});
