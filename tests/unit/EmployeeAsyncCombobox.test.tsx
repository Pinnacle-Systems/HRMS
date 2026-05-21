import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EmployeeAsyncCombobox from "../../src/components/employees/EmployeeAsyncCombobox";
import { employeeService } from "../../src/services/modules/employees";

vi.mock("../../src/services/modules/employees", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/services/modules/employees")>();

  return {
    ...actual,
    employeeService: {
      getEmployees: vi.fn(),
    },
  };
});

const employeePage = ({
  content,
  page = 0,
  last = true,
  totalPages = 1,
}: {
  content: Array<Record<string, string>>;
  page?: number;
  last?: boolean;
  totalPages?: number;
}) => ({
  data: {
    content,
    totalElements: content.length,
    totalPages,
    size: 20,
    number: page,
    numberOfElements: content.length,
    first: page === 0,
    last,
    empty: content.length === 0,
  },
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
};

describe("EmployeeAsyncCombobox", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.mocked(employeeService.getEmployees).mockResolvedValue(
      employeePage({
        content: [
          {
            id: "employee-1",
            employeeId: "E-001",
            name: "Ava Patel",
            designation: "Engineer",
          },
        ],
      }) as any,
    );
  });

  it("fetches the first page with the paginated employee query", async () => {
    render(<EmployeeAsyncCombobox value={null} onChange={vi.fn()} />);

    fireEvent.mouseDown(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(employeeService.getEmployees).toHaveBeenCalledWith({
        page: 0,
        size: 20,
        sort: "name,ASC",
        search: "",
        includeInactive: false,
      });
    });
    expect(await screen.findByText("Ava Patel")).toBeInTheDocument();
    expect(screen.getByText("(E-001)")).toBeInTheDocument();
  });

  it("sends search after the debounce interval", async () => {
    render(<EmployeeAsyncCombobox value={null} onChange={vi.fn()} />);

    const input = screen.getByRole("combobox");
    fireEvent.mouseDown(input);
    fireEvent.change(input, { target: { value: "mira" } });

    expect(employeeService.getEmployees).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(employeeService.getEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ search: "mira" }),
      );
    });
  });

  it("calls onChange with employee id and object", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<EmployeeAsyncCombobox value={null} onChange={onChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Ava Patel"));

    expect(onChange).toHaveBeenCalledWith(
      "employee-1",
      expect.objectContaining({ id: "employee-1", name: "Ava Patel" }),
    );
  });

  it("loads the next page and appends unique employees", async () => {
    vi.mocked(employeeService.getEmployees)
      .mockResolvedValueOnce(
        employeePage({
          content: [
            { id: "employee-1", employeeId: "E-001", name: "Ava Patel" },
          ],
          last: false,
          totalPages: 2,
        }) as any,
      )
      .mockResolvedValueOnce(
        employeePage({
          content: [
            { id: "employee-1", employeeId: "E-001", name: "Ava Patel" },
            { id: "employee-2", employeeId: "E-002", name: "Mira Shah" },
          ],
          page: 1,
          last: true,
          totalPages: 2,
        }) as any,
      );
    const user = userEvent.setup();
    render(<EmployeeAsyncCombobox value={null} onChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Load more"));

    await waitFor(() => {
      expect(employeeService.getEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 }),
      );
    });
    expect(await screen.findByText("Mira Shah")).toBeInTheDocument();
    expect(screen.getAllByText("Ava Patel")).toHaveLength(1);
  });

  it("keeps the list scroll position after loading more employees", async () => {
    const secondPage = deferred<any>();
    const thirdPage = deferred<any>();
    vi.mocked(employeeService.getEmployees)
      .mockResolvedValueOnce(
        employeePage({
          content: [
            { id: "employee-1", employeeId: "E-001", name: "Ava Patel" },
          ],
          last: false,
          totalPages: 3,
        }) as any,
      )
      .mockReturnValueOnce(secondPage.promise)
      .mockReturnValueOnce(thirdPage.promise);
    const user = userEvent.setup();
    render(<EmployeeAsyncCombobox value={null} onChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));
    const listbox = await screen.findByRole("listbox");
    listbox.scrollTop = 140;
    await user.click(await screen.findByText("Load more"));
    listbox.scrollTop = 0;

    secondPage.resolve(
      employeePage({
        content: [
          { id: "employee-2", employeeId: "E-002", name: "Mira Shah" },
        ],
        page: 1,
        last: false,
        totalPages: 3,
      }) as any,
    );

    expect(await screen.findByText("Mira Shah")).toBeInTheDocument();
    await waitFor(() => {
      expect(listbox.scrollTop).toBe(140);
    });

    listbox.scrollTop = 260;
    await user.click(await screen.findByText("Load more"));
    listbox.scrollTop = 0;

    thirdPage.resolve(
      employeePage({
        content: [
          { id: "employee-3", employeeId: "E-003", name: "Noor Ali" },
        ],
        page: 2,
        last: true,
        totalPages: 3,
      }) as any,
    );

    expect(await screen.findByText("Noor Ali")).toBeInTheDocument();
    await waitFor(() => {
      expect(listbox.scrollTop).toBe(260);
    });
  });

  it("shows the selected employee label when selected object is provided", () => {
    render(
      <EmployeeAsyncCombobox
        value="employee-9"
        selectedEmployee={{ id: "employee-9", employeeId: "E-009", name: "Noor Ali" }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Noor Ali (E-009)")).toBeInTheDocument();
  });

  it("does not display the database id as an employee code for value-only fallbacks", () => {
    render(
      <EmployeeAsyncCombobox
        value="817ef0cd-a7ea-4007-9a73-1ad2ef82ce17"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Selected employee")).toBeInTheDocument();
    expect(
      screen.queryByDisplayValue(/817ef0cd-a7ea-4007-9a73-1ad2ef82ce17/),
    ).not.toBeInTheDocument();
  });

  it("handles empty results", async () => {
    vi.mocked(employeeService.getEmployees).mockResolvedValue(
      employeePage({ content: [] }) as any,
    );
    const user = userEvent.setup();
    render(<EmployeeAsyncCombobox value={null} onChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("No employees found")).toBeInTheDocument();
  });

  it("handles fetch errors", async () => {
    vi.mocked(employeeService.getEmployees).mockRejectedValue(
      new Error("Network unavailable"),
    );
    const user = userEvent.setup();
    render(<EmployeeAsyncCombobox value={null} onChange={vi.fn()} />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByText("Failed to load employees")).toBeInTheDocument();
    expect(screen.getByText("Network unavailable")).toBeInTheDocument();
  });
});
