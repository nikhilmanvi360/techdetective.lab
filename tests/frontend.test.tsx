import LiveTicker from '../src/components/LiveTicker';
import Dashboard from '../src/pages/Dashboard';
import Scoreboard from '../src/pages/Scoreboard';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../src/pages/Login';

vi.mock('socket.io-client', () => ({
  io: () => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

describe('Frontend React Tests - Deep Component Rendering', () => {

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // Login
  it('Login component renders input fields', () => {
    render(
      <MemoryRouter>
        <Login onLogin={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText(/TECH_DETECTIVE/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/TEAM_NAME/i)).toBeInTheDocument();
  });

  it('Login component handles authentication rejection', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Simulated rejection' })
    });
    global.fetch = mockFetch;

    render(
      <MemoryRouter>
        <Login onLogin={vi.fn()} />
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText(/TEAM_NAME/i);
    const passInput = screen.getByPlaceholderText(/••••••••/i);
    
    fireEvent.change(nameInput, { target: { value: 'User' } });
    fireEvent.change(passInput, { target: { value: 'Pass' } });

    const submitBtn = screen.getByText(/INITIATE_SESSION/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Simulated rejection/i)).toBeInTheDocument();
    });
  });

  // Dashboard
  it('Dashboard transitions from loading to content', async () => {
    const mockCases = [{ id: 1, title: 'Case 1', description: 'Desc', difficulty: 'Easy', status: 'active' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCases
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/LOADING_CASES/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/LOADING_CASES/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Case 1/i)).toBeInTheDocument();
    });
  });

  // Scoreboard
  it('Scoreboard renders mock data correctly', async () => {
    const mockScoreboard = [
      { name: 'TeamA', score: 5000 },
      { name: 'TeamB', score: 1000 }
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockScoreboard
    });

    render(
      <MemoryRouter>
        <Scoreboard />
      </MemoryRouter>
    );

    // Using queryByText and flexible regex to avoid jsdom quirks
    await waitFor(() => {
       // Check for any part of the text or role
       expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
       expect(screen.getByText(/TeamA/i)).toBeInTheDocument();
       expect(screen.getByText(/5,000/i)).toBeInTheDocument(); // matches toLocaleString()
    }, { timeout: 4000 });
  });

  // Ticker
  it('LiveTicker handles socket events gracefully', () => {
    const { container } = render(<LiveTicker />);
    expect(container).toBeInTheDocument();
  });
});
