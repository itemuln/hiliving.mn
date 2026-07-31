import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../features/auth/AuthContext';
import { authenticatedUser } from '../test/accountFixtures';
import { AccountPage } from './AccountPage';

const context: AuthContextValue = {
  state: { status: 'authenticated', user: authenticatedUser },
  hydrationError: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  replaceUser: vi.fn(),
};

describe('AccountPage', () => {
  it('keeps email verification inside the registration information panel', () => {
    render(
      <MemoryRouter initialEntries={['/account']}>
        <AuthContext.Provider value={context}>
          <AccountPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    const informationPanel = screen
      .getByRole('heading', { name: 'Бүртгэлийн мэдээлэл' })
      .closest('section');
    expect(informationPanel).not.toBeNull();
    expect(within(informationPanel!).getByText(authenticatedUser.email)).toBeInTheDocument();
    expect(within(informationPanel!).getByText('Имэйл баталгаажаагүй')).toBeInTheDocument();
    expect(
      within(informationPanel!).getByRole('button', { name: 'Баталгаажуулах имэйл авах' })
    ).toBeInTheDocument();
    expect(within(informationPanel!).getByRole('link', { name: 'Мэдээлэл засах' })).toHaveAttribute(
      'href',
      '/account/profile'
    );
    expect(
      screen.queryByRole('link', { name: 'Миний захиалгуудыг харах' })
    ).not.toBeInTheDocument();
  });

  it('shows verified state as a green icon beside the email', () => {
    const verifiedContext: AuthContextValue = {
      ...context,
      state: {
        status: 'authenticated',
        user: { ...authenticatedUser, emailVerified: true },
      },
    };
    render(
      <MemoryRouter initialEntries={['/account']}>
        <AuthContext.Provider value={verifiedContext}>
          <AccountPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByRole('img', { name: 'Имэйл баталгаажсан' })).toHaveClass('text-green-600');
    expect(screen.queryByText('Имэйл баталгаажаагүй')).not.toBeInTheDocument();
  });
});
