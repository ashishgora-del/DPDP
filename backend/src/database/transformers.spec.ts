/**
 * Unit tests for data transformation utilities
 */

import {
  snakeToCamel,
  camelToSnake,
  transformKeysToCamel,
  transformKeysToSnake,
  buildWhereClause,
  buildUpdateClause,
  extractFields,
  parseJsonField,
  cleanUndefined,
} from './transformers';

describe('Transformers', () => {
  describe('snakeToCamel', () => {
    it('should convert snake_case to camelCase', () => {
      expect(snakeToCamel('user_id')).toBe('userId');
      expect(snakeToCamel('created_at')).toBe('createdAt');
      expect(snakeToCamel('is_published')).toBe('isPublished');
    });

    it('should handle already camelCase strings', () => {
      expect(snakeToCamel('userId')).toBe('userId');
      expect(snakeToCamel('name')).toBe('name');
    });
  });

  describe('camelToSnake', () => {
    it('should convert camelCase to snake_case', () => {
      expect(camelToSnake('userId')).toBe('user_id');
      expect(camelToSnake('createdAt')).toBe('created_at');
      expect(camelToSnake('isPublished')).toBe('is_published');
    });

    it('should handle already snake_case strings', () => {
      expect(camelToSnake('user_id')).toBe('user_id');
      expect(camelToSnake('name')).toBe('name');
    });
  });

  describe('transformKeysToCamel', () => {
    it('should transform object keys to camelCase', () => {
      const input = {
        user_id: '123',
        created_at: new Date(),
        is_active: true,
      };

      const result = transformKeysToCamel(input);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('isActive');
      expect(result).not.toHaveProperty('user_id');
    });

    it('should handle nested objects', () => {
      const input = {
        user_id: '123',
        user_profile: {
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      const result = transformKeysToCamel(input);

      expect(result.userId).toBe('123');
      expect(result.userProfile.firstName).toBe('John');
      expect(result.userProfile.lastName).toBe('Doe');
    });

    it('should handle arrays', () => {
      const input = [
        { user_id: '1', user_name: 'Alice' },
        { user_id: '2', user_name: 'Bob' },
      ];

      const result = transformKeysToCamel(input);

      expect(result[0].userId).toBe('1');
      expect(result[0].userName).toBe('Alice');
      expect(result[1].userId).toBe('2');
      expect(result[1].userName).toBe('Bob');
    });

    it('should handle null and undefined', () => {
      expect(transformKeysToCamel(null)).toBeNull();
      expect(transformKeysToCamel(undefined)).toBeUndefined();
    });
  });

  describe('transformKeysToSnake', () => {
    it('should transform object keys to snake_case', () => {
      const input = {
        userId: '123',
        createdAt: new Date(),
        isActive: true,
      };

      const result = transformKeysToSnake(input);

      expect(result).toHaveProperty('user_id');
      expect(result).toHaveProperty('created_at');
      expect(result).toHaveProperty('is_active');
      expect(result).not.toHaveProperty('userId');
    });
  });

  describe('buildWhereClause', () => {
    it('should build WHERE clause with parameters', () => {
      const params = { userId: '123', isActive: true };
      const { clause, values } = buildWhereClause(params);

      expect(clause).toContain('WHERE');
      expect(clause).toContain('user_id = $1');
      expect(clause).toContain('is_active = $2');
      expect(values).toEqual(['123', true]);
    });

    it('should skip null and undefined values', () => {
      const params = { userId: '123', name: null, email: undefined };
      const { clause, values } = buildWhereClause(params);

      expect(clause).toBe('WHERE user_id = $1');
      expect(values).toEqual(['123']);
    });

    it('should return empty clause for empty params', () => {
      const { clause, values } = buildWhereClause({});

      expect(clause).toBe('');
      expect(values).toEqual([]);
    });

    it('should respect start index', () => {
      const params = { userId: '123' };
      const { clause, values } = buildWhereClause(params, 5);

      expect(clause).toContain('$5');
      expect(values).toEqual(['123']);
    });
  });

  describe('buildUpdateClause', () => {
    it('should build UPDATE SET clause', () => {
      const params = { name: 'John', email: 'john@example.com' };
      const { clause, values, nextIndex } = buildUpdateClause(params);

      expect(clause).toContain('name = $1');
      expect(clause).toContain('email = $2');
      expect(values).toEqual(['John', 'john@example.com']);
      expect(nextIndex).toBe(3);
    });

    it('should include undefined as null but skip it in values', () => {
      const params = { name: 'John', email: undefined };
      const { clause, values } = buildUpdateClause(params);

      expect(clause).toBe('name = $1');
      expect(values).toEqual(['John']);
    });
  });

  describe('extractFields', () => {
    it('should extract specified fields', () => {
      const obj = { name: 'John', email: 'john@example.com', age: 30 };
      const { columns, values, placeholders } = extractFields(obj, ['name', 'email']);

      expect(columns).toEqual(['name', 'email']);
      expect(values).toEqual(['John', 'john@example.com']);
      expect(placeholders).toEqual(['$1', '$2']);
    });

    it('should convert to snake_case when enabled', () => {
      const obj = { firstName: 'John', lastName: 'Doe' };
      const { columns } = extractFields(obj, ['firstName', 'lastName'], true);

      expect(columns).toEqual(['first_name', 'last_name']);
    });

    it('should skip undefined fields', () => {
      const obj = { name: 'John', email: undefined };
      const { columns, values } = extractFields(obj, ['name', 'email']);

      expect(columns).toEqual(['name']);
      expect(values).toEqual(['John']);
    });
  });

  describe('parseJsonField', () => {
    it('should parse valid JSON string', () => {
      const result = parseJsonField('{"key": "value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('should return object as-is', () => {
      const obj = { key: 'value' };
      const result = parseJsonField(obj);
      expect(result).toBe(obj);
    });

    it('should return default value for invalid JSON', () => {
      const result = parseJsonField('invalid json', { default: true });
      expect(result).toEqual({ default: true });
    });

    it('should handle null and undefined', () => {
      expect(parseJsonField(null)).toBeNull();
      expect(parseJsonField(undefined)).toBeNull();
      expect(parseJsonField(null, [])).toEqual([]);
    });
  });

  describe('cleanUndefined', () => {
    it('should remove undefined values', () => {
      const obj = { name: 'John', email: undefined, age: null };
      const result = cleanUndefined(obj);

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('age');
      expect(result).not.toHaveProperty('email');
      expect(result.age).toBeNull();
    });
  });
});
