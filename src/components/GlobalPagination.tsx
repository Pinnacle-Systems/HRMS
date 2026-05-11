import { TablePagination, Box, Select, MenuItem, FormControl, Pagination } from '@mui/material';

interface GlobalPaginationProps {
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  showTotal?: boolean;
  variant?: 'table' | 'simple';
}

export const GlobalPagination = ({
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  showSizeChanger = true,
  pageSizeOptions = [5, 10, 20, 50, 100],
  showTotal = true,
  variant = 'table',
}: GlobalPaginationProps) => {
  const totalPages = Math.ceil(total / limit);

  if (variant === 'simple') {
    return (
      <Box className="flex justify-end items-center gap-4 mt-4">
        {showSizeChanger && (
          <FormControl size="small" className="min-w-[100px]">
            <Select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <MenuItem key={size} value={size}>
                  {size} / page
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => onPageChange(value)}
          color="primary"
          size="medium"
          showFirstButton
          showLastButton
        />
        
        {showTotal && (
          <span className="text-sm text-gray-600">
            Total: {total} items
          </span>
        )}
      </Box>
    );
  }

  return (
    <TablePagination
      component="div"
      count={total}
      page={page - 1}
      onPageChange={(_, newPage) => onPageChange(newPage + 1)}
      rowsPerPage={limit}
      onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
      rowsPerPageOptions={pageSizeOptions}
      labelRowsPerPage="Rows Per Page:"
      labelDisplayedRows={({ from, to, count }) =>
        `${from}-${to} of ${count}`
      }
      showFirstButton
      showLastButton
      className='!text-gray-800'
    />
  );
};