import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../features/auth/AuthContext';
import { authenticatedUser, accountJson } from '../test/accountFixtures';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import { VerifyEmailPage } from './VerifyEmailPage';

const refresh = vi.fn(async () => undefined);
const authContext: AuthContextValue = {
  state: { status: 'authenticated', user: authenticatedUser },
  hydrationError: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh,
  replaceUser: vi.fn(),
};

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname + location.search}</span>;
}

function renderPage(element: React.ReactNode, entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthContext.Provider value={authContext}>
        <Routes>
          <Route path="*" element={<>{element}<LocationProbe /></>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
});

describe('account recovery pages', () => {
  it('shows the same accepted forgot-password message without account disclosure', async () => {
    document.cookie = 'XSRF-TOKEN=token; path=/';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(accountJson({ data: { message: 'generic' } })));
    renderPage(<ForgotPasswordPage />, '/forgot-password');
    fireEvent.change(screen.getByLabelText('Имэйл'), { target: { value: 'missing@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сэргээх заавар авах' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Хэрэв энэ имэйлээр бүртгэл байгаа бол');
    expect(screen.queryByText(/бүртгэл олдсон/i)).not.toBeInTheDocument();
  });

  it('validates matching reset passwords, submits the URL token, and removes it from history', async () => {
    document.cookie = 'XSRF-TOKEN=token; path=/';
    const fetchMock = vi.fn().mockResolvedValue(accountJson({ data: { message: 'done' } }));
    vi.stubGlobal('fetch', fetchMock);
    renderPage(<ResetPasswordPage />, '/reset-password?token=sensitive-token-value');
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/reset-password'));
    expect(screen.getByTestId('location')).not.toHaveTextContent('token=');
    fireEvent.change(screen.getByLabelText('Шинэ нууц үг'), { target: { value: 'NewPassword123' } });
    fireEvent.change(screen.getByLabelText('Шинэ нууц үг давтах'), { target: { value: 'NewPassword123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Нууц үг шинэчлэх' }));
    expect(await screen.findByRole('status')).toHaveTextContent('амжилттай шинэчлэгдлээ');
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/password-reset/confirm',
      expect.objectContaining({ body: expect.stringContaining('sensitive-token-value') }));
  });

  it('confirms verification automatically, removes the query token, and refreshes account state', async () => {
    document.cookie = 'XSRF-TOKEN=token; path=/';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(accountJson({ data: { message: 'verified' } })));
    renderPage(<VerifyEmailPage />, '/verify-email?token=verification-token-value');
    expect(await screen.findByText('Имэйл хаяг амжилттай баталгаажлаа.')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/verify-email');
    expect(screen.getByTestId('location')).not.toHaveTextContent('token=');
    expect(refresh).toHaveBeenCalled();
  });

  it('shows a safe combined invalid, expired, or used reset-link error', async () => {
    document.cookie = 'XSRF-TOKEN=token; path=/';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(accountJson({ error: { code: 'PASSWORD_RESET_TOKEN_INVALID' } }, 400)));
    renderPage(<ResetPasswordPage />, '/reset-password?token=used-token-value');
    fireEvent.change(screen.getByLabelText('Шинэ нууц үг'), { target: { value: 'NewPassword123' } });
    fireEvent.change(screen.getByLabelText('Шинэ нууц үг давтах'), { target: { value: 'NewPassword123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Нууц үг шинэчлэх' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('хүчингүй, хугацаа дууссан эсвэл өмнө ашиглагдсан');
  });
});
