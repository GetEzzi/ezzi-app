import React, { useState } from 'react';
import { AuthenticatedUser } from '@shared/api.ts';
import { getAuthProvider } from '../services/auth/index';
import CommandButton from '../components/shared/commands/CommandButton.tsx';
import { sendToElectron } from '../utils/electron.ts';
import { IPC_EVENTS, isSelfHosted } from '@shared/constants.ts';

interface AuthFormProps {
  setUser: (user: AuthenticatedUser | null) => void;
}

interface FormState {
  email: string;
  password: string;
  error: string;
  passwordError: string;
  isLoading: boolean;
  isSignUp: boolean;
  shake: boolean;
}

const initialState: FormState = {
  email: '',
  password: '',
  error: '',
  passwordError: '',
  isLoading: false,
  isSignUp: false,
  shake: false,
};

export function AuthForm({ setUser }: AuthFormProps) {
  const [formState, setFormState] = useState<FormState>(initialState);
  const authProvider = getAuthProvider();

  React.useEffect(() => {
    const loadLastUsedEmail = async () => {
      try {
        const result = await window.electronAPI.authGetLastUsedEmail();
        if (result.success && result.email) {
          setFormState((prev) => ({ ...prev, email: result.email! }));
        }
      } catch (error) {
        console.error('Error loading last used email:', error);
      }
    };

    if (!isSelfHosted()) {
      loadLastUsedEmail().catch(console.error);
    }
  }, []);

  // In self-hosted mode, automatically authenticate
  React.useEffect(() => {
    if (isSelfHosted()) {
      authProvider
        .getCurrentUser()
        .then((user) => {
          if (user) {
            setUser(user);
          }
        })
        .catch((error) => {
          console.error('Error getting user in self-hosted mode:', error);
        });
    }
  }, [authProvider, setUser]);

  // Don't render form in self-hosted mode
  if (isSelfHosted()) {
    return null;
  }

  const validatePassword = (value: string): boolean => {
    if (formState.isSignUp && value.length < 6) {
      setFormState((prev) => ({
        ...prev,
        passwordError: 'Password must be at least 6 characters',
      }));

      return false;
    }
    setFormState((prev) => ({ ...prev, passwordError: '' }));

    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormState((prev) => ({ ...prev, password: value }));
    if (value && formState.isSignUp) {
      validatePassword(value);
    } else {
      setFormState((prev) => ({ ...prev, passwordError: '' }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, email: e.target.value }));
  };

  const handleSignUp = async (): Promise<void> => {
    const { data: signUpData, error: signUpError } = await authProvider.signUp(
      formState.email,
      formState.password,
    );

    if (signUpError) {
      throw new Error(signUpError.name);
    }

    if (signUpData?.session) {
      const { session } = signUpData;
      await authProvider.setAuthToken(session.access_token);

      const userResponse = await authProvider.getCurrentUser();
      if (userResponse) {
        try {
          await window.electronAPI.authSetLastUsedEmail(formState.email);
        } catch (error) {
          console.error('Error saving last used email:', error);
        }
        setUser(userResponse);
      }

      return;
    }

    setFormState((prev) => ({
      ...prev,
      error: 'Please check your email to confirm your account',
    }));
    setTimeout(() => {
      setFormState((prev) => ({ ...prev, isSignUp: false }));
    }, 2000);
  };

  const handleSignIn = async (): Promise<void> => {
    const response = await authProvider.login(
      formState.email,
      formState.password,
    );

    const error = response.error;
    if (error && 'code' in error) {
      setFormState((prev) => ({
        ...prev,
        error: 'Authentication failed',
      }));
      setFormState((prev) => ({ ...prev, shake: true }));
      setTimeout(
        () => setFormState((prev) => ({ ...prev, shake: false })),
        500,
      );

      return;
    }

    if (response.data?.session) {
      const { session } = response.data;
      await authProvider.setAuthToken(session.access_token);

      const userResponse = await authProvider.getCurrentUser();
      if (userResponse) {
        try {
          await window.electronAPI.authSetLastUsedEmail(formState.email);
        } catch (error) {
          console.error('Error saving last used email:', error);
        }
        setUser(userResponse);
      }
    } else {
      setFormState((prev) => ({
        ...prev,
        error: 'Invalid response from server',
      }));
      setFormState((prev) => ({ ...prev, shake: true }));
      setTimeout(
        () => setFormState((prev) => ({ ...prev, shake: false })),
        500,
      );
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.isSignUp && !validatePassword(formState.password)) {
      setFormState((prev) => ({ ...prev, shake: true }));
      setTimeout(
        () => setFormState((prev) => ({ ...prev, shake: false })),
        500,
      );

      return;
    }

    setFormState((prev) => ({ ...prev, isLoading: true, error: '' }));

    try {
      if (formState.isSignUp) {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } catch (error: any) {
      console.error(
        `Error ${formState.isSignUp ? 'signing up' : 'signing in'}:`,
        error,
      );
      setFormState((prev) => ({
        ...prev,
        error: 'Something went wrong, try again later',
      }));
      setFormState((prev) => ({ ...prev, shake: true }));
      setTimeout(
        () => setFormState((prev) => ({ ...prev, shake: false })),
        500,
      );
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const toggleMode = () => {
    setFormState((prev) => ({
      ...prev,
      isSignUp: !prev.isSignUp,
      error: '',
      passwordError: '',
      email: '',
      password: '',
    }));
  };

  const isFormValid =
    formState.email && formState.password && !formState.passwordError;

  return (
    <div className="min-h-[420px] bg-black/90 rounded-xl">
      <div className="flex flex-col items-center justify-center min-h-[320px] px-3 pb-1">
        <div className="w-full max-w-[320px] space-y-5 p-3">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h2 className="text-lg font-semibold text-gray-100">
              {formState.isSignUp ? 'Create account' : 'Log in'}
            </h2>

            <div className="w-full space-y-3">
              <form
                onSubmit={(e) => {
                  handleEmailAuth(e).catch(console.error);
                }}
                className="space-y-2.5"
              >
                <div className="space-y-1">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={formState.email}
                    onChange={handleEmailChange}
                    className={`w-full px-3 py-2 text-gray-100 rounded-lg border bg-[#1E2530]/90 focus:outline-hidden text-sm font-medium placeholder:text-gray-400 placeholder:font-normal transition-colors ${
                      formState.error
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-700 focus:border-gray-600'
                    } ${formState.shake ? 'shake' : ''}`}
                    required
                  />
                  {formState.error && (
                    <p className="text-sm text-red-400 px-1">
                      {formState.error}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <input
                    type="password"
                    placeholder="Password"
                    value={formState.password}
                    onChange={handlePasswordChange}
                    className={`w-full px-3 py-2 text-gray-100 rounded-lg border bg-[#1E2530]/90 focus:outline-hidden text-sm font-medium placeholder:text-gray-400 placeholder:font-normal transition-colors ${
                      formState.passwordError
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-700 focus:border-gray-600'
                    } ${formState.shake ? 'shake' : ''}`}
                    required
                  />
                  {formState.passwordError && (
                    <p className="text-sm text-red-400 px-1">
                      {formState.passwordError}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={formState.isLoading || !isFormValid}
                  className="relative w-full px-3 py-2 rounded-lg bg-linear-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-700 hover:to-cyan-700 text-white border-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {formState.isLoading
                    ? formState.isSignUp
                      ? 'Creating account...'
                      : 'Signing in...'
                    : formState.isSignUp
                      ? 'Create account'
                      : 'Sign in'}
                </button>
              </form>

              <button
                onClick={toggleMode}
                className="block w-full border-0 rounded-lg p-2.5 bg-linear-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-700 hover:to-cyan-700 text-white transition-colors"
              >
                <p className="text-center text-sm text-gray-400">
                  {formState.isSignUp
                    ? 'Already have an account? Sign in →'
                    : "Don't have an account? Sign up →"}
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="left-0 right-0 flex justify-center -mt-8">
        <div className="text-xs text-gray-400 bg-[#1E2530]/80 rounded-lg py-2 px-4 flex items-center justify-center gap-4">
          <CommandButton label="Show/Hide" shortcut="B" />
          <CommandButton label="Move" shortcut="← ↑ → ↓" />
        </div>
      </div>
      <div className="flex items-center justify-center w-full mt-auto pt-6">
        <button
          onClick={() => sendToElectron(IPC_EVENTS.TOOLTIP.CLOSE_CLICK)}
          className="flex items-center gap-1 text-[11px] text-red-400/80 hover:text-red-400 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3 h-3 text-white/60"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <span className="text-[10px] leading-none text-white/60">Close</span>
        </button>
      </div>
    </div>
  );
}
