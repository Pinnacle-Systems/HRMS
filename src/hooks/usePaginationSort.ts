import { useState, useCallback, useEffect } from 'react';
import { useUI } from '../context/Snackbar';

interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UsePaginationSortOptions {
  fetchFunction: (params: PaginationParams) => Promise<PaginationResponse<unknown>>;
  defaultLimit?: number;
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  onError?: (error: unknown) => void;
}

export const usePaginationSort = (options: UsePaginationSortOptions) => {
  const {
    fetchFunction,
    defaultLimit = 10,
    defaultSortBy = 'createdAt',
    defaultSortOrder = 'desc',
    onError,
  } = options;

  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  
  const [data, setData] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    showSpinner();
    
    try {
      const params: PaginationParams = {
        page,
        limit,
        sortBy,
        sortOrder,
      };
      
      if (search) {
        params.search = search;
      }
      
      const response = await fetchFunction(params);
      setData(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error: unknown) {
      console.error('Error fetching data:', error);
      if (onError) {
        onError(error);
      } else {
        const errMsg = error instanceof Error ? error.message : 'Failed to fetch data';
        showSnackbar(errMsg, 'error');
      }
    } finally {
      setLoading(false);
      hideSpinner();
    }
  }, [page, limit, sortBy, sortOrder, search, fetchFunction, showSpinner, hideSpinner, showSnackbar, onError]);

  useEffect(() => {
    void (async () => { await fetchData(); })();
  }, [fetchData]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  };

  const handleSortChange = (newSortBy: string, newSortOrder?: 'asc' | 'desc') => {
    if (newSortBy === sortBy) {
      // Toggle order if same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder || 'asc');
    }
    setPage(1); // Reset to first page when sorting
  };

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    setPage(1); // Reset to first page when searching
  };

  const refresh = () => {
    fetchData();
  };

  return {
    // Data
    data,
    total,
    page,
    limit,
    sortBy,
    sortOrder,
    search,
    loading,
    totalPages,
    
    // Handlers
    handlePageChange,
    handleLimitChange,
    handleSortChange,
    handleSearch,
    refresh,
    
    // State setters (for direct control)
    setPage,
    setLimit,
    setSortBy,
    setSortOrder,
    setSearch,
  };
};