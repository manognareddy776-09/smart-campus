import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryCard } from '../components/CategoryCard';
import { ItemCard } from '../components/ItemCard';
import { HowItWorksPage } from '../pages/HowItWorksPage';
import { Laptop } from 'lucide-react';
import { ItemSummary } from '../types';

describe('Frontend Component Tests', () => {
  it('renders StatusBadge correctly for active and returned items', () => {
    const { rerender } = render(<StatusBadge status="open" type="item" />);
    expect(screen.getByText(/Active Listing/i)).toBeInTheDocument();

    rerender(<StatusBadge status="returned" type="item" />);
    expect(screen.getByText(/Returned to Owner/i)).toBeInTheDocument();

    rerender(<StatusBadge status="claimed" type="item" />);
    expect(screen.getByText(/Under Claim/i)).toBeInTheDocument();
  });

  it('renders CategoryCard and responds to click events', () => {
    const handleClick = vi.fn();
    render(
      <CategoryCard
        name="Electronics"
        icon={Laptop}
        isSelected={false}
        onClick={handleClick}
      />
    );

    const button = screen.getByRole('button', { name: /Electronics/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders ItemCard with public ID, title, and location', () => {
    const mockItem: ItemSummary = {
      id: 'mock-1',
      public_id: 'LF-12345',
      title: 'Sony WH-1000XM4 Headphones',
      category: 'Electronics',
      report_type: 'lost',
      general_location: 'Library 2nd Floor',
      event_date: new Date().toISOString(),
      status: 'open',
      moderation_status: 'approved',
      campus_name: 'Main Engineering Campus',
      created_at: new Date().toISOString(),
    };

    render(
      <BrowserRouter>
        <ItemCard item={mockItem} />
      </BrowserRouter>
    );

    expect(screen.getByText('LF-12345')).toBeInTheDocument();
    expect(screen.getByText('Sony WH-1000XM4 Headphones')).toBeInTheDocument();
    expect(screen.getByText('Library 2nd Floor')).toBeInTheDocument();
    expect(screen.getByText(/Lost Item/i)).toBeInTheDocument();
  });

  it('renders HowItWorksPage with 3 clear steps', () => {
    render(
      <BrowserRouter>
        <HowItWorksPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/How Smart Campus Lost & Found Works/i)).toBeInTheDocument();
    expect(screen.getByText(/1. Report a Lost or Found Belonging/i)).toBeInTheDocument();
    expect(screen.getByText(/2. Automated Smart Similarity Matching/i)).toBeInTheDocument();
    expect(screen.getByText(/3. Private Claim & Safe Campus Return/i)).toBeInTheDocument();
  });
});
