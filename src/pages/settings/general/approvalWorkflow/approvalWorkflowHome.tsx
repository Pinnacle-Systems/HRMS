import { useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import ApprovalWorkflowConfig from "./approvalWorkflow";
import ApprovalOperatorManagement from "./approvalOperatorManagement";
import ApprovalModuleManagement from "./approvalModuleManagement";

export default function ApprovalWorkflowHome() {
  const [tab, setTab] = useState(0);

  return (
    <Box className="">
      <div className="rounded-xl p-2">
        {/* <Typography variant="h6" className="!font-bold mb-3">
          Approval Workflow Admin
        </Typography> */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          indicatorColor="primary" textColor="primary" className="!border-b !border-gray-300"
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: "var(--color-primary)",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab label="Configurations" className="!text-gray-800"/>
          <Tab label="Modules" className="!text-gray-800"/>
          {/* <Tab label="Fields" className="!text-gray-800" /> */}
          <Tab label="Operators" className="!text-gray-800"/>
          <Tab label="Pending approvals"  className="!text-gray-800"/>
        </Tabs>
      </div>

      {tab === 0 && <ApprovalWorkflowConfig />}
      {/* {tab === 1 && <ApprovalModuleManagement />} */}
      {tab === 1 && <ApprovalModuleManagement />}
      {/* {tab === 3 && <ApprovalFieldManagement />} */}
      {tab === 2 && <ApprovalOperatorManagement />}
    </Box>
  );
}