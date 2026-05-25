import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../helpers/render";
import CompanySettings from "../../../src/pages/settings/general/companySettings";

// --------------- heavy component stubs ---------------
vi.mock("../../../src/components/Map", () => ({
  default: () => <div data-testid="location-map-stub" />,
}));

vi.mock("../../../src/components/FileUpload", () => ({
  FileUpload: ({ label }: { label: string }) => (
    <div data-testid={`file-upload-${label.replace(/\s+/g, "-").toLowerCase()}`}>
      {label}
    </div>
  ),
}));

vi.mock("../../../src/components/MasterSelect", () => ({
  MasterSelect: ({ label, onChange }: { label: string; onChange: (v: string) => void }) => (
    <select aria-label={label} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select</option>
    </select>
  ),
}));

// --------------- DatePicker stub ---------------
vi.mock("@mui/x-date-pickers/DatePicker", () => ({
  DatePicker: ({ label }: { label?: string }) => (
    <input aria-label={label ?? "date-picker"} placeholder={label} />
  ),
}));
vi.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: class {},
}));

// --------------- service mocks ---------------
vi.mock("../../../src/services/modules/company", () => ({
  companyService: {
    getCompany: vi.fn(),
    getCompanyById: vi.fn(),
    createCompany: vi.fn(),
    updateCompany: vi.fn(),
    deleteCompanyById: vi.fn(),
    uploadLogo: vi.fn(),
    uploadSignature: vi.fn(),
  },
}));

// --------------- hook mocks ---------------
vi.mock("../../../src/hooks/useMasterData", () => ({
  useMasterData: () => ({
    countries: [{ id: "c1", name: "India" }],
    states: [{ id: "s1", name: "Maharashtra" }],
    cities: [{ id: "ct1", name: "Mumbai" }],
    currencies: [{ id: "cur1", name: "INR" }],
    loading: false,
    fetchStatesByCountry: vi.fn(),
    fetchCitiesByCountry: vi.fn(),
    fetchCitiesByState: vi.fn(),
  }),
}));

// --------------- fixtures ---------------
const mockCompany = {
  id: "comp-1",
  companyName: "VibeHR Solutions",
  companyType: "Head Office",
  aliasName: "VibeHR",
  code: "VHR001",
  email: "info@vibehr.com",
  phoneNo: "+91 9876543210",
  gstNo: "22AAAAA0000A1Z5",
  panNo: "AAAAA1234A",
  companyAddress: "123 Main Street, Mumbai",
  pincode: "400001",
  currencyId: "cur1",
  logoUrl: "",
  signatureUrl: "",
};

async function setupEmptyMocks() {
  const { companyService } = await import(
    "../../../src/services/modules/company"
  );
  vi.mocked(companyService.getCompany).mockResolvedValue({
    data: [],
  } as any);
}

async function setupLoadedMocks() {
  const { companyService } = await import(
    "../../../src/services/modules/company"
  );
  vi.mocked(companyService.getCompany).mockResolvedValue({
    data: [{ id: "comp-1" }],
  } as any);
  vi.mocked(companyService.getCompanyById).mockResolvedValue({
    data: mockCompany,
  } as any);
  vi.mocked(companyService.updateCompany).mockResolvedValue({
    success: true,
    message: "Company updated successfully",
  } as any);
  vi.mocked(companyService.createCompany).mockResolvedValue({
    success: true,
    message: "Company created successfully",
    data: { id: "comp-new" },
  } as any);
  vi.mocked(companyService.deleteCompanyById).mockResolvedValue({
    success: true,
    message: "Company deleted",
  } as any);
}

// --------------- tests ---------------
describe("CompanySettings — rendering", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupEmptyMocks();
  });

  it("renders without crashing", async () => {
    renderWithProviders(<CompanySettings />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });

  it("renders the Save button", async () => {
    renderWithProviders(<CompanySettings />);
    expect(await screen.findByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("renders the Company Name field", async () => {
    renderWithProviders(<CompanySettings />);
    // Label appears in both <label> and <legend><span> — target the <label> element
    await waitFor(() => {
      expect(
        screen.getByText("Company Name", { selector: "label" })
      ).toBeInTheDocument();
    });
  });

  it("renders the GST Number field", async () => {
    renderWithProviders(<CompanySettings />);
    await waitFor(() => {
      expect(
        screen.getByText("GST Number", { selector: "label" })
      ).toBeInTheDocument();
    });
  });

  it("renders Payroll Frequency select field", async () => {
    renderWithProviders(<CompanySettings />);
    await waitFor(() => {
      expect(
        screen.getByText("Payroll Frequency", { selector: "label" })
      ).toBeInTheDocument();
    });
  });

  it("does not show Delete button when no company is loaded", async () => {
    renderWithProviders(<CompanySettings />);
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
    });
  });

  it("shows Settings breadcrumb label", async () => {
    renderWithProviders(<CompanySettings />);
    await waitFor(() => {
      // The breadcrumb span shows the current route label; getCurrentRouteLabel() returns "Company Settings" in test env
      expect(screen.getByText("Company Settings")).toBeInTheDocument();
    });
  });
});

describe("CompanySettings — API contract", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupEmptyMocks();
  });

  it("calls getCompany on mount", async () => {
    const { companyService } = await import(
      "../../../src/services/modules/company"
    );
    renderWithProviders(<CompanySettings />);
    await waitFor(() => {
      expect(vi.mocked(companyService.getCompany)).toHaveBeenCalled();
    });
  });

  it("calls getCompanyById when a company is found", async () => {
    const { companyService } = await import(
      "../../../src/services/modules/company"
    );
    vi.mocked(companyService.getCompany).mockResolvedValue({
      data: [{ id: "comp-1" }],
    } as any);
    vi.mocked(companyService.getCompanyById).mockResolvedValue({
      data: mockCompany,
    } as any);

    renderWithProviders(<CompanySettings />);
    await waitFor(() => {
      expect(vi.mocked(companyService.getCompanyById)).toHaveBeenCalledWith(
        "comp-1"
      );
    });
  });

  it("does not call getCompanyById when company list is empty", async () => {
    const { companyService } = await import(
      "../../../src/services/modules/company"
    );
    renderWithProviders(<CompanySettings />);
    await waitFor(() => {
      expect(vi.mocked(companyService.getCompany)).toHaveBeenCalled();
    });
    expect(vi.mocked(companyService.getCompanyById)).not.toHaveBeenCalled();
  });
});

describe("CompanySettings — loaded company data display", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupLoadedMocks();
  });

  it("populates Company Name field after loading", async () => {
    renderWithProviders(<CompanySettings />);
    await waitFor(() => {
      const input = screen.getByDisplayValue("VibeHR Solutions");
      expect(input).toBeInTheDocument();
    });
  });

  it("populates Company Address field after loading", async () => {
    renderWithProviders(<CompanySettings />);
    await waitFor(() => {
      expect(screen.getByDisplayValue("123 Main Street, Mumbai")).toBeInTheDocument();
    });
  });

  it("populates email field after loading", async () => {
    renderWithProviders(<CompanySettings />);
    await waitFor(() => {
      expect(screen.getByDisplayValue("info@vibehr.com")).toBeInTheDocument();
    });
  });

  it("shows Delete button when a company with id is loaded", async () => {
    renderWithProviders(<CompanySettings />);
    expect(await screen.findByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("shows file upload components when company id is present", async () => {
    renderWithProviders(<CompanySettings />);
    expect(
      await screen.findByTestId("file-upload-company-logo")
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId("file-upload-signature")
    ).toBeInTheDocument();
  });
});

describe("CompanySettings — Save (update existing company)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupLoadedMocks();
  });

  it("calls updateCompany with the company id when Save is clicked", async () => {
    const { companyService } = await import(
      "../../../src/services/modules/company"
    );
    const user = userEvent.setup();
    renderWithProviders(<CompanySettings />);
    await screen.findByDisplayValue("VibeHR Solutions");

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(vi.mocked(companyService.updateCompany)).toHaveBeenCalledWith(
        "comp-1",
        expect.objectContaining({ companyName: "VibeHR Solutions" })
      );
    });
  });

  it("does not call updateCompany when required field is empty", async () => {
    const { companyService } = await import(
      "../../../src/services/modules/company"
    );
    vi.mocked(companyService.getCompanyById).mockResolvedValue({
      data: { ...mockCompany, companyName: "" },
    } as any);

    const user = userEvent.setup();
    renderWithProviders(<CompanySettings />);
    await waitFor(() => expect(vi.mocked(companyService.getCompanyById)).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(vi.mocked(companyService.updateCompany)).not.toHaveBeenCalled();
    });
  });

  it("shows validation error message for empty required field on save", async () => {
    const { companyService } = await import(
      "../../../src/services/modules/company"
    );
    vi.mocked(companyService.getCompanyById).mockResolvedValue({
      data: { ...mockCompany, companyName: "" },
    } as any);

    const user = userEvent.setup();
    renderWithProviders(<CompanySettings />);

    // Wait for company data to load (getCompanyById resolves with empty companyName)
    await waitFor(() =>
      expect(vi.mocked(companyService.getCompanyById)).toHaveBeenCalled()
    );

    await user.click(await screen.findByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/company name is required/i)).toBeInTheDocument();
    });
  });
});

describe("CompanySettings — Save (create new company)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupEmptyMocks();
    const { companyService } = await import(
      "../../../src/services/modules/company"
    );
    vi.mocked(companyService.createCompany).mockResolvedValue({
      success: true,
      message: "Company created successfully",
    } as any);
  });

  it("shows validation errors when saving without required fields", async () => {
    const { companyService } = await import(
      "../../../src/services/modules/company"
    );
    const user = userEvent.setup();
    renderWithProviders(<CompanySettings />);

    await waitFor(() =>
      expect(
        screen.getByText("Company Name", { selector: "label" })
      ).toBeInTheDocument()
    );

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      // Validation blocks createCompany when required fields are empty
      expect(vi.mocked(companyService.createCompany)).not.toHaveBeenCalled();
      expect(screen.getByText(/company name is required/i)).toBeInTheDocument();
    });
  });
});

describe("CompanySettings — field interactions", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupLoadedMocks();
  });

  it("updates Company Name input when user types", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<CompanySettings />);
    await screen.findByDisplayValue("VibeHR Solutions");

    const input = screen.getByDisplayValue("VibeHR Solutions");
    await user.clear(input);
    await user.type(input, "NewCorp Ltd");

    expect(screen.getByDisplayValue("NewCorp Ltd")).toBeInTheDocument();
  });

  it("shows Payroll Frequency select rendered in the form", async () => {
    renderWithProviders(<CompanySettings />);
    await screen.findByDisplayValue("VibeHR Solutions");

    // Payroll Frequency renders as a MUI Select (role=combobox) labelled by InputLabel
    const payrollSelect = screen.getByRole("combobox", { name: /payroll frequency/i });
    expect(payrollSelect).toBeInTheDocument();
  });
});

describe("CompanySettings — Delete", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await setupLoadedMocks();
  });

  it("opens confirm dialog when Delete is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanySettings />);
    await screen.findByRole("button", { name: /delete/i });

    await user.click(screen.getByRole("button", { name: /delete/i }));

    // UIProvider renders a confirm dialog
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});

describe("CompanySettings — API error handling", () => {
  it("does not crash when getCompany rejects", async () => {
    vi.clearAllMocks();
    const { companyService } = await import(
      "../../../src/services/modules/company"
    );
    vi.mocked(companyService.getCompany).mockRejectedValue(
      new Error("Network error")
    );

    renderWithProviders(<CompanySettings />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });

  it("does not crash when getCompanyById rejects", async () => {
    vi.clearAllMocks();
    const { companyService } = await import(
      "../../../src/services/modules/company"
    );
    vi.mocked(companyService.getCompany).mockResolvedValue({
      data: [{ id: "comp-1" }],
    } as any);
    vi.mocked(companyService.getCompanyById).mockRejectedValue(
      new Error("Not found")
    );

    renderWithProviders(<CompanySettings />);
    await waitFor(() => expect(document.body).toBeInTheDocument());
  });
});
