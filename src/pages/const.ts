
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

export const stickyHeaderLeftSx = {
  position: "sticky",
  left: 0,
  zIndex: 4,
  background: "var(--bg-primary)",
};

export const stickyHeaderRightSx = {
  position: "sticky",
  right: 0,
  zIndex: 4,
  background: "var(--bg-primary)",
};
