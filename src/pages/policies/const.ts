// Re-export from the single source of truth.
// mockPolicies is exposed for backward-compat with PolicyDashboard's direct import.
import { mockPolicyService } from '../../services/mockPolicyService';

export const mockPolicies = mockPolicyService.getPolicies('company_123');
