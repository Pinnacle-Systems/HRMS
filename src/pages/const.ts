
export const getRowColor = (index: number) => ({
  backgroundColor:
    index % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
});

export const getStickyLeftSx = (index: number) => ({
  position: "sticky",
  left: 0,
  zIndex: 2,
  backgroundColor:
    index % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
});

export const getStickyRightSx = (index: number) => ({
  position: "sticky",
  right: 0,
  zIndex: 2,
  backgroundColor:
    index % 2 === 0 ? "var(--bg-primary)" : "var(--bg-secondary)",
});

// export const categoryMapping: Record<string, string> = {
//   gender: "Gender",
//   bloodGroup: "Blood Group",
//   nationality: "Nationality",
//   religion: "Religion",
//   maritalStatus: "Marital Status",
//   disabilityType: "Disability Type",
//   languages: "Languages",
//   department: "Department",
//   designation: "Designation",
//   grade: "Grade",
//   band: "Band / Pay Category",
//   empType: "Employee Type",
//   branch: "Branch",
//   attendanceSchema: "Attendance Schema",
//   employeeStatus: "Employee Status",
//   manager: "Reporting Manager",
//   relationship: "Relationship",
//   qualificationType: "Qualification Type",
//   qualificationArea: "Qualification Area",
//   accountType: "Bank Account Type",
//   salaryPaymentMode: "Salary Payment Mode",
//   salaryType: "Salary Type",
//   pfScheme: "PF Scheme",
//   nominationType: "Nomination Type",
//   documentType: "Document Type",
// };

export const getCategoryName = (
  fieldKey: string,
  fieldLabel: string,
  categories: any[] = [],
): string => {

  if (!Array.isArray(categories)) {
    return fieldLabel;
  }

  const formattedKey = fieldKey
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
    .toLowerCase();

  const matchedCategory = categories.find(
    (cat: any) =>
      cat.categoryName?.trim().toLowerCase() === formattedKey
  );

  if (matchedCategory) {
    return matchedCategory.categoryName;
  }

  return fieldLabel;
};
