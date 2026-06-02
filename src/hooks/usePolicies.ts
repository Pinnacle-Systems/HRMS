// src/hooks/usePolicies.ts

import { useState, useEffect, useCallback } from 'react';
import { policyApi } from '../services/modules/policy';
import { type PolicyDefinition, PolicyDomain, PolicyStatus } from '../types/policy';

interface UsePoliciesOptions {
  companyId: string;
  domain?: PolicyDomain;
  status?: PolicyStatus;
  autoLoad?: boolean;
}

export const usePolicies = ({ companyId, domain, status, autoLoad = true }: UsePoliciesOptions) => {
  const [policies, setPolicies] = useState<PolicyDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await policyApi.getPolicies(companyId, domain);
      let filtered = data;
      if (status) {
        filtered = filtered.filter(p => p.status === status);
      }
      setPolicies(filtered);
    } catch (err: any) {
      setError(err.message || 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, [companyId, domain, status]);

  useEffect(() => {
    if (autoLoad) {
      loadPolicies();
    }
  }, [autoLoad, loadPolicies]);

  const createPolicy = useCallback(async (data: Partial<PolicyDefinition>) => {
    setLoading(true);
    try {
      const newPolicy = await policyApi.createPolicy(data);
      setPolicies(prev => [...prev, newPolicy]);
      return newPolicy;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePolicy = useCallback(async (id: string, data: Partial<PolicyDefinition>) => {
    setLoading(true);
    try {
      const updated = await policyApi.updatePolicy(id, data);
      setPolicies(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePolicy = useCallback(async (id: string) => {
    setLoading(true);
    try {
      // Implement delete API call
      setPolicies(prev => prev.filter(p => p.id !== id));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    policies,
    loading,
    error,
    loadPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
  };
};