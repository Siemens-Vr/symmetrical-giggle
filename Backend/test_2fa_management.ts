import { TwoFactorMethod } from '@prisma/client';
const { TOTP } = require('otplib');

const BASE_URL = 'http://localhost:3007';
const EMAIL = `2fa-mgmt-test-${Date.now()}@example.com`;
const PASSWORD = 'Password123!';

async function main() {
    console.log('--- Starting 2FA Management Test ---');

    // 1. Signup/Login to get Token
    // We'll trust our create_test_user script logic or just signup fresh
    console.log('1. Registering user...');

    // Quick and dirty signup
    // Note: Signup requires email verification. 
    // Easier to use our "create_test_user" logic but accessing DB directly, 
    // OR use the "complete-individual" flow if I want to be 100% blackbox.
    // Given the constraints, I will use a helper function to create user directly in DB (if I had prisma client here).
    // But this script is standalone? 
    // I can import PrismaClient.

    // Let's rely on `LoginController`'s ability to log in a user we create via DB.
    // I'll assume we can use `create_2fa_mgmt_user.ts` (helper) or just do it inline if I import Prisma.
    // Importing Prisma in this script is fine.

    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcrypt');
    const prisma = new PrismaClient();

    const hash = await bcrypt.hash(PASSWORD, 12);

    const user = await prisma.user.upsert({
        where: { email: EMAIL },
        update: { passwordHash: hash, emailVerified: true },
        create: { email: EMAIL, passwordHash: hash, emailVerified: true, termsAccepted: true }
    });

    console.log(`User created: ${EMAIL}`);

    // Enable 2FA should be OFF initially
    await prisma.twoFactor.deleteMany({ where: { userId: user.id } });

    // Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });

    const loginData = await loginRes.json();
    if (!loginData.success) {
        throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    const token = loginData.accessToken;
    console.log('Logged in, got token.');

    // 2. Generate Secret
    console.log('2. Generating Secret...');
    const genRes = await fetch(`${BASE_URL}/auth/2fa/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const genData = await genRes.json();
    const secret = genData.secret;
    console.log(`Secret generated: ${secret}`); // Should be string

    // 3. Enable 2FA (TOTP)
    console.log('3. Enabling TOTP...');
    const { generate } = require('otplib');
    const code = generate(secret);

    const enableRes = await fetch(`${BASE_URL}/auth/2fa/enable`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            code,
            method: 'TOTP',
            secret
        })
    });

    const enableData = await enableRes.json();
    console.log('Enable response:', enableData);
    if (!enableData.success) throw new Error('Failed to enable 2FA');

    // Let's try to disable it.
    console.log('4. Disabling 2FA...');
    const code2 = generate(secret);

    const disableRes = await fetch(`${BASE_URL}/auth/2fa/disable`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            code: code2
        })
    });

    const disableData = await disableRes.json();
    console.log('Disable response:', disableData);
    if (!disableData.success) throw new Error('Failed to disable 2FA');

    console.log('--- TEST PASSED ---');
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
