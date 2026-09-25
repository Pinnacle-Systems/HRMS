import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Button, Chip } from "@mui/material";
import { formatDate } from "../../../utils/dateFormatter";
import { salaryRevisionService } from "../../../services/modules/payrollServices/salaryRevision";
import { useUI } from "../../../context/Snackbar";
import BackButton from "../../../components/BackButton";
import { apiService } from "../../../services";
import { useAuth } from "../../../auth/authContext";
import { loadCompanyDetails } from "../../../utils/companyDetails";

const joinParts = (
    parts: Array<string | number | null | undefined>,
    sep = ", "
): string => parts.filter((p) => p != null && String(p).trim() !== "").join(sep);

const humanizeComponentType = (t: string | undefined): string => {
    if (!t) return "—";
    const map: Record<string, string> = {
        EARNING: "Earning",
        DEDUCTION: "Deduction",
        EMPLOYER_CONTRIBUTION: "Employer Contribution",
    };
    return map[t] ?? t.charAt(0) + t.slice(1).toLowerCase();
};

export default function IncrementLetter() {
    const { id, employeeId } = useParams<{
        id: string;
        employeeId: string;
    }>();
    const [data, setData] = useState<any>(null);
    const [letterUrl, setLetterUrl] = useState<string | null>(null);
    const { showSnackbar, showSpinner, hideSpinner } = useUI();
    const companyDetails = loadCompanyDetails();
    const { session } = useAuth();

    // ── Load revision + employee ──
    useEffect(() => {
        if (!id) return;
        salaryRevisionService
            .getRevisionById(id)
            .then((res: any) => {
                const revision = res.data;
                const emp = (revision.employees || []).find(
                    (e: any) => e.employeeId === employeeId
                );
                setData({ revision, employee: emp });

                if (
                    emp?.letterUrl &&
                    typeof emp.letterUrl === "string" &&
                    emp.letterUrl.trim() !== ""
                ) {
                    setLetterUrl(emp.letterUrl);
                } else {
                    setLetterUrl(null);
                }
            })
            .catch(() => {
                showSnackbar("Failed to load revision for letter", "error");
            });
    }, [id, employeeId, showSnackbar]);

    // ── Download PDF ──
    const handleDownload = async () => {
        if (!id || !employeeId || !letterUrl) return;
        showSpinner();
        try {
            await apiService.downloadFromPath(
                letterUrl,
                `Increment_Letter_${employeeId}.pdf`
            );
            showSnackbar("Letter downloaded successfully", "success");
        } catch {
            showSnackbar("Failed to download letter", "error");
        } finally {
            hideSpinner();
        }
    };

    if (!data?.employee) return null;

    const { revision, employee } = data;
    const components = employee.components || [];

    const companyName = session?.company?.companyName || "—";
    const companyAddressLine =
        joinParts([
            companyDetails?.companyAddress,
            companyDetails?.cityName,
            companyDetails?.stateName,
            companyDetails?.pincode,
        ]) || "—";
    const companyGstin = companyDetails?.gstNo?.trim() || null;
    const companyPlace = companyDetails?.cityName?.trim() || "—";
    const companyHrContact =
        companyDetails?.phone?.trim() ||
        // companyDetails?.email?.trim() ||
        "the HR department";

    const companyLogoUrl: string | null =
        session?.company?.logoUrl?.trim() ||
        null;

    const letterDate = formatDate(
        revision.issuedAt ||
            revision.createdAt ||
            new Date().toISOString()
    );

    const oldCtc = Number(employee.oldCtc ?? 0);
    const newCtc = Number(employee.newCtc ?? 0);
    const incrementAmount = newCtc - oldCtc;
    const incrementPercent =
        oldCtc > 0
            ? (incrementAmount / oldCtc) * 100
            : Number(employee.incrementPercent ?? 0);

    const reasonText = (revision.reason || "")
        .replace(/_/g, " ")
        .toLowerCase();

    const effectiveFromText = employee.effectiveFrom
        ? formatDate(employee.effectiveFrom)
        : "—";

    return (
        <Box>
            {/* ── Print CSS ── */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .letter-body, .letter-body * { visibility: visible; }
                    .letter-body {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        box-shadow: none !important;
                        padding: 0 !important;
                    }
                    .no-print { display: none !important; }
                }
            `}</style>

            {/* ── Toolbar ── */}
            <Box className="flex justify-between mb-3 items-center no-print">
                <div className="flex items-center gap-2">
                    <BackButton to={`/payroll/revision/${id}`} />
                    <div className="font-bold">Salary Revision Letter</div>
                    {!letterUrl && (
                        <Chip
                            size="small"
                            label="PDF not generated yet"
                            className="!bg-yellow-100 !text-yellow-800"
                        />
                    )}
                </div>
                <Button
                    variant="contained"
                    className="!bg-primary"
                    onClick={handleDownload}
                    disabled={!letterUrl}
                >
                    {letterUrl ? "Download PDF" : "PDF Not Available"}
                </Button>
            </Box>

            {/* ── Letter body ── */}
            <div className="letter-body !p-8 !shadow-sm max-w-3xl mx-auto text-sm leading-relaxed bg-white">
                {/* ── Company letterhead ── */}
                <div className="flex items-center gap-4 border-b border-gray-200 pb-4 mb-6">
                    {/* Logo */}
                    {companyLogoUrl ? (
                        <div className="w-28 h-20">
                            <img
                                src={companyLogoUrl}
                                alt={`${companyName} logo`}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                    // Hide broken image so layout doesn't break
                                    (e.currentTarget as HTMLImageElement).style.display =
                                        "none";
                                }}
                            />
                        </div>
                    ) : null}

                    {/* Company name + address */}
                    <div className="flex-1 text-center">
                        <div className="text-xl font-bold tracking-wide">
                            {companyName}
                        </div>
                        <div className="text-[11px] text-gray-600 mt-1">
                            {companyAddressLine}
                        </div>
                        {companyGstin && (
                            <div className="text-[10px] text-gray-500 mt-0.5">
                                GSTIN: {companyGstin}
                            </div>
                        )}
                    </div>

                    {/* Spacer to keep name visually centered when logo exists */}
                    {companyLogoUrl ? (
                        <div className="shrink-0 w-20 h-20" aria-hidden="true" />
                    ) : null}
                </div>

                {/* ── Letter title ── */}
                <div className="text-center mb-6">
                    <div className="text-base font-bold underline">
                        SALARY REVISION LETTER
                    </div>
                    {(revision.revisionCode || letterDate) && (
                        <div className="text-[11px] text-gray-500 mt-1">
                            {revision.revisionCode && (
                                <>Ref No: {revision.revisionCode}</>
                            )}
                            {revision.revisionCode && letterDate && (
                                <> &nbsp;|&nbsp; </>
                            )}
                            {letterDate && <>Date: {letterDate}</>}
                        </div>
                    )}
                </div>

                {/* ── Employee block ── */}
                <div className="mb-4">
                    <div className="font-semibold">
                        {employee.employeeName}
                    </div>
                    {employee.employeeCode && (
                        <div className="text-[12px] text-gray-700">
                            {employee.employeeCode}
                        </div>
                    )}
                    {(employee.designation || employee.department) && (
                        <div className="text-[12px] text-gray-700">
                            {joinParts(
                                [employee.designation, employee.department],
                                " — "
                            )}
                        </div>
                    )}
                    <div className="text-[12px] text-gray-700">
                        {companyName}
                    </div>
                </div>

                <p className="mt-4">
                    <b>Subject:</b> Revision of Salary with effect from{" "}
                    <b>{effectiveFromText}</b>
                </p>

                <p className="mt-4">Dear {employee.employeeName},</p>

                <p className="mt-3 text-justify">
                    We are pleased to inform you that in recognition of your
                    contributions and performance, your salary has been
                    revised with effect from <b>{effectiveFromText}</b>
                    {reasonText ? (
                        <>
                            {" "}
                            on account of <b>{reasonText}</b>
                        </>
                    ) : null}
                    . The revised salary structure is detailed below.
                </p>

                {/* ── Salary components table ── */}
                <table className="w-full mt-4 border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-2 text-left text-xs">
                                Component
                            </th>
                            <th className="border p-2 text-left text-xs">
                                Type
                            </th>
                            <th className="border p-2 text-right text-xs">
                                Previous (₹)
                            </th>
                            <th className="border p-2 text-right text-xs">
                                Revised (₹)
                            </th>
                            <th className="border p-2 text-right text-xs">
                                Increase (₹)
                            </th>
                            <th className="border p-2 text-right text-xs">
                                %
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {components.map((c: any) => {
                            const oldVal = Number(c.oldValue ?? 0);
                            const newVal = Number(c.newValue ?? 0);
                            const delta =
                                c.delta != null
                                    ? Number(c.delta)
                                    : newVal - oldVal;
                            const pct =
                                oldVal > 0
                                    ? Number(c.deltaPercent ?? 0)
                                    : null;

                            return (
                                <tr
                                    key={c.componentId || c.componentName}
                                >
                                    <td className="border p-2 text-xs">
                                        {c.componentName}
                                    </td>
                                    <td className="border p-2 text-xs">
                                        {humanizeComponentType(
                                            c.componentType
                                        )}
                                    </td>
                                    <td className="border p-2 text-right text-xs">
                                        {oldVal.toLocaleString("en-IN")}
                                    </td>
                                    <td className="border p-2 text-right text-xs">
                                        {newVal.toLocaleString("en-IN")}
                                    </td>
                                    <td className="border p-2 text-right text-xs">
                                        {delta >= 0 ? "+" : "-"}
                                        {Math.abs(delta).toLocaleString(
                                            "en-IN"
                                        )}
                                    </td>
                                    <td className="border p-2 text-right text-xs">
                                        {pct != null
                                            ? `${pct >= 0 ? "+" : ""}${pct.toFixed(
                                                  2
                                              )}%`
                                            : "—"}
                                    </td>
                                </tr>
                            );
                        })}

                        {components.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="border p-2 text-center text-xs text-gray-500"
                                >
                                    No components available.
                                </td>
                            </tr>
                        )}

                        {/* ── Total CTC row ── */}
                        <tr className="font-bold bg-gray-50">
                            <td
                                className="border p-2 text-xs"
                                colSpan={2}
                            >
                                Total CTC (Annual)
                            </td>
                            <td className="border p-2 text-right text-xs">
                                {oldCtc.toLocaleString("en-IN")}
                            </td>
                            <td className="border p-2 text-right text-xs">
                                {newCtc.toLocaleString("en-IN")}
                            </td>
                            <td className="border p-2 text-right text-xs">
                                {incrementAmount >= 0 ? "+" : "-"}
                                {Math.abs(incrementAmount).toLocaleString(
                                    "en-IN"
                                )}
                            </td>
                            <td className="border p-2 text-right text-xs">
                                {incrementPercent >= 0 ? "+" : ""}
                                {incrementPercent.toFixed(2)}%
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ── Terms & Conditions ── */}
                <div className="mt-6">
                    <p className="font-semibold text-[13px]">
                        Terms &amp; Conditions:
                    </p>
                    <ol className="list-decimal pl-6 mt-2 space-y-1 text-[12px] text-gray-700">
                        <li>
                            This revision is effective from{" "}
                            <b>{effectiveFromText}</b> and is subject to
                            company policy.
                        </li>
                        <li>
                            All other terms and conditions of your employment
                            remain unchanged.
                        </li>
                        <li>
                            This letter is confidential and should not be
                            shared with any third party.
                        </li>
                        <li>
                            The company reserves the right to revise or amend
                            the salary structure as per business needs.
                        </li>
                    </ol>
                </div>

                <p className="mt-6 text-justify">
                    We appreciate your continued contribution and wish you
                    greater success in the future.
                </p>

                {/* ── Signature block ── */}
                <div className="mt-10 flex justify-between items-end">
                    <div>
                        <p className="text-[12px] text-gray-700">
                            Place: {companyPlace}
                        </p>
                        <p className="text-[12px] text-gray-700 mt-1">
                            Date: {letterDate}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="h-12" />
                        <p className="font-bold text-[13px]">
                            For {companyName}
                        </p>
                        <p className="text-[12px] mt-1">
                            Authorised Signatory
                        </p>
                        <p className="text-[11px] text-gray-500">
                            HR Department
                        </p>
                    </div>
                </div>

                {/* ── Query contact ── */}
                <p className="mt-6 text-[11px] text-gray-500 text-center">
                    For any queries regarding this revision, please contact
                    HR at {companyHrContact}.
                </p>

                {/* ── Acknowledgement ── */}
                <div className="mt-10 pt-6 border-t border-dashed border-gray-300">
                    <p className="font-semibold text-[13px] mb-3">
                        Employee Acknowledgement
                    </p>
                    <p className="text-[12px] text-gray-700 mb-6">
                        I, <b>{employee.employeeName}</b>
                        {employee.employeeCode
                            ? ` (${employee.employeeCode})`
                            : ""}
                        , acknowledge receipt of this salary revision letter
                        and accept the revised terms.
                    </p>
                    <div className="flex justify-between text-[12px]">
                        <div>
                            <div className="border-t border-gray-400 w-48 mt-8 pt-1">
                                Employee Signature
                            </div>
                        </div>
                        <div>
                            <div className="border-t border-gray-400 w-32 mt-8 pt-1">
                                Date
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Box>
    );
}