import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { accountJson, authenticatedUser } from '../../test/accountFixtures';
import { AuthContext, type AuthContextValue } from '../auth/AuthContext';
import { AddressList } from './AddressList';
import { PasswordChangeForm } from './PasswordChangeForm';
import { ProfileForm } from './ProfileForm';

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
});
const replaceUser = vi.fn();
const context: AuthContextValue = {
  state: { status: 'authenticated', user: authenticatedUser },
  hydrationError: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  replaceUser,
};

describe('account forms', () => {
  it('updates profile data and refreshes auth state', async () => {
    document.cookie = 'XSRF-TOKEN=token; path=/';
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(accountJson({ data: { ...authenticatedUser, firstName: 'Updated' } }))
    );
    render(
      <MemoryRouter>
        <AuthContext.Provider value={context}>
          <ProfileForm />
        </AuthContext.Provider>
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText('Нэр'), { target: { value: 'Updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Хадгалах' }));
    expect(await screen.findByText('Мэдээлэл амжилттай шинэчлэгдлээ.')).toBeInTheDocument();
    expect(replaceUser).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Updated' }));
  });

  it('confirms a successful password change', async () => {
    document.cookie = 'XSRF-TOKEN=token; path=/';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    render(<PasswordChangeForm />);
    fireEvent.change(screen.getByLabelText('Одоогийн нууц үг'), {
      target: { value: 'Current1234' },
    });
    fireEvent.change(screen.getByLabelText('Шинэ нууц үг'), {
      target: { value: 'NewPassword123' },
    });
    fireEvent.change(screen.getByLabelText('Шинэ нууц үг давтах'), {
      target: { value: 'NewPassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Нууц үг шинэчлэх' }));
    expect(await screen.findByText('Нууц үг амжилттай шинэчлэгдлээ.')).toBeInTheDocument();
  });

  it('renders empty addresses then creates a default address', async () => {
    document.cookie = 'XSRF-TOKEN=token; path=/';
    const created = {
      id: 1,
      label: 'Гэр',
      cityOrProvince: 'Улаанбаатар',
      districtOrSoum: 'СБД',
      khorooOrBag: null,
      addressLine: 'Энхтайвны өргөн чөлөө',
      additionalDetails: null,
      recipientName: 'Temuulen',
      recipientPhone: '+97699112233',
      defaultAddress: true,
      createdAt: '',
      updatedAt: '',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(accountJson({ data: [] }))
      .mockResolvedValueOnce(accountJson({ data: created }, 201))
      .mockResolvedValueOnce(accountJson({ data: [created] }));
    vi.stubGlobal('fetch', fetchMock);
    render(<AddressList />);
    expect(await screen.findByText('Хүргэлтийн хаяг нэмээгүй байна.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Нэршил'), { target: { value: 'Гэр' } });
    fireEvent.change(screen.getByLabelText('Хот / аймаг'), { target: { value: 'Улаанбаатар' } });
    fireEvent.change(screen.getByLabelText('Дүүрэг / сум'), { target: { value: 'СБД' } });
    fireEvent.change(screen.getByLabelText('Дэлгэрэнгүй хаяг'), {
      target: { value: 'Энхтайвны өргөн чөлөө' },
    });
    fireEvent.change(screen.getByLabelText('Хүлээн авагч'), { target: { value: 'Temuulen' } });
    fireEvent.change(screen.getByLabelText('Хүлээн авагчийн утас'), {
      target: { value: '99112233' },
    });
    fireEvent.click(screen.getByLabelText('Үндсэн хаяг болгох'));
    fireEvent.click(screen.getByRole('button', { name: 'Хадгалах' }));
    await waitFor(() => expect(screen.getByText('Үндсэн')).toBeInTheDocument());
  });
});
