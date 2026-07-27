import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Tooltip,
  Collapse,
  Box,
  Autocomplete,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocationIcon from "@mui/icons-material/LocationOn";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AddIcon from "@mui/icons-material/Add";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { getCurrentRouteLabel } from "../const";
import { branchService } from "../../../services/modules/branch";
import { bankService, type BankStatus } from "../../../services/modules/bank";
import { useUI } from "../../../context/Snackbar";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { GlobalSort } from "../../../components/GlobalSort";
import { sortOptions, type Branch, type BankDetail, type Bank } from "./type";
import {
  getRowColor,
  getStickyLeftSx,
  getStickyRightSx,
  handleEnterAsTab,
  stickyHeaderLeftSx,
  stickyHeaderRightSx,
} from "../../const";
import LocationMap from "../../../components/Map";
import EmployeeAsyncCombobox from "../../../components/employees/EmployeeAsyncCombobox";
import type { EmployeeSummaryResponse } from "../../../services/modules/employees";
import { companyService } from "../../../services/modules/company";

export default function BranchSettings() {
  // Pagination & Sorting State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMap, setShowMap] = useState(false);
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [mapUrl, setMapUrl] = useState("");
  const [googleMapLink, setGoogleMapLink] = useState("");
  const [selectedBranchHead, setSelectedBranchHead] =
    useState<EmployeeSummaryResponse | null>(null);

  // Bank State
  const [expandedBranchId, setExpandedBranchId] = useState<string | null>(null);
  const [banksByBranch, setBanksByBranch] = useState<
    Record<string, BankDetail[]>
  >({});
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankDetail | null>(null);
  const [bankFormData, setBankFormData] = useState<Partial<BankDetail>>({});
  const [currentBranchForBank, setCurrentBranchForBank] = useState<string>("");

  const [companyId, setCompanyId] = useState<string>("");
  const [banks, setBanks] = useState<Bank[]>([]);

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
    pfCode: "",
    pfLocation: "",
    esiCode: "",
    esiLocation: "",
    contactEmail: "",
    contactNumber: "",
  });

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
      // createDefaultBranch();
    });
  }, [page, limit, sortBy, sortOrder, searchTerm]);

  const generateMapFromAddress = async (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    setMapUrl(
      `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`,
    );
    setGoogleMapLink(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    );
    try {
      // Fetch latitude & longitude
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
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
      setSelectedBranchHead(
        branch.branchHeadId
          ? {
            id: branch.branchHeadId,
            name: String(branch.branchHeadName || branch.branchHeadId),
          }
          : null,
      );
    } else {
      setEditingBranch(null);
      setSelectedBranchHead(null);
      setFormData({
        branchName: "",
        branchCode: "",
        branchAddress: "",
        latitude: 0,
        longitude: 0,
        radius: 5,
        branchHeadId: "",
        active: true,
        pfCode: "",
        pfLocation: "",
        esiCode: "",
        esiLocation: "",
        contactEmail: "",
        contactNumber: "",
      });
    }
    setShowMap(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBranch(null);
    setSelectedBranchHead(null);
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
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
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
              `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`,
            );
            setGoogleMapLink(
              `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
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
            "error",
          );
        },
      );
    } else {
      showSnackbar("Geolocation is not supported by this browser.", "error");
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
          radius: formData.radius || 5,
          branchHeadId: formData.branchHeadId,
          active: formData.active,
          pfCode: formData.pfCode,
          esiCode: formData.esiCode,
          pfLocation: formData.pfLocation,
          esiLocation: formData.esiLocation,
          contactEmail: selectedBranchHead?.emailAddress,
          contactNumber: selectedBranchHead?.mobileNumber,
        };
        const res: any = await branchService.updateBranch(
          editingBranch.id,
          updatedValues,
        );
        if (res.success) {
          showSnackbar(res.message, "success");
        }
      } else {
        const payload = {
          branchName: formData.branchName,
          branchAddress: formData.branchAddress,
          latitude: formData.latitude,
          longitude: formData.longitude,
          radius: formData.radius,
          branchHeadId: formData.branchHeadId,
          branchCode: formData.branchCode,
          active: formData.active,
          pfCode: formData.pfCode,
          esiCode: formData.esiCode,
          pfLocation: formData.pfLocation,
          esiLocation: formData.esiLocation,
          contactEmail: selectedBranchHead?.emailAddress,
          contactNumber: selectedBranchHead?.mobileNumber,
        };
        const res: any = await branchService.createBranch(payload);
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

  const handleToggleStatus = async (branch: Branch) => {
    showSpinner();
    try {
      const res: any = await branchService.toggleBranchById(branch.id);
      if (res.success) {
        showSnackbar(
          `Branch ${!branch.active ? "activated" : "deactivated"} successfully!`,
          "success",
        );
        await getBranches();
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
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

  const fetchCompanyInfo = async () => {
    try {
      const companyData: any = await companyService.getCompany();
      setCompanyId(companyData.data.length ? companyData.data?.[0].id : "");
    } catch (err: any) {
      showSnackbar(err.message || "Failed to fetch company info", "error");
    }
  };

  const fetchBankList = async () => {
    try {
      const bankData: any = await bankService.getBankDropdown();
      setBanks(bankData.data);
    } catch (err: any) {
      showSnackbar(err.message || "Failed to fetch banks", "error");
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
    fetchBankList();
  }, []);

  const loadBanksForBranch = async (branchId: string) => {
    try {
      const res: any = await bankService.getBanks({ branchId });
      setBanksByBranch((prev) => ({
        ...prev,
        [branchId]: res.data?.content || res.data || [],
      }));
    } catch (error: any) {
      showSnackbar(error.message, "error");
    }
  };

  const toggleExpand = (branchId: string) => {
    if (expandedBranchId === branchId) {
      setExpandedBranchId(null);
    } else {
      setExpandedBranchId(branchId);
      loadBanksForBranch(branchId);
    }
  };

  const handleOpenBankDialog = (branchId: string, bank?: BankDetail) => {
    setCurrentBranchForBank(branchId);
    if (bank) {
      setEditingBank(bank);
      setBankFormData(bank);
    } else {
      setEditingBank(null);
      setBankFormData({ branchId, accountType: "SAVINGS", isPrimary: false });
    }
    setBankDialogOpen(true);
  };

  const handleCloseBankDialog = () => {
    setBankDialogOpen(false);
    setEditingBank(null);
    setBankFormData({});
    setCurrentBranchForBank("");
  };

  const handleSaveBank = async () => {
    if (
      !bankFormData.bankName ||
      !bankFormData.accountNumber ||
      !bankFormData.ifscCode ||
      !bankFormData.accountHolderName
    ) {
      showSnackbar("Please fill all required fields", "error");
      return;
    }
    showSpinner();
    try {
      const payload = {
        bankName: bankFormData.bankName,
        accountHolderName: bankFormData.accountHolderName,
        accountNumber: bankFormData.accountNumber,
        ifscCode: bankFormData.ifscCode,
        branchName: bankFormData.branchName,
        accountType: bankFormData.accountType,
        isPrimary: bankFormData.isPrimary,
        branchId: currentBranchForBank,
        companyId: companyId,
      };
      if (editingBank) {
        const res: any = await bankService.updateBank(editingBank.id, payload);
        if (res.success) showSnackbar(res.message || "Bank updated", "success");
      } else {
        const res: any = await bankService.createBank(payload);
        if (res.success) showSnackbar(res.message || "Bank added", "success");
      }
      await loadBanksForBranch(currentBranchForBank);
      handleCloseBankDialog();
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  // const handleDeleteBank = (bank: BankDetail) => {
  //   showConfirmDialog({
  //     title: "Delete Bank",
  //     message: `Delete "${bank.bankName}" (${bank.accountNumber})?`,
  //     confirmText: "Delete",
  //     cancelText: "Cancel",
  //     onConfirm: async () => {
  //       showSpinner();
  //       try {
  //         await bankService.deleteBankById(bank.id);
  //         showSnackbar("Bank deleted", "success");
  //         await loadBanksForBranch(bank.branchId);
  //       } catch (error: any) {
  //         showSnackbar(error.message, "error");
  //       } finally {
  //         hideSpinner();
  //       }
  //     },
  //   });
  // };

  const handleSetPrimary = async (bank: BankDetail) => {
    showSpinner();
    try {
      await bankService.setPrimary(bank.id);
      showSnackbar(`"${bank.bankName}" set as primary`, "success");
      await loadBanksForBranch(bank.branchId);
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleToggleBankStatus = async (
    bank: BankDetail,
    status: BankStatus,
  ) => {
    showSpinner();
    try {
      if ((status == "ACTIVE" || status == "INACTIVE") && !bank.isPrimary) {
        await bankService.updateStatus(bank.id, status);
        showSnackbar("Bank status updated", "success");
        await loadBanksForBranch(bank.branchId);
      } else {
        showSnackbar("Set another account as primary before deactivating this account.", 'info')
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
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
              handleSortChange(
                newSortBy,
                newSortOrder === "asc" ? "ASC" : "DESC",
              );
            }}
          />
        </div>

        {/* Branches Table */}
        <TableContainer className="h-[calc(100vh-290px)] overflow-auto ">
          <Table
            stickyHeader
            className="border border-gray-200 bg-white-50 rounded-sm"
          >
            <TableHead className="bg-gray-100">
              <TableRow className="bg-gray-100 !text-primary">
                <TableCell
                  className="!font-semibold text-gray-800"
                  sx={{
                    ...stickyHeaderLeftSx,
                    minWidth: "70px",
                  }}
                >
                  S No
                </TableCell>
                <TableCell
                  className="nth-c !font-semibold text-gray-800 cursor-pointer hover:bg-gray-200"
                  onClick={() =>
                    handleSortChange(
                      "branchName",
                      sortOrder === "ASC" ? "DESC" : "ASC",
                    )
                  }
                >
                  <div className="flex items-center gap-1">
                    Branch Name {getSortIcon("branchName")}
                  </div>
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
                    Branch Code {getSortIcon("branchCode")}
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
                    Address {getSortIcon("branchAddress")}
                  </div>
                </TableCell>
                <TableCell className="!font-semibold text-gray-800">
                  <div className="flex items-center gap-1">Branch Head</div>
                </TableCell>
                <TableCell className="!font-semibold text-gray-800">
                  <div className="flex items-center gap-1">Contact Email</div>
                </TableCell>
                <TableCell className="!font-semibold text-gray-800">
                  <div className="flex items-center gap-1">Contact Number</div>
                </TableCell>
                <TableCell className="!font-semibold text-gray-800">
                  <div className="flex items-center gap-1">PF Code</div>
                </TableCell>
                <TableCell className="!font-semibold text-gray-800">
                  <div className="flex items-center gap-1">PF Location</div>
                </TableCell>
                <TableCell className="!font-semibold text-gray-800">
                  <div className="flex items-center gap-1">ESI Code</div>
                </TableCell>
                <TableCell className="!font-semibold text-gray-800">
                  <div className="flex items-center gap-1">ESI Location</div>
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
                    Radius (km) {getSortIcon("radius")}
                  </div>
                </TableCell>
                <TableCell className="nth-d !font-semibold text-gray-800">
                  Status
                </TableCell>
                <TableCell
                  align="center"
                  className="!font-semibold text-gray-800"
                  sx={{
                    ...stickyHeaderRightSx,
                    minWidth: "70px",
                    zIndex: 5,
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map((branch, index) => (
                <React.Fragment key={branch.id}>
                  {/* Branch Row */}
                  <TableRow hover sx={getRowColor(index)} onClick={() => toggleExpand(branch.id)}>
                    <TableCell
                      className="font-medium text-gray-800"
                      sx={{ ...getStickyLeftSx(index), minWidth: "70px" }}
                    >
                      {page * limit + index + 1}
                    </TableCell>
                    <TableCell
                      sx={{
                        ...getStickyLeftSx(index),
                        left: "70px",
                        minWidth: "100px",
                      }}
                    >
                      {branch.branchName}
                      {/* {
                        branch.branchCode == 'DEFAULT' &&
                        <span className="text-red-500 font-bold">(Head Office)</span>
                      } */}
                    </TableCell>
                    <TableCell className="font-medium text-gray-800">
                      <span className={` ${branch.branchCode == 'HEAD OFFICE' ? 'text-primary font-bold' : ''}`}>{branch.branchCode}</span>
                    </TableCell>
                    <TableCell
                      className="max-w-xs truncate text-gray-800"
                      title={branch.branchAddress}
                    >
                      {branch.branchAddress}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {branch.branchHeadName}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {branch.contactEmail}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {branch.contactNumber}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {branch.pfCode}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {branch.pfLocation}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {branch.esiCode}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {branch.esiLocation}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {branch.radius} km
                    </TableCell>
                    <TableCell
                      sx={{
                        ...getStickyRightSx(index),
                        right: "75px",
                        minWidth: "70px",
                      }}
                    >
                      <Chip
                        label={branch.active ? "Active" : "Inactive"}
                        color={branch.active ? "success" : "error"}
                        size="small"
                        onClick={() => handleToggleStatus(branch)}
                        className="cursor-pointer"
                      />
                    </TableCell>
                    <TableCell
                      className="!flex"
                      sx={{ ...getStickyRightSx(index), minWidth: "50px" }}
                    >
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          className=""
                          onClick={() => handleOpenDialog(branch)}
                        >
                          <EditIcon
                            className="!w-4"
                            sx={{ color: "#0087ff" }}
                          />
                        </IconButton>
                      </Tooltip>
                      {
                        branch.branchCode != 'HEAD OFFICE' &&
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              handleDelete(branch.id, branch.branchName)
                            }
                          >
                            <DeleteIcon
                              className="!w-4"
                              sx={{ color: "#ef4444" }}
                            />
                          </IconButton>
                        </Tooltip>
                      }
                      <Tooltip title="Add Bank Details">
                        <IconButton
                          size="small"
                          className="!text-[12px]"
                        >
                          {expandedBranchId === branch.id ? (
                            <ExpandLessIcon className="!w-4 text-gray-800" />
                          ) : (
                            <ExpandMoreIcon className="!w-4 text-gray-800" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>

                  {/* Bank Details Expand Row */}
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                      <Collapse
                        in={expandedBranchId === branch.id}
                        timeout="auto"
                        unmountOnExit
                        className="!w-max"
                      >
                        <Box sx={{ m: 2 }}>
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2 text-[13px] font-semibold text-blue-700">
                              {/* <AccountBalanceIcon className="!w-4 text-primary" /> */}
                              Bank Accounts - <span>{branch.branchName}</span>
                            </div>
                            <Button
                              size="small"
                              variant="outlined"
                              className="!text-primary !border-primary"
                              startIcon={<AddIcon />}
                              onClick={() => handleOpenBankDialog(branch.id)}
                            >
                              Add Bank
                            </Button>
                          </div>

                          {(banksByBranch[branch.id] || []).length === 0 ? (
                            <div className="text-center text-gray-400 text-[12px] py-6 border border-dashed border-gray-300 rounded-lg">
                              <AccountBalanceIcon className="!w-8 !h-8 text-gray-300 mb-1" />
                              <div>No bank accounts added for this branch.</div>
                            </div>
                          ) : (
                            <div className="flex flex-col rounded-lg border border-gray-200 overflow-hidden bg-white">
                              {(banksByBranch[branch.id] || []).map((bank) => (
                                <div
                                  key={bank.id}
                                  className={`flex items-center gap-6 px-4 py-3 ${bank.isPrimary ? "bg-blue-50/40" : ""}`}
                                >
                                  {/* Icon + Bank Name */}
                                  <div className="flex items-center gap-2 w-max shrink-0">
                                    <div
                                      className={`p-1.5 rounded-lg ${bank.isPrimary ? "bg-blue-100" : "bg-gray-100"}`}
                                    >
                                      <AccountBalanceIcon
                                        className={`!w-4 !h-4 ${bank.isPrimary ? "text-blue-600" : "text-gray-500"}`}
                                      />
                                    </div>
                                    <div>
                                      <div className="text-[12px] font-semibold text-gray-800">
                                        {bank.bankName}
                                      </div>
                                      {bank.isPrimary && (
                                        <span className="text-[9px] bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-full">
                                          PRIMARY
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Divider */}
                                  <div className="h-8 w-px bg-gray-200 shrink-0" />

                                  {/* Details Grid */}
                                  <div className="flex gap-6 flex-wrap">
                                    <div>
                                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                                        Account Holder
                                      </div>
                                      <div className="text-[12px] text-gray-700 font-medium">
                                        {bank.accountHolderName}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                                        Account No.
                                      </div>
                                      <div className="text-[12px] font-mono font-semibold text-gray-800">
                                        {bank.accountNumber}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                                        IFSC
                                      </div>
                                      <div className="text-[12px] font-mono text-gray-700">
                                        {bank.ifscCode}
                                      </div>
                                    </div>
                                    {bank.branchName && (
                                      <div>
                                        <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                                          Bank Branch
                                        </div>
                                        <div className="text-[12px] text-gray-700">
                                          {bank.branchName}
                                        </div>
                                      </div>
                                    )}
                                    <div>
                                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                                        Account Type
                                      </div>
                                      <div className="text-[12px] text-gray-700">
                                        {bank.accountType}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Divider */}
                                  <div className="h-8 w-px bg-gray-200 shrink-0" />

                                  {/* Status + Actions */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Chip
                                      label={bank.status || "ACTIVE"}
                                      size="small"
                                      color={
                                        bank.status === "INACTIVE"
                                          ? "error"
                                          : "success"
                                      }
                                      onClick={() =>
                                        handleToggleBankStatus(
                                          bank,
                                          bank.status === "INACTIVE"
                                            ? "ACTIVE"
                                            : "INACTIVE",
                                        )
                                      }
                                      className="cursor-pointer !text-[10px] !h-6 !w-16"
                                    />
                                    <Tooltip
                                      title={
                                        bank.isPrimary
                                          ? "Primary Account"
                                          : bank.status === "ACTIVE"
                                            ? "Set as Primary"
                                            : "Inactive bank"
                                      }
                                    >
                                      <span>
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            !bank.isPrimary &&
                                            handleSetPrimary(bank)
                                          }
                                          disabled={
                                            bank.isPrimary ||
                                            bank.status == "INACTIVE"
                                          }
                                        >
                                          {bank.isPrimary ? (
                                            <StarIcon className="!w-4 !text-yellow-500" />
                                          ) : (
                                            <StarBorderIcon className="!w-4 text-gray-400" />
                                          )}
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                    <Tooltip title="Edit">
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleOpenBankDialog(branch.id, bank)
                                        }
                                      >
                                        <EditIcon
                                          className="!w-4"
                                          sx={{ color: "#0087ff" }}
                                        />
                                      </IconButton>
                                    </Tooltip>
                                    {/* <Tooltip title="Delete">
                                      <IconButton size="small" onClick={() => handleDeleteBank(bank)}>
                                        <DeleteIcon className="!w-4 !text-red-500" />
                                      </IconButton>
                                    </Tooltip> */}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          {branches.length === 0 && (
            <div className="bg-white border border-gray-200 border-t-0 text-gray-900 text-center py-8 text-gray-500">
              No branches found
            </div>
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
            pageSizeOptions={[10, 20, 50, 100]}
            showTotal={true}
          />
        )}
      </div>

      {/* Add/Edit Branch Dialog with Integrated Map */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        sx={commonsx}
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-gray-800 ml-4">
            {editingBranch ? "Edit Branch" : "Add New Branch"}
          </div>
          <IconButton onClick={handleCloseDialog}>
            <CloseOutlined className="!text-gray-800" />
          </IconButton>
        </div>
        <DialogContent className="max-h-[80vh] overflow-y-auto" onKeyDown={handleEnterAsTab}>
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

              {showMap && (
                <LocationMap
                  mapUrl={mapUrl}
                  googleMapLink={googleMapLink}
                  style={{
                    height: "250px",
                    width: "100%",
                  }}
                />
              )}
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
            <div className="grid grid-cols-3 gap-4">
              <EmployeeAsyncCombobox
                value={formData.branchHeadId || null}
                selectedEmployee={selectedBranchHead}
                label="Assign Branch Head"
                placeholder="Search employee by name or ID..."
                onChange={(employeeId, employee) => {
                  setSelectedBranchHead(employee || null);
                  setFormData((prev) => ({
                    ...prev,
                    branchHeadId: employeeId || "",
                    branchHeadName: employee?.name || "",
                  }));
                }}
              />
              <TextField
                fullWidth
                label="Contact Email"
                name="contactEmail"
                type="text"
                value={selectedBranchHead?.emailAddress || ""}
                disabled={true}
              />
              <TextField
                fullWidth
                label="Contact Number"
                name="radius"
                type="contactNumber"
                value={selectedBranchHead?.mobileNumber || ""}
                disabled={true}
              />
            </div>

            {/* PF Code & Location */}
            <div className="flex gap-3">
              <div className="w-full">
                <TextField
                  fullWidth
                  label="PF Code"
                  name="pfCode"
                  value={formData.pfCode || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="w-full">
                <TextField
                  fullWidth
                  label="ESI Code"
                  name="esiCode"
                  value={formData.esiCode || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* ESI Code & Location */}
            <div className="flex gap-3">
              <div className="w-full">
                <TextField
                  fullWidth
                  label="PF Location"
                  name="pfLocation"
                  multiline
                  rows={3}
                  value={formData.pfLocation || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="w-full">
                <TextField
                  fullWidth
                  label="ESI Location"
                  name="esiLocation"
                  multiline
                  rows={3}
                  value={formData.esiLocation || ""}
                  onChange={handleInputChange}
                />
              </div>
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

      {/* Add / Edit Bank Dialog */}
      <Dialog
        open={bankDialogOpen}
        onClose={handleCloseBankDialog}
        maxWidth="sm"
        fullWidth
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="flex items-center gap-2 text-gray-800 ml-4 text-[12px]">
            {/* <AccountBalanceIcon className="!w-4" /> */}
            {editingBank ? "Edit Bank Account" : "Add Bank Account"}
          </div>
          <IconButton onClick={handleCloseBankDialog}>
            <CloseOutlined className="!text-gray-800" />
          </IconButton>
        </div>
        <DialogContent>
          <div className="grid grid-cols-2 gap-5 mt-2">
            <Autocomplete
              fullWidth
              options={banks}
              getOptionLabel={(option) => option.name}
              value={banks.find(b => b.name === bankFormData.bankName) || null}
              onChange={(_event, newValue) => {
                setBankFormData((p) => ({
                  ...p,
                  bankName: newValue?.name || "",
                  ifscCode: newValue?.ifscPrefix || "",
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Bank Name"
                  required
                />
              )}
              sx={{
                '& .MuiOutlinedInput-root': {
                  padding: 0,
                },
              }}
            />
            <TextField
              fullWidth
              label="Account Holder Name"
              value={bankFormData.accountHolderName || ""}
              onChange={(e) =>
                setBankFormData((p) => ({
                  ...p,
                  accountHolderName: e.target.value,
                }))
              }
              required
            />
            <TextField
              fullWidth
              label="Account Number"
              value={bankFormData.accountNumber || ""}
              onChange={(e) =>
                setBankFormData((p) => ({
                  ...p,
                  accountNumber: e.target.value,
                }))
              }
              required
            />
            <TextField
              fullWidth
              label="IFSC Code"
              value={bankFormData.ifscCode || ""}
              onChange={(e) =>
                setBankFormData((p) => ({
                  ...p,
                  ifscCode: e.target.value.toUpperCase(),
                }))
              }
              required
            />
            <TextField
              fullWidth
              label="Bank Branch Name"
              value={bankFormData.branchName || ""}
              onChange={(e) =>
                setBankFormData((p) => ({ ...p, branchName: e.target.value }))
              }
            />
            <Autocomplete
              fullWidth
              options={['Savings', 'Current']}
              getOptionLabel={(option) => option}
              value={bankFormData.accountType || 'Savings'}
              onChange={(_event, newValue) => {
                setBankFormData((p) => ({
                  ...p,
                  accountType: newValue || 'Savings',
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Account Type"
                  required
                />
              )}
              sx={{
                '& .MuiOutlinedInput-root': {
                  padding: 0,
                },
              }}
            />
            <div className="col-span-2">
              <FormControlLabel
                control={
                  <Switch
                    checked={bankFormData.isPrimary || false}
                    onChange={(e) =>
                      setBankFormData((p) => ({
                        ...p,
                        isPrimary: e.target.checked,
                      }))
                    }
                    color="primary"
                    disabled={bankFormData.status == "INACTIVE"}
                  />
                }
                label="Set as Primary Account"
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions className="!p-4 border-t border-gray-300">
          <Button
            onClick={handleCloseBankDialog}
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveBank}
            variant="contained"
            className="!bg-primary"
          >
            {editingBank ? "Update" : "Save"} Bank
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
