// `policyService` used to be one 769-line class covering templates, policy
// CRUD, versions, assignments, evaluation, rule blocks, master data
// (domain/allowance/expense/deduction), simulations, reports and approval
// workflow. It's now composed from focused modules under ./policyServices/,
// each independently readable/testable, while keeping the exact same public
// method surface so every existing `policyService.xxx(...)` call site across
// the app keeps working unchanged.
import { templateService, type GetTemplateParams } from "./policyServices/templates";
import {
  policyCrudService,
  type PolicyPageParams,
  type PolicyPage,
  type CreatePolicyPayload,
  type UpdatePolicyPayload,
} from "./policyServices/policies";
import { policyVersionService } from "./policyServices/versions";
import { assignmentService } from "./policyServices/assignments";
import { evaluationService } from "./policyServices/evaluation";
import { ruleBlockService, type GetRuleBlockParams } from "./policyServices/ruleBlocks";
import {
  masterDataService,
  type GetDomainParams,
  type GetAllowanceParams,
  type GetDeductionParams,
  type GetExpenseParams,
} from "./policyServices/masters";
import { simulationService } from "./policyServices/simulations";
import { reportService } from "./policyServices/reports";
import { approvalWorkflowService } from "./policyServices/approvalWorkflow";

export type {
  GetTemplateParams,
  PolicyPageParams,
  PolicyPage,
  CreatePolicyPayload,
  UpdatePolicyPayload,
  GetRuleBlockParams,
  GetDomainParams,
  GetAllowanceParams,
  GetDeductionParams,
  GetExpenseParams,
};

export const policyService = {
  ...templateService,
  ...policyCrudService,
  ...policyVersionService,
  ...assignmentService,
  ...evaluationService,
  ...ruleBlockService,
  ...masterDataService,
  ...simulationService,
  ...reportService,
  ...approvalWorkflowService,
};
