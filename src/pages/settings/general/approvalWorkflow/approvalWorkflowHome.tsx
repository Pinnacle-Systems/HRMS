import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import ApprovalWorkflowConfig from "./approvalWorkflow";
import ApprovalOperatorManagement from "./approvalOperatorManagement";
import ApprovalModuleManagement from "./approvalModuleManagement";
import PendingApprovals from "./pendingApprovals";
import ApprovalFieldManagement from "./approvalFieldManagement";
import ApprovalMatrixConfig from "./approvalMatrixConfig";
import PendingChanges from "./pendingChanges";

export default function ApprovalWorkflowHome() {
  const [tab, setTab] = useState(0);

  return (
    <Box className="">
      <div className="rounded-xl p-2">
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          indicatorColor="primary" 
          textColor="primary" 
          className="!border-b !border-gray-300"
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: "var(--color-primary)",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab label="Configurations" className="!text-gray-800"/>
          <Tab label="Approval Matrix" className="!text-gray-800"/>
          <Tab label="Modules" className="!text-gray-800"/>
          <Tab label="Fields" className="!text-gray-800" />
          <Tab label="Operators" className="!text-gray-800"/>
          <Tab label="Pending approvals"  className="!text-gray-800"/>
          <Tab label="Pending changes" className="!text-gray-800" />
        </Tabs>
      </div>

      {tab === 0 && <ApprovalWorkflowConfig />}
      {tab === 1 && <ApprovalMatrixConfig />}
      {tab === 2 && <ApprovalModuleManagement />}
      {tab === 3 && <ApprovalFieldManagement />}
      {tab === 4 && <ApprovalOperatorManagement />}
      {tab === 5 && <PendingApprovals />}
      {tab === 6 && <PendingChanges />}
    </Box>
  );
}