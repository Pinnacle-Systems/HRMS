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
import { sortOptions, type Branch } from "./type";

export default function BranchSettings() {
  // Pagination & Sorting State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState("branchName");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [searchTerm, setSearchTerm] = useState("");

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
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();

  // Fetch branches with pagination, sorting, and search
  const getBranches = async () => {
    showSpinner();
    try {
      const params: any = {
        page: page, // 0-based index
        size: limit,
        sort: `${sortBy},${sortOrder}`, // Format: "branchName,ASC"
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
    getBranches();
  }, [page, limit, sortBy, sortOrder, searchTerm]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1); // Convert to 0-based for API
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  const handleSortChange = (
    newSortBy: string,
    newSortOrder?: "ASC" | "DESC",
  ) => {
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
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBranch(null);
    setFormData({});
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
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          showSnackbar("Location fetched successfully!", "success");
        },
        (error) => {
          showSnackbar("Failed to fetch location. Please enable GPS.", "error");
        },
      );
    } else {
      showSnackbar("Geolocation is not supported by this browser.", "error");
    }
  };

  const handleSearchLocation = async () => {
    const address = formData.branchAddress;
    if (!address) {
      showSnackbar("Please enter branch address first", "warning");
      return;
    }
  };

  const handleSave = async () => {
    if (
      !formData.branchName ||
      !formData.branchCode ||
      !formData.branchAddress
    ) {
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
        const res: any = await branchService.updateBranch(
          editingBranch.id,
          updatedValues,
        );
        res.success ? showSnackbar(res.message, "success") : "";
      } else {
        const res: any = await branchService.createBranch(formData);
        res.success ? showSnackbar(res.message, "success") : "";
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
      width: "500px",
      maxWidth: "500px",
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
        <Button
          variant="contained"
          onClick={() => handleOpenDialog()}
          className="!bg-primary"
        >
          Add New Branch
        </Button>
      </div>

      <div className="">
        {/* Search and Sort Bar */}
        <div className="flex justify-between items-center mb-4 gap-4">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by branch name, code or branch head..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="!flex-1"
          />
          <GlobalSort
            options={sortOptions}
            currentSortBy={sortBy}
            currentSortOrder={sortOrder === "ASC" ? "asc" : "desc"}
            onSortChange={(newSortBy, newSortOrder) => {
              handleSortChange(
                newSortBy,
                newSortOrder === "asc" ? "ASC" : "DESC",
              );
            }}
          />
        </div>

        {/* Branches Table */}
        <TableContainer
          component={Paper}
          elevation={0}
          className="h-[calc(100vh-310px)] overflow-auto"
        >
          <Table className="border">
            <TableHead className="bg-gray-100">
              <TableRow className="bg-gray-100 !text-primary">
                <TableCell className="!font-semibold text-gray-800">
                  S No
                </TableCell>
                <TableCell
                  className="!font-semibold text-gray-800 cursor-pointer hover:bg-gray-200"
                  onClick={() =>
                    handleSortChange(
                      "branchCode",
                      sortOrder === "ASC" ? "DESC" : "ASC",
                    )
                  }
                >
                  <div className="flex items-center gap-1">
                    Branch Code
                    {getSortIcon("branchCode")}
                  </div>
                </TableCell>
                <TableCell
                  className="!font-semibold text-gray-800 cursor-pointer hover:bg-gray-200"
                  onClick={() =>
                    handleSortChange(
                      "branchName",
                      sortOrder === "ASC" ? "DESC" : "ASC",
                    )
                  }
                >
                  <div className="flex items-center gap-1">
                    Branch Name
                    {getSortIcon("branchName")}
                  </div>
                </TableCell>
                <TableCell
                  className="!font-semibold text-gray-800 cursor-pointer hover:bg-gray-200"
                  onClick={() =>
                    handleSortChange(
                      "branchAddress",
                      sortOrder === "ASC" ? "DESC" : "ASC",
                    )
                  }
                >
                  <div className="flex items-center gap-1">
                    Address
                    {getSortIcon("branchAddress")}
                  </div>
                </TableCell>
                <TableCell
                  className="!font-semibold text-gray-800 cursor-pointer hover:bg-gray-200"
                  onClick={() =>
                    handleSortChange(
                      "branchHeadId",
                      sortOrder === "ASC" ? "DESC" : "ASC",
                    )
                  }
                >
                  <div className="flex items-center gap-1">
                    Branch Head
                    {getSortIcon("branchHeadId")}
                  </div>
                </TableCell>
                <TableCell
                  className="!font-semibold text-gray-800 cursor-pointer hover:bg-gray-200"
                  onClick={() =>
                    handleSortChange(
                      "radius",
                      sortOrder === "ASC" ? "DESC" : "ASC",
                    )
                  }
                >
                  <div className="flex items-center gap-1">
                    Radius (km)
                    {getSortIcon("radius")}
                  </div>
                </TableCell>
                <TableCell className="!font-semibold text-gray-800 cursor-pointer hover:bg-gray-200">
                  <div className="flex items-center gap-1">Status</div>
                </TableCell>
                <TableCell className="!font-semibold text-gray-800 text-center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map((branch, index) => (
                <TableRow key={branch.id} hover className="!bg-white">
                  <TableCell className="font-medium text-gray-800">
                    {page * limit + index + 1}
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {branch.branchCode}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium text-gray-800">
                    {branch.branchName}
                  </TableCell>
                  <TableCell
                    className="max-w-xs truncate text-gray-800"
                    title={branch.branchAddress}
                  >
                    {branch.branchAddress}
                  </TableCell>
                  <TableCell className="text-gray-800">
                    {branch.branchHeadId}
                  </TableCell>
                  <TableCell className="text-gray-800">
                    {branch.radius} km
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={branch.active ? "Active" : "Inactive"}
                      color={branch.active ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(branch)}
                      >
                        <EditIcon className="!w-4" sx={{ color: "blue" }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          handleDelete(branch.id, branch.branchName)
                        }
                      >
                        <DeleteIcon className="!w-4" sx={{ color: "red" }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {branches.length === 0 && (
            <div className="bg-white text-gray-900 text-center py-8 text-gray-500">
              No branches found
            </div>
          )}
        </TableContainer>

        {/* Global Pagination */}
        {total > 0 && (
          <GlobalPagination
            total={total}
            page={page + 1} // Convert to 1-based for component
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            showTotal={true}
          />
        )}
      </div>

      {/* Add/Edit Branch Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        sx={commonsx}
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-primary ml-4">
            {editingBranch ? "Edit Branch" : "Add New Branch"}
          </div>
          <IconButton onClick={handleCloseDialog}>
            <CloseOutlined />
          </IconButton>
        </div>
        <DialogContent className="">
          <div className="grid gap-5">
            <div>
              <TextField
                fullWidth
                label="Branch Name"
                name="branchName"
                value={formData.branchName || ""}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <TextField
                fullWidth
                label="Branch Code"
                name="branchCode"
                value={formData.branchCode || ""}
                onChange={handleInputChange}
                required
              />
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

            <div>
              <div className="flex gap-2">
                <Button
                  variant="outlined"
                  startIcon={<LocationIcon />}
                  onClick={handleSearchLocation}
                  className="mb-2"
                >
                  Search Location on Map
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<MyLocationIcon />}
                  onClick={handleGetCurrentLocation}
                  className="mb-2"
                >
                  Use Current Location
                </Button>
              </div>
            </div>

            <div>
              <TextField
                fullWidth
                label="Latitude"
                name="latitude"
                type="number"
                value={formData.latitude || ""}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <TextField
                fullWidth
                label="Longitude"
                name="longitude"
                type="number"
                value={formData.longitude || ""}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <TextField
                fullWidth
                label="Radius (km)"
                name="radius"
                type="number"
                value={formData.radius || 5}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <TextField
                fullWidth
                label="Assign Branch Head"
                name="branchHeadId"
                value={formData.branchHeadId || ""}
                onChange={handleInputChange}
                placeholder="Select or enter branch head name"
              />
            </div>
            <div>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active || false}
                    onChange={handleSwitchChange}
                    color="primary"
                  />
                }
                label="Active"
                className="text-gray-800"
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-300">
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            className="!bg-primary"
          >
            {editingBranch ? "Update" : "Save"} Branch
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
