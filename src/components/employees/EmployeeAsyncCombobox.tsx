import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import {
  employeeService,
  normalizeEmployeePageResponse,
  type EmployeeListQuery,
  type EmployeeSummaryResponse,
} from "../../services/modules/employees";

type EmployeeOption =
  | EmployeeSummaryResponse
  | { id: "__load_more__"; name: string; employeeId: string };

export interface EmployeeAsyncComboboxProps {
  value: string | null;
  onChange: (
    employeeId: string | null,
    employee?: EmployeeSummaryResponse | null,
  ) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  size?: "small" | "medium";
  filters?: Partial<EmployeeListQuery>;
  includeInactive?: boolean;
  pageSize?: number;
  selectedEmployee?: EmployeeSummaryResponse | null;
  getOptionDisabled?: (employee: EmployeeSummaryResponse) => boolean;
}

const LOAD_MORE_OPTION: EmployeeOption = {
  id: "__load_more__",
  name: "Load more",
  employeeId: "",
};

const isLoadMoreOption = (option: EmployeeOption) =>
  option.id === LOAD_MORE_OPTION.id;

const getEmployeeKey = (employee: EmployeeSummaryResponse) =>
  employee.id || employee.employeeId || "";

const getEmployeeLabel = (employee: EmployeeSummaryResponse | null) => {
  if (!employee) return "";
  const name = employee.name || employee.fullName || employee.employeeName || "Employee";
  return employee.employeeId ? `${name} (${employee.employeeId})` : name;
};

const mergeUniqueEmployees = (
  current: EmployeeSummaryResponse[],
  next: EmployeeSummaryResponse[],
) => {
  const seen = new Set(current.map(getEmployeeKey).filter(Boolean));
  const merged = [...current];

  next.forEach((employee) => {
    const key = getEmployeeKey(employee);
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(employee);
  });

  return merged;
};

export const EmployeeAsyncCombobox = ({
  value,
  onChange,
  label = "Employee",
  placeholder = "Search employee by name or ID...",
  disabled = false,
  required = false,
  error = false,
  helperText,
  size = "medium",
  filters,
  includeInactive = false,
  pageSize = 20,
  selectedEmployee,
  getOptionDisabled,
}: EmployeeAsyncComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [employees, setEmployees] = useState<EmployeeSummaryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const listboxRef = useRef<HTMLElement | null>(null);
  const pendingScrollTopRef = useRef<number | null>(null);

  const selectedFallback = useMemo<EmployeeSummaryResponse | null>(() => {
    if (!value) return null;
    return (
      selectedEmployee ||
      employees.find((employee) => getEmployeeKey(employee) === value) || {
        id: value,
        name: "Selected employee",
      }
    );
  }, [employees, selectedEmployee, value]);

  const options = useMemo<EmployeeOption[]>(() => {
    const merged = selectedFallback
      ? mergeUniqueEmployees([selectedFallback], employees)
      : employees;
    return hasMore ? [...merged, LOAD_MORE_OPTION] : merged;
  }, [employees, hasMore, selectedFallback]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(inputValue.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [inputValue]);

  const fetchEmployees = useCallback(
    async (targetPage: number, search: string, append = false) => {
      setLoading(true);
      setFetchError("");

      try {
        const response = await employeeService.getEmployees({
          page: targetPage,
          size: pageSize,
          sort: "name,ASC",
          search,
          includeInactive,
          ...filters,
        });
        const employeePage = normalizeEmployeePageResponse(response);
        setEmployees((current) =>
          append
            ? mergeUniqueEmployees(current, employeePage.content)
            : employeePage.content,
        );
        setPage(employeePage.number);
        setHasMore(!employeePage.last && employeePage.totalPages > targetPage + 1);
      } catch (requestError) {
        setFetchError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load employees",
        );
        if (!append) {
          setEmployees([]);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [filters, includeInactive, pageSize],
  );

  useLayoutEffect(() => {
    if (pendingScrollTopRef.current === null) return;

    const scrollTop = pendingScrollTopRef.current;
    let secondAnimationFrame = 0;
    const restoreScrollTop = () => {
      if (listboxRef.current) {
        listboxRef.current.scrollTop = scrollTop;
      }
    };

    const firstAnimationFrame = window.requestAnimationFrame(() => {
      restoreScrollTop();
      secondAnimationFrame = window.requestAnimationFrame(() => {
        restoreScrollTop();
        pendingScrollTopRef.current = null;
      });
    });

    return () => {
      window.cancelAnimationFrame(firstAnimationFrame);
      window.cancelAnimationFrame(secondAnimationFrame);
    };
  }, [employees.length, page]);

  useEffect(() => {
    if (!open || disabled) return;
    void fetchEmployees(0, debouncedSearch, false);
  }, [debouncedSearch, disabled, fetchEmployees, open]);

  const selectedOption = selectedFallback
    ? options.find((option) => getEmployeeKey(option) === getEmployeeKey(selectedFallback)) ||
      selectedFallback
    : null;

  const handleOpen = () => {
    setOpen(true);
  };

  const handleLoadMore = () => {
    pendingScrollTopRef.current = listboxRef.current?.scrollTop ?? null;
    void fetchEmployees(page + 1, debouncedSearch, true);
  };

  const helper = fetchError || helperText;

  return (
    <Autocomplete
      slotProps={{
        listbox: {
          ref: (node: Element | null) => {
            listboxRef.current = node as HTMLElement | null;
          },
        },
      }}
      open={open}
      onOpen={handleOpen}
      onClose={() => {
        setOpen(false);
        setInputValue("");
      }}
      disabled={disabled}
      options={options}
      value={selectedOption}
      inputValue={open ? inputValue : getEmployeeLabel(selectedFallback)}
      loading={loading}
      filterOptions={(availableOptions) => availableOptions}
      getOptionLabel={(option) =>
        isLoadMoreOption(option) ? "Load more" : getEmployeeLabel(option)
      }
      isOptionEqualToValue={(option, selected) =>
        getEmployeeKey(option) === getEmployeeKey(selected)
      }
      getOptionDisabled={(option) =>
        isLoadMoreOption(option)
          ? loading
          : Boolean(getOptionDisabled?.(option as EmployeeSummaryResponse))
      }
      noOptionsText={fetchError ? "Failed to load employees" : "No employees found"}
      onInputChange={(_event, nextValue, reason) => {
        if (reason !== "reset") {
          setInputValue(nextValue);
        }
      }}
      onChange={(_event, option) => {
        if (!option) {
          onChange(null, null);
          return;
        }

        if (isLoadMoreOption(option)) {
          handleLoadMore();
          return;
        }

        onChange(getEmployeeKey(option), option);
      }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;

        if (isLoadMoreOption(option)) {
          return (
            <li
              key={key}
              {...optionProps}
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleLoadMore();
              }}
            >
              <Button size="small" fullWidth disabled={loading} tabIndex={-1}>
                {loading ? "Loading..." : "Load more"}
              </Button>
            </li>
          );
        }

        return (
          <li key={key} {...optionProps}>
            <Box>
              <Box className="flex items-center gap-2">
                <Typography variant="body2" className="font-medium">
                  {option.name || "Employee"}
                </Typography>
                {option.employeeId && (
                  <Typography variant="caption" color="text.secondary">
                    ({option.employeeId})
                  </Typography>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {[option.designation, option.department, option.branch]
                  .filter(Boolean)
                  .join(" / ") || "Employee"}
              </Typography>
            </Box>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error || Boolean(fetchError)}
          helperText={helper}
          size={size}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={18} /> : null}
                  {params.slotProps.input.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
};

export default EmployeeAsyncCombobox;
