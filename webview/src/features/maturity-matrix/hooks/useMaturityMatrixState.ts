import { useMaturityMatrixStore } from '../store/useMaturityMatrixStore';

export function useMaturityMatrixState() {
  const activeTab = useMaturityMatrixStore((s) => s.activeTab);
  const setActiveTab = useMaturityMatrixStore((s) => s.setActiveTab);
  const categories = useMaturityMatrixStore((s) => s.categories);
  const selectedCategoryId = useMaturityMatrixStore((s) => s.selectedCategoryId);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];

  return {
    activeTab,
    setActiveTab,
    categories,
    selectedCategoryId,
    selectedCategory,
  };
}
