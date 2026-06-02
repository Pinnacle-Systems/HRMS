// src/utils/validation.ts

import type { PolicyConfig, EntitlementConfig } from '../types/policy';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateLeavePolicy = (config: PolicyConfig): ValidationResult => {
  const errors: Record<string, string> = {};
  
  if (!config.entitlements || config.entitlements.length === 0) {
    errors.entitlements = 'At least one leave type must be configured';
  }
  
  config.entitlements?.forEach((leave: EntitlementConfig, index: number) => {
    if (!leave.leaveType) {
      errors[`entitlements.${index}.leaveType`] = 'Leave type code is required';
    }
    if (!leave.name) {
      errors[`entitlements.${index}.name`] = 'Leave name is required';
    }
    if (leave.annualEntitlement <= 0) {
      errors[`entitlements.${index}.annualEntitlement`] = 'Annual entitlement must be greater than 0';
    }
    if (leave.maxConsecutiveDays && leave.maxConsecutiveDays <= 0) {
      errors[`entitlements.${index}.maxConsecutiveDays`] = 'Max consecutive days must be greater than 0';
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateApprovalFlow = (config: any): ValidationResult => {
  const errors: Record<string, string> = {};
  
  if (!config.levels || config.levels.length === 0) {
    errors.levels = 'At least one approval level is required';
  }
  
  config.levels?.forEach((level: any, index: number) => {
    if (level.approverType === 'SPECIFIC_USER' && !level.approverId) {
      errors[`levels.${index}.approverId`] = 'Specific user ID is required';
    }
    if (level.timeoutDays && level.timeoutDays <= 0) {
      errors[`levels.${index}.timeoutDays`] = 'Timeout days must be greater than 0';
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};