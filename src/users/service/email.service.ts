import { Injectable } from '@nestjs/common';
import * as config from 'config';
import * as nodemailer from 'nodemailer';
import Mail = require('nodemailer/lib/mailer');

const mailConfig = config.get('mail');

@Injectable()
export class EmailService {
    private mailTransporter: Mail;

    constructor() {
        this.mailTransporter = nodemailer.createTransport({
            service: mailConfig.service,
            auth: {
                user: mailConfig.email,
                pass: mailConfig.password
            }
        });
    }

    async generateVerifyToken(): Promise<string> {
        const token: string[] = [];
        for (let i = 0; i < 6; i++) {
            const rand = Math.floor(Math.random() * 3);
            let t;

            switch (rand) {
                case 0:
                    t = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
                    break;
                case 1:
                    t = String.fromCharCode(Math.floor(Math.random() * 26) + 97);
                    break;
                default:
                    t = String(Math.floor(Math.random() * 10));
            }
            token[i] = t;
        }
        return token.join('');
    }

    async sendJoinVerificationToGuest(email: string, verifyToken: string): Promise<void> {
        const baseUrl = 'http://localhost:3000';
        const url = `${baseUrl}/api/users/email-verify?email=${email}&token=${verifyToken}`;
        const mailOptions: MailOptions = {
            to: email,
            subject: '회원 가입 메일입니다.',
            html:
                `
            회원 가입 버튼을 누르시면 가입이 완료됩니다.<br/>
            <form action="${url}" method="post">
              <button>회원 가입</button>
            </form>
            `
        };

        await this.mailTransporter.sendMail(mailOptions);
    }
}

interface MailOptions {
    to: string;
    subject: string;
    html: string;
}