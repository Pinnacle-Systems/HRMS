import { IconButton, Tooltip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
    /** Where to go. Defaults to browser history back. */
    to?: string;
    /** Tooltip label. Defaults to "Back". */
    title?: string;
}

export default function BackButton({ to, title = "Back" }: BackButtonProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };

    return (
        <Tooltip title={title}>
            <IconButton
                onClick={handleClick}
                size="small"
                sx={{
                    border: `1px solid var(--border-color, #e5e7eb)`,
                    borderRadius: 1,
                }}
            >
                <ArrowBackIcon fontSize="small" className="text-gray-500" />
            </IconButton>
        </Tooltip>
    );
}