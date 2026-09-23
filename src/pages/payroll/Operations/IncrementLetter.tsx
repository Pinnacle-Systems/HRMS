import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Button } from "@mui/material";
import { formatDate } from "../../../utils/dateFormatter";
import { salaryRevisionService } from "../../../services/modules/payrollServices/salaryRevision";
import { useUI } from "../../../context/Snackbar";
import BackButton from "../../../components/BackButton";

export default function IncrementLetter() {
  const { id, employeeId } = useParams<{ id: string; employeeId: string }>();
  const [data, setData] = useState<any>(null);
  const { showSnackbar } = useUI();

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
      .catch(() => {
        showSnackbar("Failed to load revision for letter", "error");
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
    }
  };

  if (!data?.employee) return null;

  return (
    <Box>
      <Box className="flex justify-between mb-3 items-center">
        <div className="flex items-center gap-2">
          <BackButton to={`/payroll/revision/${id}`} />
          <div className="font-bold">Increment Letter</div>
        </div>
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