import { useContext } from 'react';
import { CartContext } from './CartContext';

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error('useCart must be used within CartProvider');
  return cart;
}

export function useOptionalCart() {
  return useContext(CartContext);
}
