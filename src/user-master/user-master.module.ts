import { Module } from '@nestjs/common';
import { UserMasterService } from './user-master.service';
import { UserMasterController } from './user-master.controller';
import { PrismaService } from 'src/prisma.service';
import { EmailService } from 'src/emailService';
import { HelperService } from 'src/helper/helper.service';
import { SubscriptionMasterService } from 'src/subscription-master/subscription-master.service';

import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UserMasterController],
  providers: [
    UserMasterService,
    PrismaService,
    EmailService,
    HelperService,
    SubscriptionMasterService,
  ],
})
export class UserMasterModule {}
