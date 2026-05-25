import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../helpers/render";
import EmployeeDetails from "../../../src/pages/employees/employeeDetails";

// --------------- router mocks ---------------
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useParams: () => ({ id: "emp-1" }),
    useNavigate: () => vi.fn(),
  };
});

// --------------- service mocks ---------------
vi.mock("../../../src/services/modules/employees", () => ({
  employeeService: {
    getEmployeeById: vi.fn(),
    updatePersonalInfo: vi.fn(),
    uploadPhoto: vi.fn(),
    updateEmergencyContact: vi.fn(),
    addEmergencyContact: vi.fn(),
    deleteEmergencyContact: vi.fn(),
    updateAddress: vi.fn(),
    addAddress: vi.fn(),
    deleteAddress: vi.fn(),
    updateQualification: vi.fn(),
    addQualification: vi.fn(),
    deleteQualification: vi.fn(),
    updateAdminInfo: vi.fn(),
    updateEligibilityInfo: vi.fn(),
    updateBackgroundInfo: vi.fn(),
    updateTrainingDetail: vi.fn(),
    addTrainingDetail: vi.fn(),
    deleteTrainingDetail: vi.fn(),
    updatePreviousEmployment: vi.fn(),
    addPreviousEmployment: vi.fn(),
    deletePreviousEmployment: vi.fn(),
    updateBankDetails: vi.fn(),
    updatePfAccount: vi.fn(),
    addPfAccount: vi.fn(),
    deletePfAccount: vi.fn(),
    updateIdentityInfo: vi.fn(),
    updateFamilyMember: vi.fn(),
    addFamilyMember: vi.fn(),
    deleteFamilyMember: vi.fn(),
    updateNomination: vi.fn(),
    addNomination: vi.fn(),
    addAttachment: vi.fn(),
    deleteAttachment: vi.fn(),
    getFamilyMembers: vi.fn(),
  },
}));

vi.mock("../../../src/services/modules/category", () => ({
  categoryService: {
    getCategories: vi.fn(),
    getCategoryItems: vi.fn(),
  },
}));

vi.mock("../../../src/services/modules/department", () => ({
  departmentService: {
    getDepartments: vi.fn(),
  },
}));

vi.mock("../../../src/services/modules/branch", () => ({
  branchService: {
    getBranches: vi.fn(),
  },
}));

// useMasterData hits external APIs — replace with a no-op stub
vi.mock("../../../src/hooks/useMasterData", () => ({
  useMasterData: () => ({
    countries: [],
    states: [],
    cities: [],
    currencies: [],
    loading: false,
    fetchStatesByCountry: vi.fn(),
    fetchCitiesByCountry: vi.fn(),
    fetchCitiesByState: vi.fn(),
  }),
}));

// DynamicSelectWithAdd and MasterSelect need real DOM — stub them to simple selects
vi.mock("../../../src/components/SelectField", () => ({
  DynamicSelectWithAdd: ({ value, onChange, label }: any) => (
    <select aria-label={label} value={value ?? ""} onChange={(e) => onChange?.(e.target.value)}>
      <option value="">Select</option>
    </select>
  ),
}));

vi.mock("../../../src/components/MasterSelect", () => ({
  MasterSelect: ({ value, onChange, label }: any) => (
    <select aria-label={label} value={value ?? ""} onChange={(e) => onChange?.(e.target.value)}>
      <option value="">Select</option>
    </select>
  ),
}));

// --------------- fixture ---------------
const mockEmployee = {
  id: "emp-1",
  employeeId: "EMP001",
  name: "Alice Johnson",
  firstName: "Alice",
  lastName: "Johnson",
  dateOfBirth: "1990-05-15",
  emailAddress: "alice@example.com",
  mobileNumber: "9876543210",
  joiningDate: "2023-01-15",
  hostel: false,
  physicallyChallenged: false,
  internationalEmployee: false,
  pfEligible: true,
  excessEpfEligible: false,
  excessEpsEligible: false,
  existingEpsMember: false,
  esiEligible: true,
  lwfCovered: false,
  loginUserName: "alice.johnson",
  photoUrl: "",
  addresses: [],
  emergencyContacts: [],
  qualifications: [],
  previousEmployments: [],
  pfAccounts: [],
  nominations: [],
  familyMembers: [],
  trainingDetails: [],
  attachments: [],
  createdAt: "2023-01-15T10:00:00Z",
  updatedAt: "2024-06-01T10:00:00Z",
};

async function setupMocks() {
  const { employeeService } = await import(
    "../../../src/services/modules/employees"
  );
  const { categoryService } = await import(
    "../../../src/services/modules/category"
  );

  vi.mocked(employeeService.getEmployeeById).mockResolvedValue({
    data: mockEmployee,
  } as any);
  vi.mocked(employeeService.getFamilyMembers).mockResolvedValue({
    data: [],
  } as any);
  vi.mocked(categoryService.getCategories).mockResolvedValue({
    data: { content: [] },
  } as any);
  vi.mocked(categoryService.getCategoryItems).mockResolvedValue({
    data: { content: [] },
  } as any);
}

// --------------- tests ---------------
describe("EmployeeDetails — rendering", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("renders without crashing", async () => {
    renderWithProviders(<EmployeeDetails />);
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  it("displays the employee's full name after loading", async () => {
    renderWithProviders(<EmployeeDetails />);
    // Name appears in multiple places; verify at least one element has it
    const matches = await screen.findAllByText(/Alice Johnson/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("displays the employee ID chip", async () => {
    renderWithProviders(<EmployeeDetails />);
    // ID is rendered as "ID: EMP001" inside a chip
    expect(await screen.findByText(/ID:\s*EMP001/i)).toBeInTheDocument();
  });

  it("displays the employee email", async () => {
    renderWithProviders(<EmployeeDetails />);
    const matches = await screen.findAllByText(/alice@example\.com/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});

describe("EmployeeDetails — API contract", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("fetches employee data using the id from route params", async () => {
    const { employeeService } = await import(
      "../../../src/services/modules/employees"
    );
    renderWithProviders(<EmployeeDetails />);

    await waitFor(() => {
      expect(vi.mocked(employeeService.getEmployeeById)).toHaveBeenCalledWith(
        "emp-1"
      );
    });
  });

  it("fetches category options on mount", async () => {
    const { categoryService } = await import(
      "../../../src/services/modules/category"
    );
    renderWithProviders(<EmployeeDetails />);

    await waitFor(() => {
      expect(vi.mocked(categoryService.getCategories)).toHaveBeenCalled();
    });
  });
});

describe("EmployeeDetails — tab navigation", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("renders the tab list", async () => {
    renderWithProviders(<EmployeeDetails />);
    await screen.findByText(/ID:\s*EMP001/i);

    const tabList = screen.getByRole("tablist");
    expect(tabList).toBeInTheDocument();
  });

  it("has a Personal Info tab selected by default", async () => {
    renderWithProviders(<EmployeeDetails />);
    await screen.findByText(/ID:\s*EMP001/i);

    const personalTab = screen.getByRole("tab", { name: /personal/i });
    expect(personalTab).toHaveAttribute("aria-selected", "true");
  });

  it("switches to the Addresses tab on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmployeeDetails />);
    await screen.findByText(/ID:\s*EMP001/i);

    const addressTab = screen.getByRole("tab", { name: /address/i });
    await user.click(addressTab);

    expect(addressTab).toHaveAttribute("aria-selected", "true");
  });

  it("switches to the Qualifications tab on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmployeeDetails />);
    await screen.findByText(/ID:\s*EMP001/i);

    const qualTab = screen.getByRole("tab", { name: /qualif/i });
    await user.click(qualTab);

    expect(qualTab).toHaveAttribute("aria-selected", "true");
  });

  it("renders all ten tabs", async () => {
    renderWithProviders(<EmployeeDetails />);
    await screen.findByText(/ID:\s*EMP001/i);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(10);
  });
});

describe("EmployeeDetails — edit personal info", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupMocks();
  });

  it("shows edit icon buttons in the personal info section", async () => {
    renderWithProviders(<EmployeeDetails />);
    await screen.findByText(/ID:\s*EMP001/i);

    // MUI EditIcon renders with data-testid="EditIcon"
    const editIcons = screen.getAllByTestId("EditIcon");
    expect(editIcons.length).toBeGreaterThan(0);
  });

  it("calls updatePersonalInfo when saving edited personal data", async () => {
    const { employeeService } = await import(
      "../../../src/services/modules/employees"
    );
    vi.mocked(employeeService.updatePersonalInfo).mockResolvedValue({
      data: mockEmployee,
    } as any);

    const user = userEvent.setup();
    renderWithProviders(<EmployeeDetails />);
    await screen.findByText(/ID:\s*EMP001/i);

    // Click the first EditIcon button to enter edit mode
    const editIcons = screen.getAllByTestId("EditIcon");
    await user.click(editIcons[0].closest("button")!);

    // SaveIcon button appears in edit mode (data-testid="SaveIcon")
    const saveIcon = await screen.findByTestId("SaveIcon");
    await user.click(saveIcon.closest("button")!);

    await waitFor(() => {
      expect(
        vi.mocked(employeeService.updatePersonalInfo)
      ).toHaveBeenCalledWith("emp-1", expect.any(Object));
    });
  });
});

describe("EmployeeDetails — API error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not crash when getEmployeeById rejects", async () => {
    const { employeeService } = await import(
      "../../../src/services/modules/employees"
    );
    vi.mocked(employeeService.getEmployeeById).mockRejectedValue(
      new Error("Not found")
    );
    const { categoryService } = await import(
      "../../../src/services/modules/category"
    );
    vi.mocked(categoryService.getCategories).mockResolvedValue({
      data: { content: [] },
    } as any);
    vi.mocked(categoryService.getCategoryItems).mockResolvedValue({
      data: { content: [] },
    } as any);
    vi.mocked(employeeService.getFamilyMembers).mockResolvedValue({
      data: [],
    } as any);

    renderWithProviders(<EmployeeDetails />);

    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });
});
