import { Injectable } from '@nestjs/common';
import { CreateHelperDto } from './dto/create-helper.dto';
import { UpdateHelperDto } from './dto/update-helper.dto';
import { PrismaService } from 'src/prisma.service';
import { SubscriptionMasterService } from 'src/subscription-master/subscription-master.service';
import { last } from 'rxjs';
import { format, isAfter, isBefore, parseISO } from 'date-fns';

@Injectable()
export class HelperService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionMasterService,
  ) {}
  async checkTrialLimit(
    entity: string,
    orgId: number,
    limit: number,
  ): Promise<void> {
    if (!orgId) return;
    const count = await this.prisma[entity].count({
      where: { orgId },
    });
    const response = await this.subscriptionService.findByOrgIsActive(
      orgId,
      true,
    );
    const subscriptions = Array.isArray(response?.message)
      ? response.message
      : [];
    if (subscriptions.length === 0) {
      return;
    }

    const currentDateString = format(new Date(), 'yyyy-MM-dd');
    const currentDate = parseISO(currentDateString);
    const hasFuturePaidPlan = subscriptions.some(
      (subscription) =>
        subscription.planId == 1 &&
        subscription.startDate &&
        isAfter(parseISO(subscription.startDate), currentDate),
    );

    if (!hasFuturePaidPlan && subscriptions[0]?.planId == 2) {
      if (count >= limit) {
        throw new Error(`Trial subscription allows only ${limit} ${entity}s.`);
      }
    }
  }
  create(createHelperDto: CreateHelperDto) {
    return 'This action adds a new helper';
  }

  findAll() {
    return `This action returns all helper`;
  }

  findOne(id: number) {
    return `This action returns a #${id} helper`;
  }

  update(id: number, updateHelperDto: UpdateHelperDto) {
    return `This action updates a #${id} helper`;
  }

  remove(id: number) {
    return `This action removes a #${id} helper`;
  }
}
