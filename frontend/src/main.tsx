import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './features/auth/AuthProvider';
import { CartProvider } from './features/cart/CartProvider';
import '@fontsource/roboto/cyrillic-ext-400.css';
import '@fontsource/roboto/cyrillic-400.css';
import '@fontsource/roboto/latin-400.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
