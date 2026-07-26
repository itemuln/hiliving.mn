import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PaymentPage } from './PaymentPage';
import type { PaymentInstructions } from '../features/checkout/order.types';

const orderNumber = 'HL-20260726-ABCDEF123456';
const payment: PaymentInstructions = {
  provider: 'QPAY',
  status: 'AWAITING_PAYMENT',
  amount: 14000,
  currency: 'MNT',
  qrText: '000201-qpay',
  qrImageDataUrl: 'data:image/png;base64,cXItcG5n',
  shortUrl: 'https://s.qpay.mn/test',
  expiresAt: '2026-07-26T12:00:00Z',
  paidAt: null,
  deeplinks: [
    {
      name: 'Khan bank',
      description: 'Хаан банк',
      logoUrl: 'https://qpay.mn/q/logo/khanbank.png',
      link: 'khanbank://q?qPay_QRcode=000201-qpay',
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
});

describe('PaymentPage', () => {
  it('renders QPay QR and deeplink instructions and verifies payment through the backend', async () => {
    document.cookie = 'XSRF-TOKEN=token; path=/';
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: payment }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter
        initialEntries={[{ pathname: `/checkout/payment/${orderNumber}`, state: { payment } }]}
      >
        <Routes>
          <Route path="/checkout/payment/:orderNumber" element={<PaymentPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('img', { name: 'QPay төлбөрийн QR код' })).toHaveAttribute(
      'src',
      payment.qrImageDataUrl
    );
    expect(screen.getByRole('link', { name: 'Khan bank' })).toHaveAttribute(
      'href',
      payment.deeplinks[0].link
    );

    fireEvent.click(screen.getByRole('button', { name: 'Төлбөр шалгах' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/api/v1/orders/${orderNumber}/payment/check`),
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    );
  });
});
