import axios from 'axios';
import { mockPolicyService, delay } from '../mockPolicyService';
import type {
  PolicyTemplate,
  PolicyDefinition,
  PolicyVersion,
  PolicyAssignment,
  PolicyEvaluationRequest,
  PolicyEvaluationResponse,
  PolicyDomain,
} from '../../types/policy';

const USE_MOCK = true; // ← set to false when backend is ready

const API_BASE_URL = import.meta.env.REACT_APP_API_BASE_URL || '/api/hrms';

class PolicyApiService {
  private client = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
  });

  // ── Templates ──────────────────────────────────────────────────────

  async getTemplates(domain?: PolicyDomain): Promise<PolicyTemplate[]> {
    if (USE_MOCK) {
      await delay();
      return mockPolicyService.getTemplates(domain);
    }
    try {
      const res = await this.client.get('/policy-templates', { params: domain ? { domain } : {} });
      const data = Array.isArray(res.data) ? res.data : [];
      return data.length > 0 ? data : mockPolicyService.getTemplates(domain);
    } catch {
      return mockPolicyService.getTemplates(domain);
    }
  }

  async getTemplateById(id: string): Promise<PolicyTemplate> {
    if (USE_MOCK) {
      await delay(200);
      return mockPolicyService.getTemplateById(id);
    }
    try {
      const res = await this.client.get(`/policy-templates/${id}`);
      return res.data;
    } catch {
      return mockPolicyService.getTemplateById(id);
    }
  }

  async createTemplate(data: Partial<PolicyTemplate>): Promise<PolicyTemplate> {
    if (USE_MOCK) {
      await delay(400);
      return mockPolicyService.createTemplate(data);
    }
    try {
      const res = await this.client.post('/policy-templates', data);
      return res.data;
    } catch {
      return mockPolicyService.createTemplate(data);
    }
  }

  // ── Policies ───────────────────────────────────────────────────────

  async getPolicies(companyId: string, domain?: PolicyDomain): Promise<PolicyDefinition[]> {
    if (USE_MOCK) {
      await delay();
      return mockPolicyService.getPolicies(companyId, domain);
    }
    try {
      const res = await this.client.get('/policies', { params: { companyId, domain } });
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data?.content || res.data?.data || [];
      return data.length > 0 ? data : mockPolicyService.getPolicies(companyId, domain);
    } catch {
      return mockPolicyService.getPolicies(companyId, domain);
    }
  }

  async getPolicyById(id: string): Promise<PolicyDefinition> {
    if (USE_MOCK) {
      await delay(200);
      return mockPolicyService.getPolicyById(id);
    }
    try {
      const res = await this.client.get(`/policies/${id}`);
      return res.data;
    } catch {
      return mockPolicyService.getPolicyById(id);
    }
  }

  async createPolicy(data: Partial<PolicyDefinition>): Promise<PolicyDefinition> {
    if (USE_MOCK) {
      await delay(600);
      return mockPolicyService.createPolicy(data);
    }
    try {
      const res = await this.client.post('/policies', data);
      return res.data;
    } catch {
      return mockPolicyService.createPolicy(data);
    }
  }

  async updatePolicy(id: string, data: Partial<PolicyDefinition>): Promise<PolicyDefinition> {
    if (USE_MOCK) {
      await delay(400);
      return mockPolicyService.updatePolicy(id, data);
    }
    try {
      const res = await this.client.put(`/policies/${id}`, data);
      return res.data;
    } catch {
      return mockPolicyService.updatePolicy(id, data);
    }
  }

  // ── Versions ───────────────────────────────────────────────────────

  async getPolicyVersions(policyId: string): Promise<PolicyVersion[]> {
    if (USE_MOCK) {
      await delay();
      return mockPolicyService.getPolicyVersions(policyId);
    }
    try {
      const res = await this.client.get(`/policies/${policyId}/versions`);
      return Array.isArray(res.data) ? res.data : mockPolicyService.getPolicyVersions(policyId);
    } catch {
      return mockPolicyService.getPolicyVersions(policyId);
    }
  }

  async createPolicyVersion(policyId: string, config: any, changeLog: string): Promise<PolicyVersion> {
    if (USE_MOCK) {
      await delay(500);
      return mockPolicyService.createPolicyVersion(policyId, config, changeLog);
    }
    try {
      const res = await this.client.post(`/policies/${policyId}/versions`, { config, changeLog });
      return res.data;
    } catch {
      return mockPolicyService.createPolicyVersion(policyId, config, changeLog);
    }
  }

  async submitForApproval(versionId: string): Promise<void> {
    if (USE_MOCK) { await delay(300); return; }
    try {
      await this.client.post(`/policy-versions/${versionId}/submit`);
    } catch {
      // no-op in mock
    }
  }

  async approveVersion(versionId: string): Promise<void> {
    if (USE_MOCK) { await delay(300); return; }
    try {
      await this.client.post(`/policy-versions/${versionId}/approve`);
    } catch {
      // no-op in mock
    }
  }

  async activateVersion(versionId: string): Promise<void> {
    if (USE_MOCK) { await delay(300); return; }
    try {
      await this.client.post(`/policy-versions/${versionId}/activate`);
    } catch {
      // no-op in mock
    }
  }

  // ── Assignments ────────────────────────────────────────────────────

  async getAssignments(policyVersionId: string): Promise<PolicyAssignment[]> {
    if (USE_MOCK) {
      await delay();
      return mockPolicyService.getAssignments(policyVersionId);
    }
    try {
      const res = await this.client.get(`/policy-versions/${policyVersionId}/assignments`);
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return mockPolicyService.getAssignments(policyVersionId);
    }
  }

  async createAssignment(assignment: Partial<PolicyAssignment>): Promise<PolicyAssignment> {
    if (USE_MOCK) {
      await delay(400);
      return mockPolicyService.createAssignment(assignment);
    }
    try {
      const res = await this.client.post('/policy-assignments', assignment);
      return res.data;
    } catch {
      return mockPolicyService.createAssignment(assignment);
    }
  }

  async updateAssignment(id: string, assignment: Partial<PolicyAssignment>): Promise<PolicyAssignment> {
    if (USE_MOCK) {
      await delay(400);
      return mockPolicyService.updateAssignment(id, assignment);
    }
    try {
      const res = await this.client.put(`/policy-assignments/${id}`, assignment);
      return res.data;
    } catch {
      return mockPolicyService.updateAssignment(id, assignment);
    }
  }

  async deleteAssignment(id: string): Promise<void> {
    if (USE_MOCK) { await delay(300); mockPolicyService.deleteAssignment(id); return; }
    try {
      await this.client.delete(`/policy-assignments/${id}`);
    } catch {
      mockPolicyService.deleteAssignment(id);
    }
  }

  async checkConflicts(assignment: Partial<PolicyAssignment>): Promise<PolicyAssignment[]> {
    if (USE_MOCK) {
      await delay(300);
      return mockPolicyService.checkConflicts(assignment);
    }
    try {
      const res = await this.client.post('/policy-assignments/check-conflicts', assignment);
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  // ── Evaluation ─────────────────────────────────────────────────────

  async evaluatePolicy(request: PolicyEvaluationRequest): Promise<PolicyEvaluationResponse> {
    if (USE_MOCK) {
      await delay(700);
      return mockPolicyService.evaluatePolicy(request);
    }
    try {
      const res = await this.client.post('/policies/evaluate', request);
      return res.data;
    } catch {
      return mockPolicyService.evaluatePolicy(request);
    }
  }

  async previewPolicy(
    versionId: string,
    employeeId: string,
    action: string,
    context: any,
  ): Promise<PolicyEvaluationResponse> {
    if (USE_MOCK) {
      await delay(700);
      return mockPolicyService.previewPolicy(versionId, employeeId, action, context);
    }
    try {
      const res = await this.client.post(`/policy-versions/${versionId}/preview`, {
        employeeId,
        action,
        context,
      });
      return res.data;
    } catch {
      return mockPolicyService.previewPolicy(versionId, employeeId, action, context);
    }
  }

  // ── Employee Policies ──────────────────────────────────────────────

  async getEmployeePolicies(employeeId: string, domain?: PolicyDomain): Promise<any[]> {
    if (USE_MOCK) {
      await delay();
      return mockPolicyService.getEmployeePolicies(employeeId, domain);
    }
    try {
      const params = domain ? { domain } : {};
      const res = await this.client.get(`/employees/${employeeId}/policies`, { params });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  }
}

export const policyApi = new PolicyApiService();
