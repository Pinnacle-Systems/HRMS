import * as Mui from "@mui/material";

// ICONS
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import Person2Outlined from "@mui/icons-material/Person2Outlined";
import Person2TwoTone from "@mui/icons-material/Person2TwoTone";
import LocationOn from "@mui/icons-material/LocationOn";
import School from "@mui/icons-material/School";
import WorkHistory from "@mui/icons-material/WorkHistory";
import FamilyRestroom from "@mui/icons-material/FamilyRestroom";
import AttachFile from "@mui/icons-material/AttachFile";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import {
  CameraAlt,
  CloseOutlined,
  ContactEmergencyOutlined,
  Diversity3Outlined,
  FlightLandOutlined,
  LocalLibraryOutlined,
  LocationOnOutlined,
  LoginOutlined,
  PeopleOutlineOutlined,
  SchoolOutlined,
  VerifiedUserOutlined,
  WorkHistoryOutlined,
  VisibilityOutlined,
  FileUpload,
  Download,
  CloudUpload,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";

const MaterialModule = {
  ...Mui,

  // ICONS
  EditIcon,
  SaveIcon,
  DeleteIcon,
  AddIcon,
  CancelIcon,
  AccountBalanceIcon,
  ArrowBackIcon,
  ArrowUpward,
  ArrowDownward,

  Person2Outlined,
  Person2TwoTone,
  CloudUploadIcon: CloudUpload,
  LocationIcon: LocationOn,
  SchoolIcon: School,
  WorkHistoryIcon: WorkHistory,
  FamilyIcon: FamilyRestroom,
  AttachmentIcon: AttachFile,
  FileUploadIcon: FileUpload,
  DownloadIcon: Download,

  CloseOutlined,
  ContactEmergencyOutlined,
  Diversity3Outlined,
  FlightLandOutlined,
  LocalLibraryOutlined,
  LocationOnOutlined,
  LoginOutlined,
  PeopleOutlineOutlined,
  SchoolOutlined,
  VerifiedUserOutlined,
  WorkHistoryOutlined,
  CameraAlt,
  VisibilityOutlined,
};

export default MaterialModule;
