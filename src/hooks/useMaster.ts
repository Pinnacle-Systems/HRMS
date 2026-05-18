import { useState, useEffect } from 'react';
import { categoryService } from '../services/modules/category';

export const useCategoryOptions = () => {
  const [categories, setCategories] = useState<Record<string, unknown[]>>({});
  const [loading, setLoading] = useState(false);

  const fetchCategoryOptions = async () => {
    setLoading(true);
    try {
      const response = await categoryService.getCategories() as { data?: { id: string; categoryName: string }[] };
      const categoryData = response.data || [];
      const categoryMap: Record<string, unknown[]> = {};
      for (const category of categoryData) {
        const itemsResponse = await categoryService.getCategoryItems(category.id) as { data?: unknown[] };
        categoryMap[category.categoryName] = itemsResponse.data || [];
      }
      setCategories(categoryMap);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => { await fetchCategoryOptions(); })();
  }, []);

  const getOptions = (fieldName: string) => {
    return categories[fieldName] || [];
  };

  return { getOptions, loading, categories };
};