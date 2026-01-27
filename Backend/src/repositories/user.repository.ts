import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserRepository {
    constructor(private prisma: PrismaService) { }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async create(data: {
        email: string;
        passwordHash: string;
    }) {
        return this.prisma.user.create({
            data: {
                email: data.email,
                passwordHash: data.passwordHash,
                emailVerified: false,
            },
        });
    }

    async setEmailVerified(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { emailVerified: true },
        });
    }

    async setPassword(id: string, passwordHash: string) {
        return this.prisma.user.update({
            where: { id },
            data: { passwordHash },
        });
    }

    async updateProfile(
        id: string,
        profile: {
            firstName?: string;
            lastName?: string;
            dateOfBirth?: Date;
            country?: string;
        },
    ) {
        return this.prisma.user.update({
            where: { id },
            data: profile,
        });
    }
}
