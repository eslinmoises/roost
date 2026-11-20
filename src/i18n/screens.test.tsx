import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from './index';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import NotFound from '@/pages/NotFound';
import LessonPlayer from '@/components/groups/learn/LessonPlayer';
import type { RecordingWithCompletion } from '@/types';

vi.mock('@/services/supabase', () => ({ supabase: { auth: {} } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ signUp: vi.fn() }) }));
vi.mock('@/services/profile', () => ({ isUsernameAvailable: vi.fn(), isValidUsername: vi.fn() }));
vi.mock('@/services/module', () => ({ markLessonComplete: vi.fn(), markLessonIncomplete: vi.fn() }));
afterEach(cleanup);
beforeEach(async () => { await i18n.changeLanguage('es'); });

describe('localized screens', () => {
  it.each([
    ['es', 'Marcar como completada', 'Video no disponible'],
    ['en', 'Mark Complete', 'Video unavailable'],
  ])('renders course lesson controls in %s', async (language, button, message) => {
    await i18n.changeLanguage(language);
    const recording = { id: 'lesson', title: 'A lesson', is_completed: false } as RecordingWithCompletion;
    render(<LessonPlayer recording={recording} moduleId="module" userId="user" prevRecording={null} nextRecording={null} onNavigate={vi.fn()} onCompletionChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: button })).toBeTruthy();
    expect(screen.getByText(message)).toBeTruthy();
  });
  it('shows the Spanish login by default', () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeTruthy();
    expect(screen.getByLabelText('Contraseña')).toBeTruthy();
  });
  it('shows the Spanish signup by default', () => {
    render(<MemoryRouter><Signup /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeTruthy();
  });
  it('shows a Spanish missing-page screen', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeTruthy();
  });
  it('shows the original English login, signup and missing-page screens', async () => {
    await i18n.changeLanguage('en');
    const login = render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    login.unmount();
    const signup = render(<MemoryRouter><Signup /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeTruthy();
    signup.unmount();
    render(<MemoryRouter><NotFound /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeTruthy();
  });
  it('updates mounted screens and document language when the language changes', async () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    await act(async () => { await i18n.changeLanguage('en'); });
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeTruthy();
    expect(document.documentElement.lang).toBe('en');
    await act(async () => { await i18n.changeLanguage('es'); });
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeTruthy();
    expect(document.documentElement.lang).toBe('es');
  });
});
