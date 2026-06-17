import { AccountBalanceWallet as AllowanceIcon } from "@mui/icons-material";
import { policyService } from "../../../services/modules/policy";
import PolicyMasterPage from "./PolicyMasterPage";

export default function AllowanceComponents() {
  return (
    <PolicyMasterPage
      title="Allowance"
      icon={AllowanceIcon}
      fetchList={(params) => policyService.getAllowance(params)}
      createItem={(payload) => policyService.createAllowance(payload)}
      updateItem={(id, payload) => policyService.updateAllowance(id, payload)}
      deleteItem={(id) => policyService.deleteAllowanceById(id)}
      toggleActive={(id) => policyService.toggleAllowanceById(id)}
    />
  );
}
