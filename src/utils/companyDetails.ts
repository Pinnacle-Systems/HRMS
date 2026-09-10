export type CompanyDetails = {
  stateId: string;
  cityId: string;
};

const COMPANY_DETAILS_STORAGE_KEY = "hrms.company.details";

export function saveCompanyDetails(details: CompanyDetails): void {
  localStorage.setItem(COMPANY_DETAILS_STORAGE_KEY, JSON.stringify(details));
}

export function loadCompanyDetails(): CompanyDetails | null {
  const raw = localStorage.getItem(COMPANY_DETAILS_STORAGE_KEY);
  if (!raw) return null;

  try {
    const details = JSON.parse(raw) as Partial<CompanyDetails>;
    return {
      stateId: details.stateId ?? "",
      cityId: details.cityId ?? "",
    };
  } catch {
    return null;
  }
}