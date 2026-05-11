import { useState, useEffect } from 'react';
import { categoryService } from '../services/modules/category';

export const useCategoryOptions = () => {
  const [categories, setCategories] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  const fetchCategoryOptions = async () => {
    setLoading(true);
    try {
      const response:any = await categoryService.getCategories();
      const categoryData = response.data || [];
      
      const categoryMap: Record<string, any[]> = {};
      
      for (const category of categoryData) {
        const itemsResponse:any = await categoryService.getCategoryItems(category.id);
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
    fetchCategoryOptions();
  }, []);

  const getOptions = (fieldName: string) => {
    return categories[fieldName] || [];
  };

  return { getOptions, loading, categories };
};