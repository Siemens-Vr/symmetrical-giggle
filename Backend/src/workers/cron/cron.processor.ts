import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('cron')
export class CronProcessor {
    private readonly logger = new Logger(CronProcessor.name);

    constructor(private prisma: PrismaService) { }

    @Process('cleanup-ghost-users')
    async handleCleanupGhostUsers(job: Job) {
        this.logger.log('Starting ghost user cleanup...');

        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - 24);

        try {
            const result = await this.prisma.user.deleteMany({
                where: {
                    emailVerified: false,
                    createdAt: {
                        lt: cutoffDate,
                    },
                },
            });

            this.logger.log(`Deleted ${result.count} ghost users`);
        } catch (error) {
            this.logger.error('Failed to cleanup ghost users', error.stack);
        }
    }
}
