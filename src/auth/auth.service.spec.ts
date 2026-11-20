import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AuthService,
  hashPassword,
  sanitizeUser,
  verifyPassword,
} from './auth.service';

describe('AuthService & Password Utilities', () => {
  const mockPrisma = {
    userMaster: {
      findUnique: jest.fn(),
    },
    organizationMaster: {
      findUnique: jest.fn(),
    },
    menuAssigned: {
      findMany: jest.fn(),
    },
    subscriptionMaster: {
      findFirst: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('signed-jwt-token'),
  } as unknown as JwtService;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(mockPrisma as any, mockJwtService);
  });

  it('hashes and verifies passwords with bcrypt', async () => {
    const hashed = await hashPassword('Admin@123');
    expect(hashed).not.toBe('Admin@123');
    expect(hashed.startsWith('$2')).toBe(true);
    await expect(verifyPassword('Admin@123', hashed)).resolves.toBe(true);
    await expect(verifyPassword('WrongPass', hashed)).resolves.toBe(false);
  });

  it('strips password field from user objects', () => {
    const safe = sanitizeUser({
      id: 1,
      username: 'Admin',
      password: 'secret-hash',
      email: 'admin@exhibition.local',
    });
    expect(safe).not.toHaveProperty('password');
    expect(safe.email).toBe('admin@exhibition.local');
  });

  it('authenticates valid active users and returns JWT + sanitized user', async () => {
    const hashedPassword = await hashPassword('Admin@123');
    mockPrisma.userMaster.findUnique.mockResolvedValue({
      id: 1,
      orgId: 1,
      roleId: 1,
      username: 'Admin User',
      email: 'admin@exhibition.local',
      password: hashedPassword,
      status: true,
    });
    mockPrisma.organizationMaster.findUnique.mockResolvedValue({
      id: 1,
      orgName: 'Apex Exhibitions',
    });
    mockPrisma.menuAssigned.findMany.mockResolvedValue([
      { menuName: 'Leads' },
      { menuName: 'Campaign' },
    ]);
    mockPrisma.subscriptionMaster.findFirst.mockResolvedValue({
      id: 1,
      isActive: true,
      planMaster: { name: 'Pro Plan' },
    });

    const result = await service.login({
      email: 'admin@exhibition.local',
      password: 'Admin@123',
      platform: 'WEB',
    });

    expect(result.accessToken).toBe('signed-jwt-token');
    expect(result.user).not.toHaveProperty('password');
    expect(result.user.orgName).toBe('Apex Exhibitions');
    expect(result.menus).toEqual(['Leads', 'Campaign']);
    expect(result.subscription).toBe(true);
  });

  it('rejects invalid credentials with UnauthorizedException', async () => {
    const hashedPassword = await hashPassword('Admin@123');
    mockPrisma.userMaster.findUnique.mockResolvedValue({
      id: 1,
      email: 'admin@exhibition.local',
      password: hashedPassword,
      status: true,
    });

    await expect(
      service.login({
        email: 'admin@exhibition.local',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects inactive accounts with UnauthorizedException', async () => {
    const hashedPassword = await hashPassword('Admin@123');
    mockPrisma.userMaster.findUnique.mockResolvedValue({
      id: 2,
      email: 'inactive@exhibition.local',
      password: hashedPassword,
      status: false,
    });

    await expect(
      service.login({
        email: 'inactive@exhibition.local',
        password: 'Admin@123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
