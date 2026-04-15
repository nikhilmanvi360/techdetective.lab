import LiveTicker from '../src/components/LiveTicker';
import Dashboard from '../src/pages/Dashboard';
import Scoreboard from '../src/pages/Scoreboard';
import AdminDashboard from '../src/pages/AdminDashboard';
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

describe('Frontend React Tests - Systematic Coverage', () => {

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Login & Navigation', () => {
    it('Login component handles loading states', async () => {
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ token: 't', team: { id: 1, name: 'n' } })
        }), 100))
      );

      render(<MemoryRouter><Login onLogin={vi.fn()} /></MemoryRouter>);
      
      fireEvent.change(screen.getByPlaceholderText(/TEAM_NAME/i), { target: { value: 'T' } });
      fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'P' } });
      fireEvent.click(screen.getByText(/INITIATE_SESSION/i));

      expect(screen.getByText(/AUTHENTICATING.../i)).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByText(/AUTHENTICATING.../i)).not.toBeInTheDocument());
    });
  });

  describe('Board & Data Display', () => {
    it('Scoreboard renders correctly and handles empty states', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => []
      });

      render(<MemoryRouter><Scoreboard /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.getByText(/No investigation data recorded yet/i)).toBeInTheDocument();
      });
    });

    it('Dashboard handles connection failure gracefully', async () => {
       global.fetch = vi.fn().mockRejectedValue(new Error('Down'));
       console.error = vi.fn(); 

       render(<MemoryRouter><Dashboard /></MemoryRouter>);
       await waitFor(() => {
         expect(screen.queryByText(/LOADING_CASES/i)).not.toBeInTheDocument();
         expect(screen.getByText(/Investigation Dashboard/i)).toBeInTheDocument();
       });
    });
  });

  describe('Admin Dashboard', () => {
    it('AdminDashboard renders management sections when authenticated as admin', async () => {
      const mockTeams = [{ id: 1, name: 'T1', score: 100, is_disabled: false }];
      const mockSubmissions = [];
      const mockAnalytics = [];
      const mockMasterKey = [];
      
      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/api/admin/teams')) return Promise.resolve({ ok: true, json: async () => mockTeams });
        if (url.includes('/api/admin/submissions')) return Promise.resolve({ ok: true, json: async () => mockSubmissions });
        if (url.includes('/api/admin/analytics')) return Promise.resolve({ ok: true, json: async () => mockAnalytics });
        if (url.includes('/api/admin/master-key')) return Promise.resolve({ ok: true, json: async () => mockMasterKey });
        return Promise.reject('URL Not Mocked: ' + url);
      });

      render(<MemoryRouter><AdminDashboard /></MemoryRouter>);

      await waitFor(() => {
        expect(screen.queryByText(/ACCESSING_RESTRICTED_DATABASE.../i)).not.toBeInTheDocument();
      });

      // Switch to Teams tab
      fireEvent.click(screen.getByText(/Teams/i));

      await waitFor(() => {
        expect(screen.getByText(/Team Management/i)).toBeInTheDocument();
        expect(screen.getByText(/T1/i)).toBeInTheDocument();
      });
    });
  });
});
