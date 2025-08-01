import { useState, useRef, useEffect } from 'react';
import { authService } from '../services/auth.ts';
import { AuthenticatedUser, SubscriptionLevel } from '@shared/api.ts';
import { sendToElectron } from '../utils/electron';
import { IPC_EVENTS } from '@shared/constants.ts';
import CommandButton from '../components/shared/commands/CommandButton';
import logoSrc from '../assets/images/logo.svg';

interface SubscribePageProps {
  user: AuthenticatedUser;
}

export default function SubscribePage({ user }: SubscribePageProps) {
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = async () => {
      if (containerRef.current) {
        await window.electronAPI.updateContentDimensions({
          width: 500,
          height: 520,
          source: 'SubscribePage',
        });
      }
    };

    updateDimensions().catch(console.error);
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
  };

  const handleSubscribe = async () => {
    if (!user) {
      return;
    }

    try {
      const result = await window.electronAPI.openSubscriptionPortal({
        email: user.user.email,
      });

      if (!result.success) {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error(result.error || 'Failed to open subscription portal');
      }
    } catch (err) {
      console.error('Error opening subscription portal:', err);
      setError('Failed to open subscription portal. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div ref={containerRef} className="min-h-[520px] bg-black/90 rounded-xl">
      <div className="flex flex-col items-center justify-center min-h-[440px] px-3 pb-1">
        <div className="w-full max-w-[440px] space-y-5 p-3 mt-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <img src={logoSrc} alt="Logo" className="w-16 h-16 mb-2" />
            <h2 className="text-lg font-semibold text-gray-100">
              Welcome to Ezzi
            </h2>
            {user.subscription.level === SubscriptionLevel.FREE && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-center">
                <p className="text-green-400 text-sm font-medium">
                  You have {user.subscription.freeSolutions} free solution
                  {user.subscription.freeSolutions !== 1 ? 's' : ''} left
                </p>
                <p className="text-green-300/70 text-xs mt-1">
                  Free solutions reset at midnight UTC
                  {(() => {
                    // Convert UTC midnight to local time
                    const now = new Date();
                    const utcMidnight = new Date(
                      Date.UTC(
                        now.getUTCFullYear(),
                        now.getUTCMonth(),
                        now.getUTCDate() + 1, // next day
                        0,
                        0,
                        0,
                        0, // midnight
                      ),
                    );

                    // Only show local time if it's different from UTC
                    if (
                      utcMidnight.getHours() !== 0 ||
                      utcMidnight.getMinutes() !== 0
                    ) {
                      return ` (${utcMidnight.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} your time)`;
                    }

                    return '';
                  })()}
                </p>
              </div>
            )}
            <p className="text-gray-400 text-sm text-center">
              To start cracking code interviews, you'll need to upgrade your
              plan.
            </p>

            <button
              onClick={() => {
                handleSubscribe().catch(console.error);
              }}
              className="relative w-full px-3 py-2 rounded-lg bg-linear-to-r from-fuchsia-600 to-cyan-600 hover:from-fuchsia-700 hover:to-cyan-700 text-white border-0 transition-all text-sm font-medium flex items-center justify-center gap-2"
            >
              Upgrade Plan
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>

            <div className="flex flex-col items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
              <p className="text-white/60 text-xs">
                Awaiting for plan upgrade, the app will update automatically...
              </p>
            </div>

            {error && (
              <div className="w-full px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <div className="left-0 right-0 flex justify-center">
              <div className="text-xs text-gray-400 bg-[#1E2530]/80 rounded-lg py-2 px-4 flex items-center justify-center gap-4">
                <CommandButton label="Show/Hide" shortcut="B" />
                <CommandButton label="Move" shortcut="← ↑ → ↓" />
              </div>
            </div>

            <div className="flex items-center justify-between w-full mt-auto pt-6">
              <button
                onClick={() => {
                  handleSignOut().catch(console.error);
                }}
                className="flex items-center gap-1.5 text-[11px] text-red-400/80 hover:text-red-400 transition-colors group"
              >
                <div className="w-3.5 h-3.5 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-full h-full"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                Log Out
              </button>
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
                <span className="text-[10px] leading-none text-white/60">
                  Close
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
