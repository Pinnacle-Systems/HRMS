import { useUI } from '../context/Snackbar';

export const useApi = () => {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  const handleApiCall = async <T,>(
    apiCall: () => Promise<T>,
    successMessage?: string,
    errorMessage?: string
  ): Promise<T | undefined> => {
    showSpinner();
    try {
      const result = await apiCall();
      if (successMessage) {
        showSnackbar(successMessage, 'success');
      }
      return result;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Something went wrong';
      showSnackbar(errorMessage || errMsg, 'error');
      console.error('API Error:', error);
      return undefined;
    } finally {
      hideSpinner();
    }
  };

  return { handleApiCall };
};