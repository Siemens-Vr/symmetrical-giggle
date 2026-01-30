import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class CronService implements OnModuleInit {
    private readonly logger = new Logger(CronService.name);

    constructor(@InjectQueue('cron') private cronQueue: Queue) { }

    async onModuleInit() {
        // Remove existing repeatable jobs to avoid duplicates on restart
        const jobs = await this.cronQueue.getRepeatableJobs();
        for (const job of jobs) {
            await this.cronQueue.removeRepeatableByKey(job.key);
        }

        // Add ghost user cleanup job (run every hour)
        await this.cronQueue.add('cleanup-ghost-users', {}, {
            repeat: {
                cron: '0 * * * *', // Every hour
            },
        });

        this.logger.log('Scheduled ghost user cleanup job');
    }
}
