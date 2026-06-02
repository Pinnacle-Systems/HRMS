// src/components/RuleBuilder/RuleBlockSelector.tsx

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Lock as LockIcon,
  TrendingUp as TrendingIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

interface RuleBlock {
  id: string;
  name: string;
  description: string;
  category: string;
  isPremium?: boolean;
  isStatutory?: boolean;
}

interface RuleBlockSelectorProps {
  selectedBlocks: string[];
  onToggleBlock: (blockId: string) => void;
  availableBlocks: RuleBlock[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  leave: <ScheduleIcon />,
  attendance: <PeopleIcon />,
  payroll: <MoneyIcon />,
  compliance: <SecurityIcon />,
  performance: <TrendingIcon />,
};

export const RuleBlockSelector: React.FC<RuleBlockSelectorProps> = ({
  selectedBlocks,
  onToggleBlock,
  availableBlocks,
}) => {
  const groupedBlocks = availableBlocks.reduce((acc, block) => {
    if (!acc[block.category]) acc[block.category] = [];
    acc[block.category].push(block);
    return acc;
  }, {} as Record<string, RuleBlock[]>);

  return (
    <Box>
      {Object.entries(groupedBlocks).map(([category, blocks]) => (
        <Box key={category}>
          <Typography variant="subtitle2" gutterBottom>
            {categoryIcons[category]} {category.toUpperCase()}
          </Typography>
          <Grid container spacing={2}>
            {blocks.map((block) => (
              <Grid size={{xs:12,sm:6 ,md:4}} key={block.id}>
                <Card
                  variant={selectedBlocks.includes(block.id) ? 'elevation' : 'outlined'}
                  sx={{
                    cursor: 'pointer',
                    border: selectedBlocks.includes(block.id) ? 2 : 1,
                    borderColor: selectedBlocks.includes(block.id) ? 'primary.main' : 'divider',
                  }}
                  onClick={() => onToggleBlock(block.id)}
                >
                  <CardContent>
                    <Box className="flex items-center justify-between">
                      <Typography variant="subtitle2">{block.name}</Typography>
                      {selectedBlocks.includes(block.id) && <CheckIcon color="primary" fontSize="small" />}
                      {block.isStatutory && (
                        <Tooltip title="Statutory requirement - cannot be disabled">
                          <LockIcon fontSize="small" color="warning" />
                        </Tooltip>
                      )}
                      {block.isPremium && (
                        <Tooltip title="Premium feature">
                          <Chip label="Premium" size="small" color="secondary" />
                        </Tooltip>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {block.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
};