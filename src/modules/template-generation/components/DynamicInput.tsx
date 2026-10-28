import React, { useState, useEffect } from 'react';
import type { TemplateField } from '../types/conversation';
import { Calendar, ChevronDown } from 'lucide-react';

interface DynamicInputProps {
  field: TemplateField;
  value: any;
  onChange: (value: any) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function DynamicInput({ field, value, onChange, onSubmit, disabled }: DynamicInputProps) {
  const [localValue, setLocalValue] = useState(value || field.defaultValue || '');

  useEffect(() => {
    setLocalValue(value || field.defaultValue || '');
  }, [value, field.defaultValue]);

  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && field.type !== 'textarea') {
      e.preventDefault();
      onSubmit();
    }
  };

  // ─── Text Input ────────────────────────────────────────────────────────────

  if (field.type === 'text' || field.type === 'email' || field.type === 'url') {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type={field.type}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={field.placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        />
        {field.validation && (
          <p className="text-xs text-gray-500">
            {field.validation.minLength && `Min ${field.validation.minLength} characters. `}
            {field.validation.maxLength && `Max ${field.validation.maxLength} characters.`}
          </p>
        )}
      </div>
    );
  }

  // ─── Number Input ──────────────────────────────────────────────────────────

  if (field.type === 'number') {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="number"
          value={localValue}
          onChange={(e) => handleChange(Number(e.target.value))}
          onKeyDown={handleKeyDown}
          placeholder={field.placeholder}
          min={field.validation?.min}
          max={field.validation?.max}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>
    );
  }

  // ─── Textarea ──────────────────────────────────────────────────────────────

  if (field.type === 'textarea') {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none"
        />
        {field.validation && (
          <p className="text-xs text-gray-500">
            {field.validation.minLength && `Min ${field.validation.minLength} characters. `}
            {field.validation.maxLength && `Max ${field.validation.maxLength} characters.`}
          </p>
        )}
        <p className="text-xs text-gray-400 italic">Press Shift+Enter for new line</p>
      </div>
    );
  }

  // ─── Date Input ────────────────────────────────────────────────────────────

  if (field.type === 'date') {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <input
            type="date"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          />
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    );
  }

  // ─── Select ────────────────────────────────────────────────────────────────

  if (field.type === 'select') {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <select
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">Select an option...</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    );
  }

  // ─── Multiselect ───────────────────────────────────────────────────────────

  if (field.type === 'multiselect') {
    const selectedValues = Array.isArray(localValue) ? localValue : [];

    const toggleOption = (option: string) => {
      const newValues = selectedValues.includes(option)
        ? selectedValues.filter((v) => v !== option)
        : [...selectedValues, option];
      handleChange(newValues);
    };

    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="space-y-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
          {field.options?.map((option) => (
            <label key={option} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={() => toggleOption(option)}
                disabled={disabled}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500">Select all that apply</p>
      </div>
    );
  }

  // ─── Radio ─────────────────────────────────────────────────────────────────

  if (field.type === 'radio') {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="space-y-2">
          {field.options?.map((option) => (
            <label key={option} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="radio"
                name={field.fieldId}
                value={option}
                checked={localValue === option}
                onChange={(e) => handleChange(e.target.value)}
                disabled={disabled}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // ─── Fallback ──────────────────────────────────────────────────────────────

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-sm text-yellow-800">
        Unsupported field type: <code className="font-mono">{field.type}</code>
      </p>
    </div>
  );
}
