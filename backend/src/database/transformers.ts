/**
 * Data transformation utilities for converting between database snake_case
 * and application camelCase conventions
 */

/**
 * Convert snake_case string to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase string to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Transform object keys from snake_case to camelCase
 */
export function transformKeysToCamel<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformKeysToCamel(item)) as any;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const transformed: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = snakeToCamel(key);
        const value = obj[key];
        
        // Recursively transform nested objects and arrays
        if (value !== null && typeof value === 'object') {
          transformed[camelKey] = transformKeysToCamel(value);
        } else {
          transformed[camelKey] = value;
        }
      }
    }
    
    return transformed as T;
  }

  return obj;
}

/**
 * Transform object keys from camelCase to snake_case
 */
export function transformKeysToSnake<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformKeysToSnake(item)) as any;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const transformed: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = camelToSnake(key);
        const value = obj[key];
        
        // Recursively transform nested objects and arrays
        if (value !== null && typeof value === 'object') {
          transformed[snakeKey] = transformKeysToSnake(value);
        } else {
          transformed[snakeKey] = value;
        }
      }
    }
    
    return transformed as T;
  }

  return obj;
}

/**
 * Transform a single database record to camelCase
 */
export function mapToModel<T>(record: any): T {
  return transformKeysToCamel<T>(record);
}

/**
 * Transform an array of database records to camelCase
 */
export function mapToModels<T>(records: any[]): T[] {
  return records.map(record => transformKeysToCamel<T>(record));
}

/**
 * Transform query parameters from camelCase to snake_case for SQL WHERE clauses
 */
export function transformQueryParams(params: Record<string, any>): Record<string, any> {
  return transformKeysToSnake(params);
}

/**
 * Build dynamic WHERE clause from camelCase params
 * Returns { clause: string, values: any[] }
 */
export function buildWhereClause(
  params: Record<string, any>,
  startIndex: number = 1
): { clause: string; values: any[] } {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = startIndex;

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      const snakeKey = camelToSnake(key);
      conditions.push(`${snakeKey} = $${paramIndex++}`);
      values.push(value);
    }
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  return { clause, values };
}

/**
 * Build dynamic UPDATE SET clause from camelCase params
 * Returns { clause: string, values: any[], nextIndex: number }
 */
export function buildUpdateClause(
  params: Record<string, any>,
  startIndex: number = 1
): { clause: string; values: any[]; nextIndex: number } {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = startIndex;

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      const snakeKey = camelToSnake(key);
      fields.push(`${snakeKey} = $${paramIndex++}`);
      values.push(value);
    }
  }

  const clause = fields.length > 0 ? fields.join(', ') : '';
  
  return { clause, values, nextIndex: paramIndex };
}

/**
 * Extract specific fields from an object (useful for INSERT statements)
 */
export function extractFields(
  obj: Record<string, any>,
  fields: string[],
  convertToSnake: boolean = true
): { columns: string[]; values: any[]; placeholders: string[] } {
  const columns: string[] = [];
  const values: any[] = [];
  const placeholders: string[] = [];
  let index = 1;

  for (const field of fields) {
    if (obj[field] !== undefined) {
      columns.push(convertToSnake ? camelToSnake(field) : field);
      values.push(obj[field]);
      placeholders.push(`$${index++}`);
    }
  }

  return { columns, values, placeholders };
}

/**
 * Safely parse JSON fields from database (handles null/invalid JSON)
 */
export function parseJsonField<T = any>(value: any, defaultValue: T | null = null): T | null {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (typeof value === 'object') {
    return value as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Format date fields consistently (converts to ISO string or null)
 */
export function formatDateField(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  
  if (date instanceof Date) {
    return date.toISOString();
  }
  
  return new Date(date).toISOString();
}

/**
 * Clean undefined values from object (useful before INSERT/UPDATE)
 */
export function cleanUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}
