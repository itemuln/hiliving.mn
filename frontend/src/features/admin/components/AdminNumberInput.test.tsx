import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { AdminNumberInput } from './AdminNumberInput';

function RequiredNumber() {
  const [value, setValue] = useState(0);
  return (
    <AdminNumberInput
      aria-label="Required number"
      min="0"
      value={value}
      onValueChange={(next) => setValue(next ?? 0)}
    />
  );
}

function OptionalNumber() {
  const [value, setValue] = useState<number | null>(null);
  return (
    <AdminNumberInput
      aria-label="Optional number"
      min="0"
      max="100"
      step="0.01"
      value={value}
      nullable
      onValueChange={setValue}
    />
  );
}

describe('AdminNumberInput', () => {
  it('removes leading zeros and lets a zero-valued field be cleared while editing', () => {
    render(<RequiredNumber />);
    const input = screen.getByRole('spinbutton', { name: 'Required number' });

    expect(input).toHaveValue(0);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '023' } });
    expect(input).toHaveValue(23);

    fireEvent.change(input, { target: { value: '' } });
    expect(input).toHaveValue(null);
    fireEvent.blur(input);
    expect(input).toHaveValue(0);

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '-5' } });
    fireEvent.blur(input);
    expect(input).toHaveValue(0);
  });

  it('keeps decimal zero prefixes and leaves nullable fields empty', () => {
    render(<OptionalNumber />);
    const input = screen.getByRole('spinbutton', { name: 'Optional number' });

    expect(input).toHaveValue(null);
    fireEvent.change(input, { target: { value: '0.25' } });
    expect(input).toHaveValue(0.25);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(input).toHaveValue(null);

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '125' } });
    fireEvent.blur(input);
    expect(input).toHaveValue(100);
  });
});
