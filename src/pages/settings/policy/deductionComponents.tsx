import { RemoveCircle as DeductionIcon } from "@mui/icons-material";
import { policyService } from "../../../services/modules/policy";
import PolicyMasterPage from "./PolicyMasterPage";

export default function DeductionComponents() {
  return (
    <PolicyMasterPage
      title="Deduction"
      icon={DeductionIcon}
      fetchList={(params) => policyService.getDeduction(params)}
      createItem={(payload) => policyService.createDeduction(payload)}
      updateItem={(id, payload) => policyService.updateDeduction(id, payload)}
      deleteItem={(id) => policyService.deleteDeductionById(id)}
      toggleActive={(id) => policyService.toggleDeductionById(id)}
    />
  );
}
