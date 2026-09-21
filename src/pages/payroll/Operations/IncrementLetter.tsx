import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Button } from "@mui/material";
import { formatDate } from "../../../utils/dateFormatter";
import { salaryRevisionService } from "../../../services/modules/payrollServices/salaryRevision";

export default function IncrementLetter() {
  const { id, employeeId } = useParams<{ id: string; employeeId: string }>();
  const [data, setData] = useState<any>(null);

 useEffect(() => {
  if (!id) return;
  salaryRevisionService
    .getRevisionById(id)
    .then((res: any) => {
      const emp = res.data.employees.find(
        (e: any) => e.employeeId === employeeId
      );
      setData({ revision: res.data, employee: emp });
    })
    .catch((err: any) => {
      console.error("Failed to load revision for letter", err);
      const dummyRevision: any = {
        id: id || "rev-101",
        revisionCode: "REV-2026-001",
        title: "Annual Increment 2026",
        reason: "ANNUAL_INCREMENT",
        effectiveFrom: "2026-04-01",
        status: "APPLIED",
        createdBy: "hr.admin@company.com",
        createdAt: "2026-03-01T10:15:00Z",
        employees: [
          {
            employeeId: "501",
            employeeCode: "EMP001",
            employeeName: "Ravi Kumar",
            department: "Engineering",
            designation: "Software Engineer",
            oldCtc: 800000,
            newCtc: 880000,
            oldGross: 60000,
            newGross: 66666.67,
            incrementAmount: 80000,
            incrementPercent: 10,
            effectiveFrom: "2026-04-01",
            components: [
              { componentId: "c1", componentName: "Basic", componentType: "EARNING", oldValue: 24000, newValue: 27200, delta: 3200, deltaPercent: 13.33 },
              { componentId: "c2", componentName: "HRA", componentType: "EARNING", oldValue: 12000, newValue: 13600, delta: 1600, deltaPercent: 13.33 },
              { componentId: "c3", componentName: "Special Allowance", componentType: "EARNING", oldValue: 24000, newValue: 27200, delta: 3200, deltaPercent: 13.33 },
            ],
          },
          {
            employeeId: "502",
            employeeCode: "EMP002",
            employeeName: "Priya Sharma",
            department: "HR",
            designation: "HR Executive",
            oldCtc: 600000,
            newCtc: 660000,
            oldGross: 45000,
            newGross: 50000,
            incrementAmount: 60000,
            incrementPercent: 10,
            effectiveFrom: "2026-04-01",
            components: [
              { componentId: "c1", componentName: "Basic", componentType: "EARNING", oldValue: 18000, newValue: 20400, delta: 2400, deltaPercent: 13.33 },
              { componentId: "c2", componentName: "HRA", componentType: "EARNING", oldValue: 9000, newValue: 10200, delta: 1200, deltaPercent: 13.33 },
              { componentId: "c3", componentName: "Special Allowance", componentType: "EARNING", oldValue: 18000, newValue: 20400, delta: 2400, deltaPercent: 13.33 },
            ],
          },
        ],
      };
      const emp =
        dummyRevision.employees.find((e: any) => e.employeeId === employeeId) ||
        dummyRevision.employees[0];
      setData({ revision: dummyRevision, employee: emp });
    });
}, [id, employeeId]);

 const handleDownload = async () => {
  if (!id || !employeeId) return;
  try {
    const blob: any = await salaryRevisionService.generateLetter(id, employeeId);
    const url = window.URL.createObjectURL(new Blob([blob.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `Increment_Letter_${employeeId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Failed to download letter", err);
    alert("Letter PDF is not available yet. Backend is still being built.");
  }
};

  if (!data?.employee) return null;

  return (
    <Box>
      <Box className="flex justify-between mb-3">
        <div className="font-bold">Increment Letter</div>
        <Button
          variant="contained"
          className="!bg-primary"
          onClick={handleDownload}
        >
          Download PDF
        </Button>
      </Box>

      <div className="!p-8 !shadow-sm max-w-3xl mx-auto text-sm leading-relaxed bg-white">
        <div className="text-center mb-6">
          <div className="text-lg font-bold">SALARY REVISION LETTER</div>
          <span className="text-xs text-gray-500">Ref: {data.revision.revisionCode}</span>
        </div>

        <p>Date: {formatDate(new Date().toISOString())}</p>
        <p className="mt-3">
          Dear <b>{data.employee.employeeName}</b> ({data.employee.employeeCode}),
        </p>
        <p className="mt-3">
          We are pleased to inform you that your salary has been revised with effect
          from <b>{formatDate(data.employee.effectiveFrom)}</b> on account of{" "}
          {data.revision.reason.replace(/_/g, " ").toLowerCase()}.
        </p>

        <table className="w-full mt-4 border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left text-xs">Component</th>
              <th className="border p-2 text-right text-xs">Previous</th>
              <th className="border p-2 text-right text-xs">Revised</th>
              <th className="border p-2 text-right text-xs">Increase</th>
            </tr>
          </thead>
          <tbody>
            {data.employee.components.map((c: any) => (
              <tr key={c.componentId}>
                <td className="border p-2 text-xs">{c.componentName}</td>
                <td className="border p-2 text-right text-xs">
                  ₹ {c.oldValue.toLocaleString("en-IN")}
                </td>
                <td className="border p-2 text-right text-xs">
                  ₹ {c.newValue.toLocaleString("en-IN")}
                </td>
                <td className="border p-2 text-right text-xs">
                  +₹ {c.delta.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="border p-2 text-xs">Total CTC</td>
              <td className="border p-2 text-right text-xs">
                ₹ {data.employee.oldCtc.toLocaleString("en-IN")}
              </td>
              <td className="border p-2 text-right text-xs">
                ₹ {data.employee.newCtc.toLocaleString("en-IN")}
              </td>
              <td className="border p-2 text-right text-xs">
                +{data.employee.incrementPercent.toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>

        <p className="mt-6">
          We appreciate your continued contribution and wish you greater success in
          the future.
        </p>

        <div className="mt-10">
          <p>Sincerely,</p>
          <p className="mt-6 font-bold">HR Department</p>
        </div>
      </div>
    </Box>
  );
}