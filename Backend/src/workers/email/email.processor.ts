import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface SendOtpJob {
    email: string;
    code: string;
    expiresIn: number;
}

@Injectable()
@Processor('email')
export class EmailProcessor {
    private readonly logger = new Logger(EmailProcessor.name);
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        this.initializeTransporter();
    }

    private initializeTransporter() {
        const emailService = this.configService.get('EMAIL_SERVICE');

        if (emailService === 'smtp') {
            this.transporter = nodemailer.createTransport({
                host: this.configService.get('SMTP_HOST'),
                port: parseInt(this.configService.get('SMTP_PORT')),
                secure: this.configService.get('SMTP_SECURE') === 'true',
                auth: {
                    user: this.configService.get('SMTP_USER'),
                    pass: this.configService.get('SMTP_PASSWORD'),
                },
            });
        } else {
            // For development: log to console
            this.logger.warn('Email service not configured. Emails will be logged to console.');
        }
    }

    @Process('send-otp')
    async handleSendOtp(job: Job<SendOtpJob>) {
        const { email, code, expiresIn } = job.data;

        try {
            const html = this.generateOtpEmailHtml(code, expiresIn);

            if (this.transporter) {
                await this.transporter.sendMail({
                    from: `"${this.configService.get('EMAIL_FROM_NAME')}" <${this.configService.get('EMAIL_FROM_ADDRESS')}>`,
                    to: email,
                    subject: 'Your VRStore Verification Code',
                    html,
                });

                this.logger.log(`OTP email sent successfully to ${email}`);
            } else {
                // Development mode: log to console
                this.logger.log(`\n${'='.repeat(60)}`);
                this.logger.log(`📧 OTP Email (Development Mode)`);
                this.logger.log(`To: ${email}`);
                this.logger.log(`Code: ${code}`);
                this.logger.log(`Expires in: ${expiresIn / 60} minutes`);
                this.logger.log(`${'='.repeat(60)}\n`);
            }
        } catch (error) {
            this.logger.error(`Failed to send OTP email to ${email}:`, error);
            throw error;
        }
    }

    private generateOtpEmailHtml(code: string, expiresIn: number): string {
        const expiryMinutes = expiresIn / 60;

        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VRStore Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">VRStore</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email</h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                Thank you for signing up with VRStore! Please use the verification code below to complete your registration:
              </p>
              
              <!-- OTP Code -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; display: inline-block;">
                      <span style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${code}</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0;">
                This code will expire in <strong>${expiryMinutes} minutes</strong>.
              </p>
              
              <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eeeeee;">
                <strong>Security Notice:</strong> If you didn't request this code, please ignore this email. Never share your verification code with anyone.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} VRStore. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
    }
}
