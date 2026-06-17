import { ReceiptLong as ExpenseCategoryIcon } from "@mui/icons-material";
import { policyService } from "../../../services/modules/policy";
import PolicyMasterPage from "./PolicyMasterPage";

export default function ExpenseCategory() {
  return (
    <PolicyMasterPage
      title="Expense Category"
      icon={ExpenseCategoryIcon}
      fetchList={(params) => policyService.getExpenseCategory(params)}
      createItem={(payload) => policyService.createExpenseCategory(payload)}
      updateItem={(id, payload) => policyService.updateExpenseCategory(id, payload)}
      deleteItem={(id) => policyService.deleteExpenseCategoryById(id)}
      toggleActive={(id) => policyService.toggleExpenseCategoryById(id)}
    />
  );
}
