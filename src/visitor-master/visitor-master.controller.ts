import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { VisitorMasterService } from './visitor-master.service';
import { CreateVisitorMasterDto } from './dto/create-visitor-master.dto';
import { UpdateVisitorMasterDto } from './dto/update-visitor-master.dto';

@ApiTags('Visitors & Leads')
@ApiBearerAuth()
@Controller('visitor-master')
export class VisitorMasterController {
  constructor(private readonly visitorMasterService: VisitorMasterService) {}

  @Post()
  create(@Body() createVisitorMasterDto: CreateVisitorMasterDto) {
    return this.visitorMasterService.create(createVisitorMasterDto);
  }

  @Get()
  findAll() {
    return this.visitorMasterService.findAll();
  }

  @Get('export-excel')
  @ApiOperation({ summary: 'Download all visitor leads as an Excel (.xlsx) file' })
  async exportExcel(
    @Res() res: Response,
    @Query('orgId') orgId?: string,
  ) {
    const buffer = await this.visitorMasterService.exportVisitorsToExcelBuffer(
      orgId ? parseInt(orgId, 10) : undefined,
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="visitors-report.xlsx"',
    });
    res.send(buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitorMasterService.findOne(+id);
  }
  @Get('orgSbuUser/:orgId/:sbuId?/:userId?')
  findByOrgSbuUser(
    @Param() params: { orgId: string; sbuId: string; userId: string },
  ) {
    const { orgId, sbuId, userId } = params;
    const orgIdParsed = this.parseParamToNumber(orgId);
    const sbuIdParsed = this.parseParamToNumber(sbuId); // Handle 'null' as null
    const userIdParsed = this.parseParamToNumber(userId);
    return this.visitorMasterService.findByOrgSbuUser(
      orgIdParsed,
      sbuIdParsed,
      userIdParsed,
    );
  }
  private parseParamToNumber(param?: string): number | null {
    return param && param !== 'null' ? parseInt(param, 10) : null;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVisitorMasterDto: UpdateVisitorMasterDto,
  ) {
    return this.visitorMasterService.update(+id, updateVisitorMasterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.visitorMasterService.remove(+id);
  }
  @Post('generate-visitor-report')
  async generateAndSendVisitorReport(
    @Body() body: { email: string; sbuId: number },
  ) {
    const { email, sbuId } = body;

    if (!email) {
      throw new Error('Email address is required');
    }

    // Generate and send the report to the provided email address
    const filePath =
      await this.visitorMasterService.generateAndSendVisitorReport(
        email,
        sbuId,
      );

    return {
      message: 'Visitor Report generated and sent successfully',
      filePath,
    };
  }
  @Post('generate-visitor-details-report')
  async generateAndSendVisitorDetailsReport(
    @Body() body: { email: string; sbuId: number },
  ) {
    const { email, sbuId } = body;

    if (!email) {
      throw new Error('Email address is required');
    }

    // Generate and send the report to the provided email address
    const filePath =
      await this.visitorMasterService.generateAndSendVisitorDetailsReport(
        email,
        sbuId,
      );

    return {
      message: 'Visitor Details Report generated and sent successfully',
      filePath,
    };
  }
  @Get('visitor-details-count/:orgId/:sbuId?/:userId?')
  async getVisitorDetailsCount(
    @Param() params: { orgId: string; sbuId: string; userId: string },
  ) {
    const { orgId, sbuId, userId } = params;
    const orgIdParsed = this.parseParamToNumber(orgId);
    const sbuIdParsed = this.parseParamToNumber(sbuId); // Handle 'null' as null
    const userIdParsed = this.parseParamToNumber(userId);

    const count = await this.visitorMasterService.getVisitorDetailsCount(
      orgIdParsed,
      sbuIdParsed,
      userIdParsed,
    );
    return { totalVisitorDetails: count };
  }
  @Get('visitor-count/:orgId/:sbuId?/:userId?')
  async getVisitorCount(
    @Param() params: { orgId: string; sbuId: string; userId: string },
  ) {
    const { orgId, sbuId, userId } = params;
    const orgIdParsed = this.parseParamToNumber(orgId);
    const sbuIdParsed = this.parseParamToNumber(sbuId); // Handle 'null' as null
    const userIdParsed = this.parseParamToNumber(userId);

    const count = await this.visitorMasterService.getVisitorCount(
      orgIdParsed,
      sbuIdParsed,
      userIdParsed,
    );
    return { totalVisitorDetails: count };
  }
}
