import { createEmailService } from "@dipantauin/email";
import { env } from "./env.js";

export const email = createEmailService({
  apiKey: env.RESEND_API_KEY,
  from: env.EMAIL_FROM,
});