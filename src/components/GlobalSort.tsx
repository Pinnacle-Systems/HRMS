import { Box, Button, Menu, MenuItem, IconButton, Tooltip } from '@mui/material';
import { ArrowUpward, ArrowDownward, Sort as SortIcon } from '@mui/icons-material';
import { useState } from 'react';

interface SortOption {
  value: string;
  label: string;
}

interface GlobalSortProps {
  options: SortOption[];
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export const GlobalSort = ({
  options,
  currentSortBy,
  currentSortOrder,
  onSortChange,
}: GlobalSortProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSortSelect = (sortBy: string) => {
    const newOrder = sortBy === currentSortBy && currentSortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(sortBy, newOrder);
    handleClose();
  };

  const getCurrentSortLabel = () => {
    const option = options.find(opt => opt.value === currentSortBy);
    return option ? `${option.label} (${currentSortOrder === 'asc' ? 'Ascending' : 'Descending'})` : 'Sort';
  };

  return (
    <Box>
      <Tooltip title="Sort">
        <Button
          variant="outlined"
          startIcon={<SortIcon />}
          endIcon={currentSortOrder === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
          onClick={handleClick}
          size="small"
          className='!capitalize'
        >
          {getCurrentSortLabel()}
        </Button>
      </Tooltip>
      
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {options.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleSortSelect(option.value)}
            selected={currentSortBy === option.value}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <span className='!text-[12px]'>{option.label}</span>
            {/* {currentSortBy === option.value && (
              currentSortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
            )} */}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};