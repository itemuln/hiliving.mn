import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimatedCartIcon } from './AnimatedCartIcon';

describe('animated cart icon', () => {
  const animate = vi.fn();

  beforeEach(() => {
    animate.mockReset();
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: animate,
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  it('animates only when the cart count increases', () => {
    const { rerender } = render(<AnimatedCartIcon itemCount={0} />);
    expect(animate).not.toHaveBeenCalled();

    rerender(<AnimatedCartIcon itemCount={1} />);
    expect(animate).toHaveBeenCalledTimes(1);

    rerender(<AnimatedCartIcon itemCount={0} />);
    expect(animate).toHaveBeenCalledTimes(1);
  });

  it('does not animate when reduced motion is requested', () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
    const { rerender } = render(<AnimatedCartIcon itemCount={0} />);

    rerender(<AnimatedCartIcon itemCount={1} />);

    expect(animate).not.toHaveBeenCalled();
  });
});
