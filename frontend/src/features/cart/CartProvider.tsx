import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccountApiError } from '../../api/accountApi';
import { quoteCart } from '../../api/commerceApi';
import { useAuth } from '../auth/useAuth';
import { CartContext } from './CartContext';
import type { CartItem, CartQuote } from './cart.types';

const STORAGE_KEY = 'hiliving.cart.v1';
const CART_VERSION = 1;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Action =
  | { type: 'add'; slug: string; quantity: number; maximum: number }
  | { type: 'set'; slug: string; quantity: number; maximum: number }
  | { type: 'remove'; slug: string }
  | { type: 'clear' };

function loadCart(): readonly CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { version?: unknown; items?: unknown };
    if (parsed.version !== CART_VERSION || !Array.isArray(parsed.items)) return [];
    const quantities = new Map<string, number>();
    for (const value of parsed.items) {
      if (!value || typeof value !== 'object') continue;
      const item = value as { productSlug?: unknown; quantity?: unknown };
      if (
        typeof item.productSlug !== 'string' ||
        !slugPattern.test(item.productSlug) ||
        !Number.isInteger(item.quantity) ||
        Number(item.quantity) < 1
      )
        continue;
      quantities.set(
        item.productSlug,
        Math.min(99, (quantities.get(item.productSlug) ?? 0) + Number(item.quantity))
      );
    }
    return [...quantities].map(([productSlug, quantity]) => ({ productSlug, quantity }));
  } catch {
    return [];
  }
}

function reducer(items: readonly CartItem[], action: Action): readonly CartItem[] {
  if (action.type === 'clear') return [];
  if (action.type === 'remove') return items.filter((item) => item.productSlug !== action.slug);
  const quantity = Math.max(1, Math.min(action.maximum, action.quantity));
  const existing = items.find((item) => item.productSlug === action.slug);
  if (action.type === 'add') {
    const nextQuantity = Math.min(action.maximum, (existing?.quantity ?? 0) + quantity);
    return existing
      ? items.map((item) =>
          item.productSlug === action.slug ? { ...item, quantity: nextQuantity } : item
        )
      : [...items, { productSlug: action.slug, quantity: nextQuantity }];
  }
  return existing
    ? items.map((item) => (item.productSlug === action.slug ? { ...item, quantity } : item))
    : items;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { state: authState } = useAuth();
  const [items, dispatch] = useReducer(reducer, undefined, loadCart);
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [quoteError, setQuoteError] = useState<AccountApiError | null>(null);
  const requestSequence = useRef(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: CART_VERSION, items }));
  }, [items]);

  const refreshQuote = useCallback(async () => {
    const sequence = ++requestSequence.current;
    if (items.length === 0) {
      setQuote(null);
      setQuoteError(null);
      setQuoteStatus('idle');
      return null;
    }
    setQuoteStatus('loading');
    setQuoteError(null);
    try {
      const nextQuote = await quoteCart(items);
      if (sequence === requestSequence.current) {
        setQuote(nextQuote);
        setQuoteStatus('ready');
      }
      return nextQuote;
    } catch (failure) {
      const error =
        failure instanceof AccountApiError
          ? failure
          : new AccountApiError(null, 'SERVICE_UNAVAILABLE');
      if (sequence === requestSequence.current) {
        setQuote(null);
        setQuoteError(error);
        setQuoteStatus('error');
      }
      return null;
    }
  }, [items]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void refreshQuote(), 300);
    return () => window.clearTimeout(timeout);
  }, [authState.status, authState.user?.id, refreshQuote]);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      quote,
      quoteStatus,
      quoteError,
      addItem(productSlug: string, quantity = 1, maximum = 99) {
        dispatch({ type: 'add', slug: productSlug, quantity, maximum: Math.min(99, maximum) });
      },
      removeItem(productSlug: string) {
        dispatch({ type: 'remove', slug: productSlug });
      },
      setQuantity(productSlug: string, quantity: number, maximum = 99) {
        dispatch({ type: 'set', slug: productSlug, quantity, maximum: Math.min(99, maximum) });
      },
      clearCart() {
        dispatch({ type: 'clear' });
      },
      refreshQuote,
    }),
    [items, quote, quoteError, quoteStatus, refreshQuote]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
