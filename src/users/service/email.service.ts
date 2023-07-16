import * as config from 'config';
import * as nodemailer from 'nodemailer';
import Mail = require('nodemailer/lib/mailer');
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user.entity';
import { UserRepository } from '../user.repository';

const mailConfig = config.get('mail');

@Injectable()
export class EmailService {
    private mailTransporter: Mail;

    constructor(
        @InjectRepository(User)
        private readonly userRepository: UserRepository
    ) {
        this.mailTransporter = nodemailer.createTransport({
            service : mailConfig.service,
            auth : {
                user : mailConfig.email,
                pass : mailConfig.password
            }
        });
    }

    async sendJoinVerificationToGuest(email: string, verifyToken: string): Promise<any> {
        const baseUrl = 'http://localhost:3000';
        const url = `${baseUrl}/api/users/email-verify?token=${verifyToken}`;
        const mailOptions: MailOptions = {
            to : email,
            subject : '회원 인증 메일입니다.',
            html :
            `
            회원 인증 버튼을 누르시면 인증이 완료됩니다.<br/>
            <form action='${url}' method='post'>
              <button>회원 인증</button>
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