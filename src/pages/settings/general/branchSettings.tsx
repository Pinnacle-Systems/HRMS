import { useState, useEffect } from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Tooltip,
  Autocomplete,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  CloseOutlined,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import { getCurrentRouteLabel } from "../const";
import { branchService } from "../../../services/modules/branch";
import { useUI } from "../../../context/Snackbar";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { GlobalSort } from "../../../components/GlobalSort";
import { sortOptions, type Branch, type Employee } from "./type";
import { getRowColor } from "../../const";
import { employeeService } from "../../../services/modules/employees";
// import { LocationMap } from "../../../components/Location";
import LocationMap from "../../../components/Map";


export default function BranchSettings() {
  // Pagination & Sorting State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState("branchName");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMap, setShowMap] = useState(false);
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [mapUrl, setMapUrl] = useState("");
  const [googleMapLink, setGoogleMapLink] = useState("");

  // Employee list for branch head dropdown
  const [employees, setEmployees] = useState<Employee[]>([]);
  const selectedEmployee = employees.find(emp => emp.id === formData.branchHeadId) || null;

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<Partial<Branch>>({
    branchName: "",
    branchCode: "",
    branchAddress: "",
    latitude: 0,
    longitude: 0,
    radius: 5,
    branchHeadId: "",
    active: true,
  });

  // Fetch active employees for branch head dropdown
  const getActiveEmployees = async () => {
    try {
      const response: any = await employeeService.getEmployees({ size: 100 });
      setEmployees(response.data.content || response.data || []);
    } catch (error: any) {
      showSnackbar(error.message, error);
    }
  };

  // Fetch branches with pagination, sorting, and search
  const getBranches = async () => {
    showSpinner();
    try {
      const params: any = {
        page: page,
        size: limit,
        sort: `${sortBy},${sortOrder}`,
      };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response: any = await branchService.getBranches(params);
      if (response.success) {
        setBranches(response.data.content || response.data || []);
        setTotal(
          response.data.totalElements ||
          response.data.total ||
          response.data.length ||
          0,
        );
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      getBranches();
      getActiveEmployees();
    });
  }, [page, limit, sortBy, sortOrder, searchTerm]);

  const generateMapFromAddress = async (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    setMapUrl(
      `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    );
    setGoogleMapLink(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
    );
    try {
      // Fetch latitude & longitude
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch coordinates", error);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (formData.branchAddress) {
        generateMapFromAddress(formData.branchAddress);
      }
    }, 700);
    return () => clearTimeout(timeout);
  }, [formData.branchAddress]);


  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  const handleSortChange = (newSortBy: string, newSortOrder?: "ASC" | "DESC") => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder || "ASC");
    setPage(0);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(0);
  };

  const handleOpenDialog = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData(branch);
    } else {
      setEditingBranch(null);
      setFormData({
        branchName: "",
        branchCode: "",
        branchAddress: "",
        latitude: 0,
        longitude: 0,
        radius: 5,
        branchHeadId: "",
        active: true,
      });
    }
    setShowMap(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBranch(null);
    setFormData({});
    setShowMap(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "radius" || name === "latitude" || name === "longitude"
          ? parseFloat(value)
          : value,
    }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      active: e.target.checked,
    }));
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            const address = data?.display_name || "";
            setFormData((prev) => ({
              ...prev,
              latitude: lat,
              longitude: lng,
              branchAddress: address,
            }));
            setShowMap(true);
            setMapUrl(
              `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`
            );
            setGoogleMapLink(
              `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
            );
            showSnackbar("Location fetched successfully!", "success");
          } catch (error) {
            console.error(error);
            showSnackbar("Failed to fetch address", "error");
          }
        },
        (error: any) => {
          showSnackbar(
            error.message || "Failed to fetch location. Please enable GPS.",
            "error"
          );
        }
      );
    } else {
      showSnackbar(
        "Geolocation is not supported by this browser.",
        "error"
      );
    }
  };

  const handleSave = async () => {
    if (!formData.branchName || !formData.branchCode || !formData.branchAddress) {
      showSnackbar("Please fill all required fields", "error");
      return;
    }

    showSpinner();
    try {
      if (editingBranch) {
        const updatedValues = {
          branchName: formData.branchName,
          branchCode: formData.branchCode,
          branchAddress: formData.branchAddress,
          latitude: formData.latitude,
          longitude: formData.longitude,
          radius: formData.radius,
          branchHeadId: formData.branchHeadId,
          active: formData.active,
        };
        const res: any = await branchService.updateBranch(editingBranch.id, updatedValues);
        if (res.success) {
          showSnackbar(res.message, "success");
        }
      } else {
        const res: any = await branchService.createBranch(formData);
        if (res.success) {
          showSnackbar(res.message, "success");
        }
      }
      await getBranches();
      handleCloseDialog();
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDelete = async (id: string, branchName: string) => {
    showConfirmDialog({
      title: "Delete Branch",
      message: `Are you sure you want to delete "${branchName}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          const res: any = await branchService.deleteBranchById(id);
          if (res.success) {
            showSnackbar(res.message, "success");
            await getBranches();
          }
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const commonsx = {
    "& .MuiDialog-paper": {
      width: "700px",
      maxWidth: "700px",
    },
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === "ASC" ? (
      <ArrowUpward fontSize="small" className="ml-1" />
    ) : (
      <ArrowDownward fontSize="small" className="ml-1" />
    );
  };

  return (
    <>
      <div className="flex justify-between items-center mt-3 mb-3">
        <div className="text-gray-500 text-sm flex items-center gap-1 ">
          Settings <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
          <span className="text-primary font-medium">
            {getCurrentRouteLabel()}
          </span>
        </div>
        <Button variant="contained" onClick={() => handleOpenDialog()} className="!bg-primary">
          Add New Branch
        </Button>
      </div>

      <div className="">
        {/* Search and Sort Bar */}
        <div className="flex justify-between items-center mb-4 gap-4">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by branch name, code or branch Address..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="!flex-1"
          />
          <GlobalSort
            options={sortOptions}
            currentSortBy={sortBy}
            currentSortOrder={sortOrder === "ASC" ? "asc" : "desc"}
            onSortChange={(newSortBy, newSortOrder) => {
              handleSortChange(newSortBy, newSortOrder === "asc" ? "ASC" : "DESC");
            }}
          />
        </div>

        {/* Branches Table */}
        <TableContainer
          component={Paper}
          elevation={0}
          className="h-[calc(100vh-290px)] overflow-auto bg-white-50"
        >
          <Table stickyHeader className="border">
            <TableHead className="bg-gray-100">
              <TableRow className="bg-gray-100 !text-primary">
                <TableCell className="!font-semibold text-gray-800">S No</TableCell>
                <TableCell className="!font-semibold text-gray-800 cursor-pointer hover:bg-gray-200" onClick={() => handleSortChange("branchCode", sortOrder === "ASC" ? "DESC" : "ASC")}>
                  <div className="flex items-center gap-1">Branch Code {getSortIcon("branchCode")}</div>
                </TableCell>
                <TableCell className="!font-semibold text-gray-800 cursor-pointer hover:bg-gray-200" onClick={() => handleSortChange("branchName", sortOrder === "ASC" ? "DESC" : "ASC")}>
                  <div className="flex items-center gap-1">Branch Name {getSortIcon("branchName")}</div>
                </TableCell>
                <TableCell className="!font-semibold text-gray-800 cursor-pointer hover:bg-gray-200" onClick={() => handleSortChange("branchAddress", sortOrder === "ASC" ? "DESC" : "ASC")}>
                  <div className="flex items-center gap-1">Address {getSortIcon("branchAddress")}</div>
                </TableCell>
                <TableCell className="!font-semibold text-gray-800">
                  <div className="flex items-center gap-1">Branch Head</div>
                </TableCell>
                <TableCell className="!font-semibold text-gray-800 cursor-pointer hover:bg-gray-200" onClick={() => handleSortChange("radius", sortOrder === "ASC" ? "DESC" : "ASC")}>
                  <div className="flex items-center gap-1">Radius (km) {getSortIcon("radius")}</div>
                </TableCell>
                <TableCell className="!font-semibold text-gray-800">Status</TableCell>
                <TableCell className="!font-semibold text-gray-800 text-center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map((branch, index) => (
                <TableRow key={branch.id} hover sx={getRowColor(index)}>
                  <TableCell className="font-medium text-gray-800">{page * limit + index + 1}</TableCell>
                  <TableCell>{branch.branchCode}</TableCell>
                  <TableCell className="font-medium text-gray-800">{branch.branchName}</TableCell>
                  <TableCell className="max-w-xs truncate text-gray-800" title={branch.branchAddress}>
                    {branch.branchAddress}
                  </TableCell>
                  <TableCell className="text-gray-800">{branch.branchHeadName}</TableCell>
                  <TableCell className="text-gray-800">{branch.radius} km</TableCell>
                  <TableCell>
                    <Chip label={branch.active ? "Active" : "Inactive"} color={branch.active ? "success" : "error"} size="small" />
                  </TableCell>
                  <TableCell className="!flex">
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" className="!mr-2" onClick={() => handleOpenDialog(branch)}>
                        <EditIcon className="!w-4" sx={{ color: "#0087ff" }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(branch.id, branch.branchName)}>
                        <DeleteIcon className="!w-4" sx={{ color: "#ef4444" }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {branches.length === 0 && (
            <div className="bg-white border border-gray-200 border-t-0 text-gray-900 text-center py-8 text-gray-500">No branches found</div>
          )}
        </TableContainer>

        {/* Global Pagination */}
        {total > 0 && (
          <GlobalPagination
            total={total}
            page={page + 1}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            showTotal={true}
          />
        )}
      </div>

      {/* Add/Edit Branch Dialog with Integrated Map */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" sx={commonsx}>
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-primary ml-4">{editingBranch ? "Edit Branch" : "Add New Branch"}</div>
          <IconButton onClick={handleCloseDialog}>
            <CloseOutlined />
          </IconButton>
        </div>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <div className="grid gap-5">
            <div className="flex gap-3">
              <div className="w-full">
                <TextField
                  fullWidth
                  label="Branch Name"
                  name="branchName"
                  value={formData.branchName || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="w-full">
                <TextField
                  fullWidth
                  label="Branch Code"
                  name="branchCode"
                  value={formData.branchCode || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div>
              <TextField
                fullWidth
                label="Branch Address"
                name="branchAddress"
                multiline
                rows={2}
                value={formData.branchAddress || ""}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Location Section with Integrated Map */}
            <div>
              <div className="flex gap-2 mb-3">
                <Button
                  variant="outlined"
                  startIcon={<LocationIcon />}
                  onClick={() => setShowMap(!showMap)}
                >
                  {showMap ? "Hide Map" : "Search Location on Map"}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<MyLocationIcon />}
                  onClick={handleGetCurrentLocation}
                >
                  Use Current Location
                </Button>
              </div>

              {/* Integrated Map */}
              {/* {showMap && (
                <div className="mt-3">
                  <LocationMap
                    address={formData.branchAddress || ""}
                    latitude={formData.latitude || 0}
                    longitude={formData.longitude || 0}
                    onLocationChange={handleLocationFromMap}
                  />
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowMap(false)}
                    className="mt-2"
                  >
                    Close Map
                  </Button>
                </div>
              )} */}
              {
                showMap &&
                <LocationMap
                  mapUrl={mapUrl}
                  googleMapLink={googleMapLink}
                  style={{
                    height: "250px",
                    width: "100%",
                  }}
                />
              }
            </div>

            {/* Latitude & Longitude Fields */}
            <div className="grid grid-cols-3 gap-4">
              <TextField
                fullWidth
                label="Latitude"
                name="latitude"
                type="number"
                value={formData.latitude || ""}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                label="Longitude"
                name="longitude"
                type="number"
                value={formData.longitude || ""}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                label="Radius (km)"
                name="radius"
                type="number"
                value={formData.radius || 5}
                onChange={handleInputChange}
              />
            </div>

            {/* Branch Head Autocomplete */}
            <div className="w-[50%]">
              <Autocomplete
                options={employees}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return `${option.name} (${option.employeeId})`;
                }}
                value={selectedEmployee}
                onChange={(_event, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    branchHeadId: newValue ? newValue.id : "",
                    // branchHeadName: newValue ? `${newValue.name} (${newValue.employeeId})` : "",
                  }));
                }}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                renderOption={(props, option) => {
                  const { key, ...restProps } = props;
                  return (
                    <li key={key} {...restProps}>
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{option.name}</span>
                            <span className="text-xs text-gray-400">({option.employeeId})</span>
                          </div>
                          <div className="text-xs text-gray-500">{option.designation || "Employee"}</div>
                        </div>
                      </div>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assign Branch Head"
                    placeholder="Search employee by name or ID..."
                  />
                )}
                loading={employees.length === 0}
                loadingText="Loading employees..."
                noOptionsText="No employees found"
                filterOptions={(options, state) => {
                  const searchLower = state.inputValue.toLowerCase();
                  return options.filter(option =>
                    option.name?.toLowerCase().includes(searchLower) ||
                    option.employeeId?.toLowerCase().includes(searchLower) ||
                    option.emailAddress?.toLowerCase().includes(searchLower) ||
                    option.designation?.toLowerCase().includes(searchLower)
                  );
                }}
              />
            </div>

            <div>
              <FormControlLabel
                control={<Switch checked={formData.active || false} onChange={handleSwitchChange} color="primary" />}
                label="Active"
                className="text-gray-800"
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-300">
          <Button onClick={handleCloseDialog} variant="outlined" className="!text-gray-800 !border-gray-300">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" className="!bg-primary">
            {editingBranch ? "Update" : "Save"} Branch
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}