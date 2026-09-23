import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import { salaryRevisionService } from "../../../services/modules/payrollServices/salaryRevision";
import { useUI } from "../../../context/Snackbar";
import CreateRevision from "./CreateRevision";

export default function EditRevision() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showSpinner, hideSpinner, showSnackbar } = useUI();
    const [initialData, setInitialData] = useState<any>(null);

    useEffect(() => {
        if (!id) return;
        showSpinner();
        salaryRevisionService
            .getRevisionById(id)
            .then((res: any) => {
                const rev = res?.data;
                if (rev?.status !== "DRAFT") {
                    showSnackbar("Only DRAFT revisions can be edited", "warning");
                    navigate(`/payroll/revision/${id}`, { replace: true });
                    return;
                }
                setInitialData(rev);
            })
            .catch((err) => {
                console.error("Failed to load revision", err);
                showSnackbar("Failed to load revision", "error");
                navigate("/payroll/revision");
            })
            .finally(() => hideSpinner());
    }, [id]);

    if (!initialData) return null;

    return (
        <Box>
            <CreateRevision
                mode="edit"
                revisionId={id}
                initialData={initialData}
            />
        </Box>
    );
}