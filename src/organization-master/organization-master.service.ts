import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateOrganizationMasterDto } from './dto/create-organization-master.dto';
import { UpdateOrganizationMasterDto } from './dto/update-organization-master.dto';
import { PrismaService } from 'src/prisma.service';
import { ResponseDto } from 'src/dto/Response.dto';
import { addDays, differenceInDays, format } from 'date-fns';
import { hashPassword, sanitizeUser } from 'src/auth/auth.service';

@Injectable()
export class OrganizationMasterService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createOrganizationMasterDto: CreateOrganizationMasterDto,
  ): Promise<ResponseDto> {
    try {
      const data = await this.prisma.organizationMaster.create({
        data: createOrganizationMasterDto,
      });
      return {
        message: data,
        statusCode: HttpStatus.CREATED,
        error: null,
      };
    } catch (error) {
      return {
        message: 'Failed to create organization',
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.message,
      };
    }
  }

  async createOrgAndUser(createOrganizationAndUserDto): Promise<ResponseDto> {
    try {
      if (createOrganizationAndUserDto.password) {
        try {
          const org = await this.prisma.organizationMaster.create({
            data: {
              orgName: createOrganizationAndUserDto.orgName,
              orgTypeId: createOrganizationAndUserDto.orgTypeId,
              address: createOrganizationAndUserDto.address,
              pincode: createOrganizationAndUserDto.pincode,
              orgEmail: createOrganizationAndUserDto.orgEmail,
              orgMobileNo: createOrganizationAndUserDto.orgMobileNo,
              orgContactName: createOrganizationAndUserDto.orgContactName,
            },
          });
          if (org.id) {
            try {
              const hashedPassword = await hashPassword(
                createOrganizationAndUserDto.password,
              );
              const user = await this.prisma.userMaster.create({
                data: {
                  orgId: org.id,
                  username: createOrganizationAndUserDto.orgContactName,
                  email: createOrganizationAndUserDto.orgEmail,
                  password: hashedPassword,
                  mobile: createOrganizationAndUserDto.orgMobileNo,
                  address: createOrganizationAndUserDto.address,
                  pincode: createOrganizationAndUserDto.pincode,
                  roleId: 1,
                  status: true,
                },
              });
              try {
                const plan = await this.prisma.planMaster.findFirst({
                  where: { id: 2 },
                });
                if (plan) {
                  const startDate = format(new Date(), 'yyyy-MM-dd');
                  const endDate = format(
                    addDays(new Date(), plan.validityInDays),
                    'yyyy-MM-dd',
                  );
                  await this.prisma.subscriptionMaster.create({
                    data: {
                      orgId: org.id,
                      userId: user.id,
                      planId: plan.id,
                      startDate: startDate,
                      endDate: endDate,
                      transactionStatus: true,
                      transactionReference: 'trialpack',
                      noOfDaysPending: differenceInDays(
                        new Date(endDate),
                        new Date(startDate),
                      ).toString(),
                      isActive: true,
                      status: true,
                    },
                  });
                }
                return {
                  message: sanitizeUser(user),
                  statusCode: HttpStatus.CREATED,
                };
              } catch (error) {
                return {
                  message: 'Failed to create subscription',
                  statusCode: HttpStatus.BAD_REQUEST,
                  error: error.message,
                };
              }
            } catch (error) {
              return {
                message: 'Failed to create user',
                statusCode: HttpStatus.BAD_REQUEST,
                error: error.message,
              };
            }
          }
        } catch (error) {
          return {
            message: 'Failed to create organization',
            statusCode: HttpStatus.BAD_REQUEST,
            error: error.message,
          };
        }
      } else {
        return {
          message: 'Failed to create organization and user',
          statusCode: HttpStatus.BAD_REQUEST,
        };
      }
    } catch (error) {}
  }

  async findAll(): Promise<ResponseDto> {
    try {
      const data = await this.prisma.organizationMaster.findMany();
      return {
        message: data,
        statusCode: HttpStatus.OK,
        error: null,
      };
    } catch (error) {
      return {
        message: 'Failed to retrieve organizations',
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.message,
      };
    }
  }

  async findOne(id: number): Promise<ResponseDto> {
    try {
      const data = await this.prisma.organizationMaster.findUnique({
        where: { id },
      });
      if (!data) {
        return {
          message: `Organization with ID ${id} not found`,
          statusCode: HttpStatus.NOT_FOUND,
          error: null,
        };
      }
      return {
        message: data,
        statusCode: HttpStatus.OK,
        error: null,
      };
    } catch (error) {
      return {
        message: `Failed to retrieve organization with ID ${id}`,
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.message,
      };
    }
  }

  async update(
    id: number,
    updateOrganizationMasterDto: UpdateOrganizationMasterDto,
  ): Promise<ResponseDto> {
    try {
      const data = await this.prisma.organizationMaster.update({
        where: { id },
        data: updateOrganizationMasterDto,
      });
      return {
        message: data,
        statusCode: HttpStatus.OK,
        error: null,
      };
    } catch (error) {
      return {
        message: `Failed to update organization with ID ${id}`,
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.message,
      };
    }
  }

  async remove(id: number): Promise<ResponseDto> {
    try {
      await this.prisma.organizationMaster.delete({
        where: { id },
      });
      return {
        message: 'Organization deleted successfully',
        statusCode: HttpStatus.OK,
        error: null,
      };
    } catch (error) {
      return {
        message: `Failed to delete organization with ID ${id}`,
        statusCode: HttpStatus.BAD_REQUEST,
        error: error.message,
      };
    }
  }
}
