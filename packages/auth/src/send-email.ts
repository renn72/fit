import { env } from '@fit/env/server'

import { Resend } from 'resend'

const resend = new Resend(env.RESEND_API_KEY)

export const sendEmail = async ({ to, url }: { to: string; url: string }) => {
	console.log('----------- Sending email to', to)
	await resend.emails.send({
		from: 'Fit Support <fit@fit.wsys.au>', // Added a 'Friendly Name'
		to,
		subject: 'Verify your email address',
		// Plain text version is CRITICAL for spam filters
		text: `Please verify your email address by clicking this link: ${url}`,
		html: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .button {
          background-color: #000000;
          border: none;
          color: white !important;
          padding: 12px 24px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          border-radius: 5px;
          font-weight: bold;
        }
      </style>
    </head>
    <body style="font-family: sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; padding: 40px; border-radius: 8px; border: 1px solid #e0e0e0;">
              <tr>
                <td>
                  <h1 style="margin-top: 0; color: #1a1a1a;">Confirm your email</h1>
                  <p>Thanks for signing up! Please verify your email address to get full access to your account.</p>
                  
                  <div style="padding: 20px 0; text-align: center;">
                    <a href="${url}" class="button">Verify Email Address</a>
                  </div>
                  
                  <p style="font-size: 14px; color: #666;">
                    If the button doesn't work, copy and paste this link into your browser: <br>
                    <a href="${url}" style="color: #007bff; word-break: break-all;">${url}</a>
                  </p>
                  
                  <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                  
                  <p style="font-size: 12px; color: #999;">
                    If you didn't create an account, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
	})
}
