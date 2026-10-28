import React from 'react';
import { PRICE_RANGES } from '../../lib/constants';

interface PriceFilterProps {
  selectedRange?: { min: number; max: number };
  onPriceChange: (range: { min: number; max: number } | undefined) => void;
}

const PriceFilter: React.FC<PriceFilterProps> = ({ selectedRange, onPriceChange }) => {
  const isSelected = (range: { min: number; max: number }) => {
    if (!selectedRange) return false;
    return selectedRange.min === range.min && selectedRange.max === range.max;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h3>
      <div className="space-y-2">
        <button
          onClick={() => onPriceChange(undefined)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            !selectedRange
              ? 'bg-primary-50 text-primary-700 font-medium'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Prices
        </button>
        {PRICE_RANGES.map((range, index) => (
          <button
            key={index}
            onClick={() => onPriceChange({ min: range.min, max: range.max })}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              isSelected({ min: range.min, max: range.max })
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PriceFilter;
