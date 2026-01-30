import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CronService } from './cron.service';
import { CronProcessor } from './cron.processor';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'cron',
        }),
    ],
    providers: [CronService, CronProcessor],
})
export class CronModule { }
