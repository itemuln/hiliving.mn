import { createContext } from 'react';
import type { ApiRequestError } from '../../api/http';
import type { CartItem, CartQuote } from './cart.types';

export interface CartContextValue {
  readonly items: readonly CartItem[];
  readonly itemCount: number;
  readonly quote: CartQuote | null;
  readonly quoteStatus: 'idle' | 'loading' | 'ready' | 'error';
  readonly quoteError: ApiRequestError | null;
  addItem(productSlug: string, quantity?: number, maximum?: number): void;
  removeItem(productSlug: string): void;
  setQuantity(productSlug: string, quantity: number, maximum?: number): void;
  clearCart(): void;
  refreshQuote(): Promise<CartQuote | null>;
}

export const CartContext = createContext<CartContextValue | null>(null);
