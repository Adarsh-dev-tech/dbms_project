import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateUserMasterDto } from './dto/create-user-master.dto';
import { UpdateUserMasterDto } from './dto/update-user-master.dto';
import { PrismaService } from 'src/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as nodemailer from 'nodemailer';
import { ResponseDto } from 'src/dto/Response.dto';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import { EmailService } from 'src/emailService';
import { HelperService } from 'src/helper/helper.service';
import {
  AuthService,
  hashPassword,
  sanitizeUser,
  verifyPassword,
} from 'src/auth/auth.service';

@Injectable()
export class UserMasterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly helperService: HelperService,
    private readonly authService: AuthService,
  ) {}

  private otps = new Map<string, { otp: string; expiry: Date }>();
  private transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    },
    service: 'outlook',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async create(createUserMasterDto: CreateUserMasterDto): Promise<ResponseDto> {
    try {
      try {
        await this.helperService.checkTrialLimit(
          'userMaster',
          createUserMasterDto.orgId,
          2,
        );
      } catch (error) {
        return {
          message: 'Failed to validate subscription',
          statusCode: HttpStatus.BAD_REQUEST,
          error: error.message,
        };
      }

      const hashedPassword = await hashPassword(createUserMasterDto.password);
      const data = await this.prisma.userMaster.create({
        data: {
          ...createUserMasterDto,
          password: hashedPassword,
          status: createUserMasterDto.status ?? true,
        },
      });
      return {
        message: sanitizeUser(data),
        statusCode: HttpStatus.CREATED,
        error: null,
      };
    } catch (error) {
      return {
        message: 'Failed to create user',
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.message,
      };
    }
  }

  async findAll(): Promise<ResponseDto> {
    try {
      const data = await this.prisma.userMaster.findMany({
        orderBy: { id: 'desc' },
      });
      return {
        message: data.map((u) => sanitizeUser(u)),
        statusCode: HttpStatus.OK,
        error: null,
      };
    } catch (error) {
      return {
        message: 'Failed to retrieve users',
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.message,
      };
    }
  }

  async findOne(id: number): Promise<ResponseDto> {
    try {
      const data = await this.prisma.userMaster.findUnique({
        where: { id },
      });
      if (!data) {
        return {
          message: `User with ID ${id} not found`,
          statusCode: HttpStatus.NOT_FOUND,
          error: null,
        };
      }
      return {
        message: sanitizeUser(data),
        statusCode: HttpStatus.OK,
        error: null,
      };
    } catch (error) {
      return {
        message: `Failed to retrieve user with ID ${id}`,
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.message,
      };
    }
  }

  async findByOrg(orgId: number): Promise<ResponseDto> {
    try {
      const response = await this.prisma.userMaster.findMany({
        where: { orgId },
        orderBy: { id: 'desc' },
      });

      return {
        message: response.map((u) => sanitizeUser(u)),
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        message: 'Failed to fetch User',
        error: error.message,
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }
  }

  async update(
    id: number,
    updateUserMasterDto: UpdateUserMasterDto,
  ): Promise<ResponseDto> {
    try {
      const updateData: any = { ...updateUserMasterDto };
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      } else {
        delete updateData.password;
      }

      const data = await this.prisma.userMaster.update({
        where: { id },
        data: updateData,
      });
      return {
        message: sanitizeUser(data),
        statusCode: HttpStatus.OK,
        error: null,
      };
    } catch (error) {
      return {
        message: `Failed to update user with ID ${id}`,
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.message,
      };
    }
  }

  async remove(id: number): Promise<ResponseDto> {
    try {
      await this.prisma.userMaster.delete({
        where: { id },
      });
      return {
        message: 'User deleted successfully',
        statusCode: HttpStatus.OK,
        error: null,
      };
    } catch (error) {
      return {
        message: `Failed to delete user with ID ${id}`,
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.message,
      };
    }
  }

  async sendOtp(email: string): Promise<ResponseDto> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);

    this.otps.set(email, { otp, expiry });

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Login',
        text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
      });
      return {
        message: 'OTP sent to your email',
        statusCode: HttpStatus.OK,
        error: null,
      };
    } catch (error) {
      return {
        message: 'Failure in sending email',
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.message,
      };
    }
  }

  async validateOtp(
    email: string,
    otp: string,
    androidVersion?: string,
    iosVersion?: string,
    platform = 'WEB',
  ): Promise<ResponseDto> {
    const otpDetails = this.otps.get(email);

    if (!otpDetails) {
      return {
        message: 'OTP not found',
        statusCode: HttpStatus.BAD_REQUEST,
        error: null,
      };
    }

    const { otp: validOtp, expiry } = otpDetails;

    if (otp !== validOtp) {
      return {
        message: 'Invalid OTP',
        statusCode: HttpStatus.BAD_REQUEST,
        error: null,
      };
    }

    if (new Date() > expiry) {
      return {
        message: 'OTP expired',
        statusCode: HttpStatus.BAD_REQUEST,
        error: null,
      };
    }

    const platformLocal = (platform || 'WEB').toUpperCase();
    const validPlatforms = ['WEB', 'ANDROID', 'IOS'];
    if (!validPlatforms.includes(platformLocal)) {
      return {
        message: 'No Matching Platform found',
        statusCode: HttpStatus.CONFLICT,
        error: null,
      };
    }

    if (platformLocal === 'ANDROID' || platformLocal === 'IOS') {
      const version = await this.prisma.versionMaster.findUnique({
        where: { platform: platformLocal },
      });
      const clientVersion =
        platformLocal === 'ANDROID' ? androidVersion : iosVersion;
      if (version && clientVersion && version.latestVersion !== clientVersion) {
        return {
          message: 'Outdated Version! Update for the best experience.',
          statusCode: HttpStatus.CONFLICT,
          error: null,
        };
      }
    }

    const user = await this.prisma.userMaster.findUnique({
      where: { email },
    });
    if (!user) {
      return {
        message: 'User does not exist',
        statusCode: HttpStatus.NOT_FOUND,
        error: null,
      };
    }

    this.otps.delete(email);
    const authPayload = await this.authService.buildAuthResponse(user);
    return {
      message: authPayload,
      statusCode: HttpStatus.OK,
      error: null,
    };
  }

  async login(loginDto: LoginDto): Promise<ResponseDto> {
    const {
      email,
      password,
      androidVersion,
      iosVersion,
      platform = 'WEB',
    } = loginDto;
    const platformLocal = (platform || 'WEB').toUpperCase();
    const validPlatforms = ['WEB', 'ANDROID', 'IOS'];

    try {
      const userRes = await this.prisma.userMaster.findUnique({
        where: { email },
      });

      if (!userRes || !(await verifyPassword(password || '', userRes.password))) {
        return {
          message: 'Invalid credentials',
          statusCode: HttpStatus.UNAUTHORIZED,
          error: null,
        };
      }

      if (!userRes.status) {
        return {
          message: 'User is not active',
          statusCode: HttpStatus.BAD_REQUEST,
          error: null,
        };
      }

      if (!validPlatforms.includes(platformLocal)) {
        return {
          message: 'No Matching Platform found',
          statusCode: HttpStatus.CONFLICT,
          error: null,
        };
      }

      if (platformLocal === 'ANDROID' || platformLocal === 'IOS') {
        const version = await this.prisma.versionMaster.findUnique({
          where: { platform: platformLocal },
        });
        const clientVersion =
          platformLocal === 'ANDROID' ? androidVersion : iosVersion;
        if (
          version &&
          clientVersion &&
          version.latestVersion !== clientVersion
        ) {
          return {
            message: 'Outdated Version! Update for the best experience.',
            statusCode: HttpStatus.CONFLICT,
            error: null,
          };
        }
      }

      const authPayload = await this.authService.buildAuthResponse(userRes);
      return {
        message: authPayload.subscription
          ? authPayload
          : { ...authPayload, message: 'VALIDITY EXPIRED' },
        statusCode: HttpStatus.OK,
        error: null,
      };
    } catch (error) {
      return {
        message: 'Failed to log in',
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.message,
      };
    }
  }

  async checkUserExist(loginDto: LoginDto): Promise<ResponseDto> {
    const { email } = loginDto;

    try {
      const user = await this.prisma.userMaster.findUnique({
        where: { email },
      });
      if (!user) {
        return {
          message: 'User does not exist',
          statusCode: HttpStatus.NOT_FOUND,
          error: null,
        };
      }

      if (user.status) {
        return {
          message: sanitizeUser(user),
          statusCode: HttpStatus.OK,
          error: null,
        };
      }

      return {
        message: 'User is not active',
        statusCode: HttpStatus.BAD_REQUEST,
        error: null,
      };
    } catch (error) {
      return {
        message: 'Failed to check user existence',
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.message,
      };
    }
  }

  async generateAndSendUserReport(
    email: string,
    sbuId: number,
  ): Promise<string> {
    try {
      const whereClause = sbuId !== 0 ? { sbuId } : {};
      const users = await this.prisma.userMaster.findMany({
        where: whereClause,
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('User Report');

      worksheet.columns = [
        { header: 'User ID', key: 'userId', width: 10 },
        { header: 'SBU Name', key: 'sbuName', width: 20 },
        { header: 'Campaign Name', key: 'campaignName', width: 20 },
        { header: 'Username', key: 'username', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Mobile', key: 'mobile', width: 18 },
        { header: 'Role', key: 'role', width: 15 },
        { header: 'Address', key: 'address', width: 25 },
        { header: 'Pincode', key: 'pincode', width: 15 },
      ];

      for (const user of users) {
        const sbu = user.sbuId
          ? await this.prisma.sbuMaster.findUnique({
              where: { id: user.sbuId },
            })
          : null;

        const campaign = user.campaignId
          ? await this.prisma.campaignMaster.findUnique({
              where: { id: user.campaignId },
            })
          : null;

        const role = user.roleId
          ? await this.prisma.roleMaster.findUnique({
              where: { id: user.roleId },
            })
          : null;

        worksheet.addRow({
          userId: user.id,
          sbuName: sbu ? sbu.sbuName : 'N/A',
          campaignName: campaign ? campaign.campaignName : 'N/A',
          username: user.username,
          email: user.email,
          mobile: user.mobile,
          role: role ? role.roleName : 'N/A',
          address: user.address,
          pincode: user.pincode,
        });
      }

      const filePath = path.resolve('./user.xlsx');
      await workbook.xlsx.writeFile(filePath);

      await this.emailService.sendEmail(
        email,
        'User Report',
        'Please find the attached user report.',
        filePath,
        'user-report.xlsx',
      );

      return filePath;
    } catch (error) {
      throw new Error(`Failed to generate or send report: ${error.message}`);
    }
  }

  async getUserByStatus(status: boolean): Promise<ResponseDto> {
    try {
      const response = await this.prisma.userMaster.findMany({
        where: { status },
      });

      return {
        message: response.map((u) => sanitizeUser(u)),
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      return {
        message: 'Failed to fetch User Master',
        error: error.message,
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }
  }
}
