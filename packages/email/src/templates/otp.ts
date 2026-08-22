export const renderOtpEmail = (code: string, name: string = "User") => {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #333;">Verify your email address</h2>
      <p style="color: #555; font-size: 16px;">Hello ${name},</p>
      <p style="color: #555; font-size: 16px;">Please use the following verification code to complete your registration:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; padding: 10px 20px; background-color: #f8f9fa; border-radius: 5px; border: 1px dashed #007bff;">
          ${code}
        </span>
      </div>
      <p style="color: #555; font-size: 14px;">This code will expire in 10 minutes.</p>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      <p style="color: #888; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
};
