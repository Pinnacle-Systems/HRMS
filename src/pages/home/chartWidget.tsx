import { BarChart, Bar, XAxis, YAxis, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip } from 'recharts';
import { Box, Card, CardHeader, IconButton, Typography } from '@mui/material';
import { ExpandMore as DrillIcon } from '@mui/icons-material';
import type { DashboardWidget } from '../../services/modules/dashboard';

interface ChartWidgetProps {
  widget: DashboardWidget;
  onDrilldown: (actionId: string, context?: any) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

export function ChartWidget({ widget, onDrilldown }: ChartWidgetProps) {
  const { data, actions, type, title } = widget;

  // Chart configuration based on widget.type
  const renderChart = () => {
    const chartData = data?.dataPoints || [];
    const chartType = data?.chartType || 'bar';

    const handleClick = (entry: any) => {
      const action = actions.find(a => a.type === 'drilldown');
      if (action) {
        onDrilldown(action.id, { dimension: entry.dimension, value: entry.value });
      }
    };

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} onClick={handleClick}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#1976D2" onClick={handleClick} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} onClick={handleClick}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#1976D2" onClick={handleClick} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart onClick={handleClick}>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return <Typography>Unsupported chart type</Typography>;
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={title}
        action={
        //   <Tooltip title="Drilldown">
            <IconButton size="small" onClick={() => onDrilldown(actions[0]?.id)}>
              <DrillIcon />
            </IconButton>
        //   </Tooltip>
        }
      />
      <Box sx={{ flex: 1, p: 2 }}>{renderChart()}</Box>
    </Card>
  );
}