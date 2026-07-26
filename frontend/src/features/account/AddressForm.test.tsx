import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MapAddressSelection } from './addressMap';
import { AddressForm } from './AddressForm';

vi.mock('./AddressMapPicker', () => ({
  AddressMapPicker: ({ onSelect }: { onSelect(selection: MapAddressSelection): void }) => (
    <button
      type="button"
      onClick={() =>
        onSelect({
          latitude: 47.918873,
          longitude: 106.917701,
          cityOrProvince: 'Улаанбаатар',
          districtOrSoum: 'Сүхбаатар дүүрэг',
          khorooOrBag: '1-р хороо',
          addressLine: '12, Энхтайвны өргөн чөлөө',
          displayName: '12, Энхтайвны өргөн чөлөө, Улаанбаатар',
        })
      }
    >
      Mock байршил сонгох
    </button>
  ),
}));

describe('address form map picker', () => {
  it('opens the map and applies its address to editable form fields', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AddressForm editing={null} busy={false} onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Газрын зураг дээр сонгох' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Mock байршил сонгох' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Хот / аймаг')).toHaveValue('Улаанбаатар');
      expect(screen.getByLabelText('Дүүрэг / сум')).toHaveValue('Сүхбаатар дүүрэг');
      expect(screen.getByLabelText('Хороо / баг')).toHaveValue('1-р хороо');
      expect(screen.getByLabelText('Дэлгэрэнгүй хаяг')).toHaveValue('12, Энхтайвны өргөн чөлөө');
    });
    expect(screen.queryByLabelText('Нэршил')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Хүлээн авагч')).not.toBeInTheDocument();
  });

  it('stores entrance and apartment without exposing internal compatibility fields', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AddressForm editing={null} busy={false} onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Дүүрэг / сум'), {
      target: { value: 'Хан-Уул дүүрэг' },
    });
    fireEvent.change(screen.getByLabelText('Хороо / баг'), { target: { value: '17-р хороо' } });
    fireEvent.change(screen.getByLabelText('Дэлгэрэнгүй хаяг'), {
      target: { value: 'Зайсангийн гудамж' },
    });
    fireEvent.change(screen.getByLabelText('Орц'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Тоот'), { target: { value: '1204' } });
    fireEvent.change(screen.getByLabelText('Хүлээн авагчийн утас'), {
      target: { value: '99112233' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Хадгалах' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Хүргэлтийн хаяг',
          recipientName: 'Хэрэглэгч',
          districtOrSoum: 'Хан-Уул дүүрэг',
          khorooOrBag: '17-р хороо',
          additionalDetails: 'Орц: 2 · Тоот: 1204',
        })
      )
    );
  });
});
