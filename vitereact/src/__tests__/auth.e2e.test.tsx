import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import App from '@/App';
import { useAppStore } from '@/store/main';

const genEmail = () => `user${Date.now()}@example.com`;
const PASSWORD = 'TestPassword!234';

describe('Auth E2E (Vitest, real API) - App-level', () => {
  beforeEach(() => {
    localStorage.clear();
    // Ensure store starts not loading and unauthenticated (no token)
    useAppStore.setState((state) => ({
      authentication_state: {
        ...state.authentication_state,
        current_user: null,
        auth_token: null,
        authentication_status: {
          is_authenticated: false,
          is_loading: false,
        },
        error_message: null,
      },
    }));
  });

  it('registers then signs in successfully against real API', async () => {
    const email = genEmail();

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    // If view supports a toggle into register mode, click it; otherwise proceed
    const toggleBtn = screen.queryByRole('button', { name: /sign up|create account|register/i });
    if (toggleBtn) {
      await userEvent.click(toggleBtn);
    }

    const emailInput = await screen.findByLabelText(/email address|email/i);
    const passwordInput = await screen.findByLabelText(/password/i);

    // Optional name field for register mode
    const nameInput = screen.queryByLabelText(/full name|name/i);

    // Submit button can vary by mode
    const submitBtn =
      (await screen.findByRole('button', { name: /create|sign up|register/i }).catch(() => null)) ||
      (await screen.findByRole('button', { name: /sign in|log in/i }));

    if (nameInput) {
      await userEvent.type(nameInput, 'Test User');
    }
    await userEvent.type(emailInput, email);
    await userEvent.type(passwordInput, PASSWORD);

    await waitFor(() => expect(submitBtn).not.toBeDisabled(), { timeout: 10000 });
    await userEvent.click(submitBtn);

    // Wait for auth store to reflect registration/login
    await waitFor(
      () => {
        const s = useAppStore.getState();
        expect(s.authentication_state.authentication_status.is_authenticated).toBe(true);
        expect(s.authentication_state.auth_token).toBeTruthy();
      },
      { timeout: 20000 }
    );

    // Sign out if exposed, then test sign-in explicitly
    if (typeof useAppStore.getState().logout_user === 'function') {
      useAppStore.getState().logout_user();
    }

    // Fill and sign-in
    const email2 = await screen.findByLabelText(/email address|email/i);
    const password2 = await screen.findByLabelText(/password/i);
    const signInBtn =
      (await screen.findByRole('button', { name: /sign in|log in/i }).catch(() => null)) ||
      (await screen.findByRole('button', { name: /submit/i }));

    await userEvent.clear(email2);
    await userEvent.type(email2, email);
    await userEvent.clear(password2);
    await userEvent.type(password2, PASSWORD);

    await waitFor(() => expect(signInBtn).not.toBeDisabled(), { timeout: 10000 });
    await userEvent.click(signInBtn);

    await waitFor(
      () => {
        const s = useAppStore.getState();
        expect(s.authentication_state.authentication_status.is_authenticated).toBe(true);
        expect(s.authentication_state.auth_token).toBeTruthy();
      },
      { timeout: 20000 }
    );
  }, 30000);
});

