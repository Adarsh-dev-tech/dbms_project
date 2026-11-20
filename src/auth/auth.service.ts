import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { addDays, differenceInDays, format } from 'date-fns';
import { PrismaService } from 'src/prisma.service';
import { AuthLoginDto, AuthRegisterDto } from './dto/auth.dto';

export function sanitizeUser<T extends { password?: string }>(
  user: T,
): Omit<T, 'password'> {
  if (!user) return user;
  const { password: _password, ...safe } = user;
  void _password;
  return safe;
}

export async function verifyPassword(
  plainText: string,
  storedPassword: string,
): Promise<boolean> {
  if (!plainText || !storedPassword) return false;
  if (
    storedPassword.startsWith('$2a$') ||
    storedPassword.startsWith('$2b$') ||
    storedPassword.startsWith('$2y$')
  ) {
    return bcrypt.compare(plainText, storedPassword);
  }
  return plainText === storedPassword;
}

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: AuthLoginDto) {
    const userRes = await this.prisma.userMaster.findUnique({
      where: { email: dto.email },
    });

    if (!userRes) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await verifyPassword(dto.password, userRes.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!userRes.status) {
      throw new UnauthorizedException('User account is inactive');
    }

    return this.buildAuthResponse(userRes);
  }

  async register(dto: AuthRegisterDto) {
    const existingUser = await this.prisma.userMaster.findUnique({
      where: { email: dto.orgEmail },
    });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const existingOrg = await this.prisma.organizationMaster.findFirst({
      where: {
        OR: [{ orgEmail: dto.orgEmail }, { orgMobileNo: dto.orgMobileNo }],
      },
    });
    if (existingOrg) {
      throw new ConflictException(
        'An organization with this email or mobile number already exists',
      );
    }

    const hashedPassword = await hashPassword(dto.password);

    const createdUser = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organizationMaster.create({
        data: {
          orgName: dto.orgName,
          orgContactName: dto.orgContactName,
          orgEmail: dto.orgEmail,
          orgMobileNo: dto.orgMobileNo,
          address: dto.address,
          pincode: dto.pincode,
          status: true,
        },
      });

      const role = await tx.roleMaster.create({
        data: {
          orgId: org.id,
          roleName: 'Admin',
          roleDescription: 'Organization Administrator',
          createdBy: dto.orgContactName,
          status: true,
          menu: {
            create: [
              { menuId: 1, menuName: 'Leads' },
              { menuId: 2, menuName: 'Campaign' },
              { menuId: 3, menuName: 'Setup' },
              { menuId: 4, menuName: 'Users' },
              { menuId: 5, menuName: 'Approvals' },
              { menuId: 6, menuName: 'Gifts' },
              { menuId: 7, menuName: 'Reports' },
              { menuId: 8, menuName: 'Subscription' },
            ],
          },
        },
      });

      const sbu = await tx.sbuMaster.create({
        data: {
          orgId: org.id,
          sbuName: 'Sales',
          sbuDescription: 'Primary Exhibition Sales Unit',
          createdBy: dto.orgContactName,
          Status: true,
        },
      });

      const user = await tx.userMaster.create({
        data: {
          orgId: org.id,
          orgName: org.orgName,
          sbuId: sbu.id,
          roleId: role.id,
          username: dto.orgContactName,
          email: dto.orgEmail,
          password: hashedPassword,
          mobile: dto.orgMobileNo,
          address: dto.address,
          pincode: dto.pincode,
          createdBy: dto.orgContactName,
          status: true,
        },
      });

      const plan =
        (await tx.planMaster.findFirst({ where: { name: 'Pro Plan' } })) ||
        (await tx.planMaster.findFirst());

      if (plan) {
        const startDate = format(new Date(), 'yyyy-MM-dd');
        const endDate = format(
          addDays(new Date(), plan.validityInDays),
          'yyyy-MM-dd',
        );
        await tx.subscriptionMaster.create({
          data: {
            orgId: org.id,
            userId: user.id,
            planId: plan.id,
            startDate,
            endDate,
            transactionStatus: true,
            transactionReference: 'WELCOME_PACK',
            noOfDaysPending: differenceInDays(
              new Date(endDate),
              new Date(startDate),
            ).toString(),
            isActive: true,
            status: true,
            createdBy: dto.orgContactName,
          },
        });
      }

      return user;
    });

    if (!createdUser) {
      throw new BadRequestException('Failed to register organization');
    }

    return this.buildAuthResponse(createdUser);
  }

  async getProfile(userId: number) {
    const userRes = await this.prisma.userMaster.findUnique({
      where: { id: userId },
    });
    if (!userRes) {
      throw new UnauthorizedException('User not found');
    }
    return this.buildAuthResponse(userRes, false);
  }

  async buildAuthResponse(userRes: any, includeToken = true) {
    const organization = await this.prisma.organizationMaster.findUnique({
      where: { id: userRes.orgId },
    });

    const menuAssignments = userRes.roleId
      ? await this.prisma.menuAssigned.findMany({
          where: { roleMasterId: userRes.roleId },
        })
      : [];
    const menus = menuAssignments.map((assignment) => assignment.menuName);

    const subscription = await this.prisma.subscriptionMaster.findFirst({
      where: { orgId: userRes.orgId, isActive: true },
      orderBy: { endDate: 'desc' },
      include: { planMaster: true },
    });

    const safeUser = {
      ...sanitizeUser(userRes),
      orgName: organization?.orgName ?? userRes.orgName ?? '',
    };

    const payload = {
      sub: userRes.id,
      email: userRes.email,
      orgId: userRes.orgId,
      roleId: userRes.roleId ?? null,
    };

    return {
      ...(includeToken ? { accessToken: this.jwtService.sign(payload) } : {}),
      user: safeUser,
      menus: subscription ? menus : ['Subscription'],
      subscription: Boolean(subscription),
      subscriptionDetails: subscription ?? null,
    };
  }
}
