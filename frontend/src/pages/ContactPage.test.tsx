import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ContactPage } from './ContactPage';

describe('ContactPage', () => {
  it('renders direct, accessible contact actions and office details', () => {
    render(
      <MemoryRouter initialEntries={['/contact']}>
        <ContactPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Холбоо барих' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '7755-8888' })[0]).toHaveAttribute(
      'href',
      'tel:+97677558888'
    );
    expect(screen.getAllByRole('link', { name: 'info@hilivingmgl.mn' })[0]).toHaveAttribute(
      'href',
      'mailto:info@hilivingmgl.mn'
    );
    expect(screen.getByRole('link', { name: 'Газрын зураг дээр харах' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://www.google.com/maps/search/')
    );
    expect(screen.getByText('Ажиллах цаг').parentElement).toHaveTextContent(
      'Даваа – Бямба: 10:00 – 20:00'
    );
  });
});
