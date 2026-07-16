import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, MenuItem, TextField } from "@mui/material";
import { useAuth } from "../../auth/authContext";
import { useUI } from "../../context/Snackbar";
import { loanAdvanceService, type LoanAdvanceRequestPayload, type LoanAdvanceTypeOption } from "../../services/modules/loanAdvance";
import { selectSx } from "../../const";

export default function LoanAdvanceRequestPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [loanTypes, setLoanTypes] = useState<LoanAdvanceTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    requestType: "LOAN" as "LOAN" | "ADVANCE",
    loanTypeId: "",
    requestedAmount: "",
    reason: "",
    requestedOn: new Date().toISOString().slice(0, 10),
    repaymentMonths: "",
    notes: "",
  });

  const currentEmployeeId = session?.user.userId ?? "";

  useEffect(() => {
    // let active = true;
    const loadTypes = async () => {
      try {
        const response = await loanAdvanceService.getLoanTypes();
        // if (active) {
          setLoanTypes(response?.data ?? []);
        // }
      } catch (error: any) {
        // if (active) {
          showSnackbar(error?.message || "Failed to load loan types", "error");
        // }
      } finally {
        // if (active) {
          setLoading(false);
        // }
      }
    };

    loadTypes();
    return () => {
    //   active = false;
    };
  }, []);

  const selectedType = useMemo(
    () => loanTypes.find((item) => item.id === form.loanTypeId),
    [form.loanTypeId, loanTypes],
  );

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.loanTypeId || !form.requestedAmount || !form.reason) {
      showSnackbar("Please complete the required fields", "error");
      return;
    }

    showSpinner();
    try {
      const payload: LoanAdvanceRequestPayload = {
        employeeId: currentEmployeeId || undefined,
        requestType: form.requestType,
        loanTypeId: form.loanTypeId,
        requestedAmount: Number(form.requestedAmount),
        reason: form.reason,
        requestedOn: form.requestedOn,
        repaymentMonths: form.repaymentMonths ? Number(form.repaymentMonths) : undefined,
        notes: form.notes || undefined,
      };

      await loanAdvanceService.createLoanAdvanceRequest(payload);
      showSnackbar("Loan / advance request submitted successfully", "success");
      navigate("/payroll");
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to submit request", "error");
    } finally {
      hideSpinner();
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Loan / Advance Request</h1>
        <p className="text-sm text-gray-500">Submit a new request and track it from payroll.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:max-w-2xl">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            select
            fullWidth
            label="Request Type"
            value={form.requestType}
            onChange={(event) => handleChange("requestType", event.target.value)}
            sx={selectSx}
          >
            <MenuItem value="LOAN">Loan</MenuItem>
            <MenuItem value="ADVANCE">Advance</MenuItem>
          </TextField>

          <TextField
            select
            fullWidth
            label="Loan Type"
            value={form.loanTypeId}
            onChange={(event) => handleChange("loanTypeId", event.target.value)}
            sx={selectSx}
            disabled={loading}
          >
            {loanTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Requested Amount"
            type="number"
            value={form.requestedAmount}
            onChange={(event) => handleChange("requestedAmount", event.target.value)}
          />

          <TextField
            fullWidth
            label="Requested On"
            type="date"
            value={form.requestedOn}
            onChange={(event) => handleChange("requestedOn", event.target.value)}
          />

          <TextField
            fullWidth
            label="Repayment Months"
            type="number"
            value={form.repaymentMonths}
            onChange={(event) => handleChange("repaymentMonths", event.target.value)}
          />

          <TextField
            fullWidth
            label="Reason"
            value={form.reason}
            onChange={(event) => handleChange("reason", event.target.value)}
          />

          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            className="md:col-span-2"
            value={form.notes}
            onChange={(event) => handleChange("notes", event.target.value)}
          />
        </div>

        {selectedType && (
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            {selectedType.name} • Max amount: {selectedType.maxAmount ?? "N/A"} • Max repayment months: {selectedType.maxRepaymentMonths ?? "N/A"}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outlined" onClick={() => navigate("/payroll")}>Cancel</Button>
          <Button type="submit" variant="contained">Submit Request</Button>
        </div>
      </form>
    </div>
  );
}
