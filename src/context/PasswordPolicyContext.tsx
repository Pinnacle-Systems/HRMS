import React, { createContext, useContext, useEffect, useState } from 'react';
import { passwordPolicyService, type PasswordPolicyRequest } from '../services/modules/passwordPolicy';

interface PolicyContextValue {
  policy: PasswordPolicyRequest | null;
  isLoading: boolean;
  error: string | null;
}

const PolicyContext = createContext<PolicyContextValue>({
  policy: null,
  isLoading: true,
  error: null,
});

export const PasswordPolicyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [policy, setPolicy] = useState<PasswordPolicyRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadPolicy = async () => {
      try {
        const data = await passwordPolicyService.getPasswordPolicy();
        if (mounted) setPolicy(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load policy');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadPolicy();
    return () => { mounted = false; };
  }, []);

  return (
    <PolicyContext.Provider value={{ policy, isLoading, error }}>
      {children}
    </PolicyContext.Provider>
  );
};

export const usePasswordPolicy = () => useContext(PolicyContext);