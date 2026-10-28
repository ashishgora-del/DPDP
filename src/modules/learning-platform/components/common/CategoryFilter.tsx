import React from 'react';
import { Category } from '../../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId?: string;
  onCategoryChange: (categoryId: string | undefined) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategoryId,
  onCategoryChange
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
      <div className="space-y-2">
        <button
          onClick={() => onCategoryChange(undefined)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            !selectedCategoryId
              ? 'bg-primary-50 text-primary-700 font-medium'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Categories
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              selectedCategoryId === category.id
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
