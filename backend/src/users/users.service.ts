import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { User } from '../database/database.types';
import { randomUUID } from 'crypto';

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async create(data: { email: string; passwordHash?: string; password?: string; name?: string; firstName?: string; lastName?: string; primaryRole?: string }): Promise<User> {
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = data.passwordHash || data.password || '';
    const name = data.name || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : (data.firstName || data.lastName || null));

    const result = await this.db.query<User>(
      `INSERT INTO users (id, email, password_hash, name, primary_role, is_super_admin, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [
        randomUUID(),
        data.email,
        passwordHash,
        name,
        data.primaryRole || null,
        false,
      ]
    );
    return result.rows[0];
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.db.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByIdWithRoles(id: string) {
    const result = await this.db.query(
      `SELECT 
        u.*,
        json_agg(
          DISTINCT jsonb_build_object(
            'userId', ur.user_id,
            'roleId', ur.role_id,
            'role', jsonb_build_object(
              'id', r.id,
              'name', r.name,
              'description', r.description
            )
          )
        ) FILTER (WHERE ur.user_id IS NOT NULL) as "userRoles",
        json_agg(
          DISTINCT jsonb_build_object(
            'userId', uo.user_id,
            'organizationId', uo.organization_id,
            'role', uo.org_role,
            'organization', jsonb_build_object(
              'id', o.id,
              'name', o.name,
              'slug', o.slug
            )
          )
        ) FILTER (WHERE uo.user_id IS NOT NULL) as "userOrganizations"
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN user_organizations uo ON uo.user_id = u.id
       LEFT JOIN organizations o ON o.id = uo.organization_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );
    return result.rows[0] || null;
  }

  async assignRole(userId: string, roleName: string) {
    // Find or create role
    let roleResult = await this.db.query(
      'SELECT * FROM roles WHERE name = $1',
      [roleName]
    );

    let role = roleResult.rows[0];

    if (!role) {
      const createResult = await this.db.query(
        `INSERT INTO roles (id, name, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [randomUUID(), roleName, `${roleName} role`]
      );
      role = createResult.rows[0];
    }

    // Check if user already has this role
    const existingResult = await this.db.query(
      'SELECT * FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, role.id]
    );

    if (existingResult.rows.length > 0) {
      return existingResult.rows[0];
    }

    // Assign role
    const result = await this.db.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, role.id]
    );
    return result.rows[0];
  }

  async updateProfile(userId: string, data: { name?: string; primaryRole?: string }): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.primaryRole !== undefined) {
      fields.push(`primary_role = $${paramCount++}`);
      values.push(data.primaryRole);
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await this.db.query<User>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    return result.rows[0];
  }
}
