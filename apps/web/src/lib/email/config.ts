import { Resend } from 'resend'

// Initialize Resend only if API key is available
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export const EMAIL_CONFIG = {
  // Use Resend testing email until giddyapp.com domain is verified
  from: 'GiddyApp <onboarding@resend.dev>',
  replyTo: 'support@giddyapp.com',
} as const
