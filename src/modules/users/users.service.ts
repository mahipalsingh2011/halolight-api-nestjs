import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User, UserStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { createPaginatedResponse } from '../../common/interfaces/pagination.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * Service handling user-related business logic
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieve paginated list of users with optional search filtering
   */
  async findAll(query: PaginationDto & { status?: UserStatus; role?: string }) {
    const { page = 1, limit = 20, search, status, role } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(role && {
        roles: {
          some: {
            role: {
              name: role,
            },
          },
        },
      }),
    };

    // Execute count and find in parallel for performance
    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          status: true,
          department: true,
          position: true,
          createdAt: true,
          updatedAt: true,
          // Exclude password
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return createPaginatedResponse(users, total, page, limit);
  }

  /**
   * Find a single user by ID
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        status: true,
        department: true,
        position: true,
        bio: true,
        quotaUsed: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                label: true,
                description: true,
                permissions: {
                  select: {
                    permission: {
                      select: {
                        id: true,
                        action: true,
                        resource: true,
                        description: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        // Exclude password
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Transform roles array to flatten structure and convert BigInt
    const roles = user.roles.map(({ role }) => ({
      ...role,
      permissions: role.permissions.map((p) => p.permission),
    }));

    // Extract unique permissions across all roles
    const permissions = Array.from(
      roles
        .flatMap((role) => role.permissions)
        .reduce(
          (acc, perm) => acc.set(perm.id, perm),
          new Map<string, (typeof roles)[number]['permissions'][number]>(),
        )
        .values(),
    );

    const transformedUser = {
      ...user,
      quotaUsed: Number(user.quotaUsed), // Convert BigInt to Number
      roles,
      permissions,
    };

    return transformedUser;
  }

  /**
   * Find user by email (used for authentication)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto) {
    const data: Prisma.UserCreateInput = {
      email: createUserDto.email,
      username: createUserDto.username,
      password: createUserDto.password, // Should be hashed by caller
      name: createUserDto.name,
      phone: createUserDto.phone,
      avatar: createUserDto.avatar,
      department: createUserDto.department,
      position: createUserDto.position,
      bio: createUserDto.bio,
    };

    const user = await this.prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        status: true,
        createdAt: true,
        // Exclude password
      },
    });

    return user;
  }

  /**
   * Update user information
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(updateUserDto.name && { name: updateUserDto.name }),
        ...(updateUserDto.email && { email: updateUserDto.email }),
        ...(updateUserDto.username && { username: updateUserDto.username }),
        ...(updateUserDto.phone !== undefined && {
          phone: updateUserDto.phone,
        }),
        ...(updateUserDto.avatar !== undefined && {
          avatar: updateUserDto.avatar,
        }),
        ...(updateUserDto.status && { status: updateUserDto.status }),
        ...(updateUserDto.department !== undefined && {
          department: updateUserDto.department,
        }),
        ...(updateUserDto.position !== undefined && {
          position: updateUserDto.position,
        }),
        ...(updateUserDto.bio !== undefined && { bio: updateUserDto.bio }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        status: true,
        department: true,
        position: true,
        bio: true,
        updatedAt: true,
        // Exclude password
      },
    });

    return user;
  }

  /**
   * Soft delete user (set status to INACTIVE)
   * For hard delete, use remove() instead
   */
  async softDelete(id: string): Promise<void> {
    await this.update(id, { status: 'INACTIVE' as UserStatus });
  }

  /**
   * Permanently remove user from database
   */
  async remove(id: string): Promise<void> {
    // Check if user exists
    await this.findOne(id);

    await this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }
}
