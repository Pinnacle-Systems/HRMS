import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import LoanAdvanceRequestPage from '../../src/pages/payroll/AdvancedFeature/LoanAdvanceRequestPage';

const showSnackbar = vi.fn();
const showSpinner = vi.fn();
const hideSpinner = vi.fn();
const getLoanTypes = vi.fn();
const createLoanAdvanceRequest = vi.fn();

vi.mock('../../auth/authContext', () => ({
  useAuth: () => ({
    session: { user: { userId: 'emp-001' } },
  }),
}));

vi.mock('../../context/Snackbar', () => ({
  useUI: () => ({
    showSnackbar,
    showSpinner,
    hideSpinner,
  }),
}));

vi.mock('../../services/modules/loanAdvance', () => ({
  loanAdvanceService: {
    getLoanTypes,
    createLoanAdvanceRequest,
  },
}));

describe('LoanAdvanceRequestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLoanTypes.mockResolvedValue({
      success: true,
      data: [{ id: 'lt-1', name: 'Salary Advance', code: 'SALARY_ADVANCE' }],
    });
    createLoanAdvanceRequest.mockResolvedValue({
      success: true,
      data: { id: 'req-001' },
    });
  });

  it('submits a loan request using the configured backend service', async () => {
    render(<LoanAdvanceRequestPage />);

    expect(await screen.findByText('Salary Advance')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText(/request type/i), 'LOAN');
    await user.selectOptions(screen.getByLabelText(/loan type/i), 'lt-1');
    await user.type(screen.getByLabelText(/requested amount/i), '25000');
    await user.type(screen.getByLabelText(/reason/i), 'Medical emergency');
    await user.type(screen.getByLabelText(/requested on/i), '2026-07-14');
    await user.type(screen.getByLabelText(/repayment months/i), '6');
    await user.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() => {
      expect(createLoanAdvanceRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          requestType: 'LOAN',
          loanTypeId: 'lt-1',
          requestedAmount: 25000,
          reason: 'Medical emergency',
          repaymentMonths: 6,
        }),
      );
    });
  });
});
