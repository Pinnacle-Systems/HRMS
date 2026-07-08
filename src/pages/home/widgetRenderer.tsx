import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import type { DashboardWidget } from "../../services/modules/dashboard";

interface WidgetRendererProps {
  widget: DashboardWidget;
  onRefresh?: () => void;
  onDrilldown?: (actionId: string) => void;
}

export function WidgetRenderer({ widget, onRefresh, onDrilldown }: WidgetRendererProps) {
  const renderWidgetContent = () => {
    switch (widget.type) {
      case "chart":
        return <ChartWidget data={widget.data} />;
      case "table":
        return <TableWidget />;
      case "metric":
        return <MetricWidget data={widget.data} />;
      case "summary":
        return <SummaryWidget data={widget.data} />;
      case "list":
        return <ListWidget data={widget.data} />;
      default:
        return (
          <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
            Unknown widget type: {widget.type}
          </Typography>
        );
    }
  };

  return (
    <Card>
      <CardHeader
        title={widget.title}
        action={
          <Box>
            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={onRefresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
            {widget.actions.length > 0 && onDrilldown && (
              <Tooltip title="Drilldown">
                <IconButton
                  size="small"
                  onClick={() => onDrilldown(widget.actions[0].id)}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        }
      />
      <CardContent>{renderWidgetContent()}</CardContent>
    </Card>
  );
}

// Sample Widget Components
function ChartWidget({ data }: { data: any }) {
  return (
    <Box sx={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Typography color="textSecondary">Chart Widget</Typography>
      <Typography variant="caption">
        Data: {JSON.stringify(data)}
      </Typography>
    </Box>
  );
}

function TableWidget() {
  return (
    <Box>
      <Typography color="textSecondary">Table Widget</Typography>
    </Box>
  );
}

function MetricWidget({ data }: { data: any }) {
  return (
    <Box sx={{ textAlign: "center", py: 2 }}>
      <Typography variant="h3" color="primary">
        {data?.value || 0}
      </Typography>
      <Typography color="textSecondary">{data?.label || "Metric"}</Typography>
    </Box>
  );
}

function SummaryWidget({ data }: { data: any }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 2 }}>
      {Object.entries(data || {}).map(([key, value]) => (
        <Box key={key} sx={{ textAlign: "center", p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          <Typography variant="h6">{String(value)}</Typography>
          <Typography variant="caption" color="textSecondary">
            {key}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function ListWidget({ data }: { data: any }) {
  const items = Array.isArray(data) ? data : [];
  return (
    <Box>
      {items.map((item, index) => (
        <Box key={index} sx={{ py: 1, borderBottom: "1px solid #eee" }}>
          <Typography variant="body2">{String(item)}</Typography>
        </Box>
      ))}
    </Box>
  );
}