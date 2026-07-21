import { useEffect, useRef, useState, type InputHTMLAttributes } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number | null;
  onValueChange: (value: number | null) => void;
  nullable?: boolean;
}

function format(value: number | null) {
  return value === null ? '' : String(value);
}

function normalizeLeadingZeros(value: string) {
  return value.replace(/^(-?)0+(?=\d)/, '$1');
}

function bound(value: number, min: number | string | undefined, max: number | string | undefined) {
  const minimum = min === undefined ? null : Number(min);
  const maximum = max === undefined ? null : Number(max);
  const aboveMinimum = minimum === null ? value : Math.max(minimum, value);
  return maximum === null ? aboveMinimum : Math.min(maximum, aboveMinimum);
}

export function AdminNumberInput({
  value,
  onValueChange,
  nullable = false,
  min,
  max,
  onBlur,
  onFocus,
  ...props
}: Props) {
  const [text, setText] = useState(() => format(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(format(value));
  }, [value]);

  return (
    <input
      {...props}
      type="number"
      min={min}
      max={max}
      value={text}
      onFocus={(event) => {
        focused.current = true;
        if (event.currentTarget.value === '0') event.currentTarget.select();
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focused.current = false;
        const enteredValue = event.currentTarget.valueAsNumber;
        const nextValue = Number.isFinite(enteredValue)
          ? bound(enteredValue, min, max)
          : nullable
          ? null
          : bound(0, min, max);
        setText(format(nextValue));
        if (nextValue !== value) onValueChange(nextValue);
        onBlur?.(event);
      }}
      onChange={(event) => {
        const normalized = normalizeLeadingZeros(event.currentTarget.value);
        setText(normalized);
        if (normalized === '') {
          onValueChange(nullable ? null : 0);
          return;
        }
        const parsed = Number(normalized);
        if (Number.isFinite(parsed)) onValueChange(parsed);
      }}
    />
  );
}
