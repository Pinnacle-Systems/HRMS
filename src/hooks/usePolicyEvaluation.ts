// src/hooks/usePolicyEvaluation.ts

import { useState, useCallback } from 'react';
import { policyApi } from '../services/modules/policy';
import { type PolicyEvaluationRequest, type PolicyEvaluationResponse } from '../types/policy';

interface UsePolicyEvaluationOptions {
  onSuccess?: (result: PolicyEvaluationResponse) => void;
  onError?: (error: Error) => void;
}

export const usePolicyEvaluation = (options?: UsePolicyEvaluationOptions) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PolicyEvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const evaluate = useCallback(async (request: PolicyEvaluationRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await policyApi.evaluatePolicy(request);
      setResult(response);
      options?.onSuccess?.(response);
      return response;
    } catch (err: any) {
      const errorMsg = err.message || 'Evaluation failed';
      setError(errorMsg);
      options?.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [options]);

  const preview = useCallback(async (versionId: string, employeeId: string, action: string, context: any) => {
    setLoading(true);
    try {
      const response = await policyApi.previewPolicy(versionId, employeeId, action, context);
      setResult(response);
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    evaluate,
    preview,
    loading,
    result,
    error,
    clearResult,
  };
};