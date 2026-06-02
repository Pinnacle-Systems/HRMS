// src/hooks/useTemplates.ts

import { useState, useEffect, useCallback } from 'react';
import { policyApi } from '../services/modules/policy';
import { type PolicyTemplate, PolicyDomain, IndustryType } from '../types/policy';

interface UseTemplatesOptions {
  domain?: PolicyDomain;
  industryType?: IndustryType;
  autoLoad?: boolean;
}

export const useTemplates = ({ domain, industryType, autoLoad = true }: UseTemplatesOptions = {}) => {
  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await policyApi.getTemplates(domain);
      let filtered = data;
      if (industryType) {
        filtered = filtered.filter(t => t.industryType === industryType || !t.industryType);
      }
      setTemplates(filtered);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [domain, industryType]);

  useEffect(() => {
    if (autoLoad) {
      loadTemplates();
    }
  }, [autoLoad, loadTemplates]);

  const getTemplateById = useCallback(async (id: string) => {
    try {
      return await policyApi.getTemplateById(id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    templates,
    loading,
    error,
    loadTemplates,
    getTemplateById,
  };
};