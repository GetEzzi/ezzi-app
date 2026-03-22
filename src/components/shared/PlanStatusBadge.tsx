import React, { useState } from 'react';
import { useSubscription } from '../../contexts/SubscriptionContext';

export const PlanStatusBadge: React.FC = () => {
  const { user } = useSubscription();
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    try {
      const result = await window.electronAPI.openSubscriptionPortal({
        email: user.user.email,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to open subscription portal');
      }
    } catch (err) {
      console.error('Error opening subscription portal:', err);
      setError('Failed to open portal');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="px-4 pt-3 pb-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-yellow-400/80 bg-yellow-400/10 border border-yellow-400/20 rounded px-1.5 py-0.5">
          FREE
        </span>
        <button
          onClick={() => {
            handleUpgrade().catch(console.error);
          }}
          className="text-[10px] text-cyan-400/80 hover:text-cyan-400 transition-colors underline underline-offset-2"
        >
          Upgrade Plan
        </button>
        {error && (
          <span className="text-[10px] text-red-400">{error}</span>
        )}
      </div>
    </div>
  );
};
