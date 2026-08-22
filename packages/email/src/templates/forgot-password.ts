export interface ForgotPasswordEmailProps {
  url: string;
  name?: string;
}

export function getForgotPasswordEmailHtml({ url, name }: ForgotPasswordEmailProps): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333333; margin-bottom: 20px;">Reset your password</h2>
      <p style="color: #555555; line-height: 1.5;">${greeting}</p>
      <p style="color: #555555; line-height: 1.5;">Someone recently requested a password change for your account. If this was you, you can set a new password here:</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${url}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Reset Password</a>
      </div>
      <p style="color: #555555; line-height: 1.5;">If the button doesn't work, you can also copy and paste the following link into your browser:</p>
      <p style="line-height: 1.5; word-break: break-all;"><a href="${url}" style="color: #0066cc;">${url}</a></p>
      <p style="color: #888888; font-size: 14px; margin-top: 30px;">If you don't want to change your password or didn't request this, just ignore and delete this message.</p>
    </div>
  `;
}
