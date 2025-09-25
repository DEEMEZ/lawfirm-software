// Email Service Library
// Purpose: Send transactional emails via Resend or Nodemailer with template support

import * as nodemailer from 'nodemailer'
import { env } from './env'

// Email provider types
type EmailProvider = 'resend' | 'nodemailer'

// Resend API types and interfaces
interface ResendResponse {
  data?: { id: string }
  error?: { message: string }
}

interface ResendEmailData {
  from: string
  to: string[]
  subject: string
  html?: string
  text?: string
  reply_to?: string[]
  cc?: string[]
  bcc?: string[]
  tags?: Record<string, string>
  headers?: Record<string, string>
}

interface ResendClient {
  emails: {
    send: (data: ResendEmailData) => Promise<ResendResponse>
  }
}

// Dynamically import Resend to avoid build errors when not available
let ResendClass: new (apiKey?: string) => ResendClient
let resendClient: ResendClient | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const resendModule = require('resend')
  ResendClass = resendModule.Resend
  if (env.RESEND_API_KEY) {
    resendClient = new ResendClass(env.RESEND_API_KEY)
  }
} catch {
  console.warn('Resend not available - using Nodemailer fallback')
}

// Nodemailer transporter
let nodemailerTransporter: nodemailer.Transporter | null = null

if (env.EMAIL_SERVICE && env.EMAIL_USERNAME && env.EMAIL_PASSWORD) {
  try {
    console.log(
      `Initializing Nodemailer with service: ${env.EMAIL_SERVICE}, username: ${env.EMAIL_USERNAME}`
    )
    nodemailerTransporter = nodemailer.createTransport({
      service: env.EMAIL_SERVICE,
      auth: {
        user: env.EMAIL_USERNAME,
        pass: env.EMAIL_PASSWORD,
      },
    })
    console.log('✅ Nodemailer transporter initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize Nodemailer:', error)
  }
} else {
  console.warn(
    '⚠️ Nodemailer not initialized - missing EMAIL_SERVICE, EMAIL_USERNAME, or EMAIL_PASSWORD'
  )
  console.log('Available env vars:', {
    EMAIL_SERVICE: !!env.EMAIL_SERVICE,
    EMAIL_USERNAME: !!env.EMAIL_USERNAME,
    EMAIL_PASSWORD: !!env.EMAIL_PASSWORD,
  })
}

// Email configuration types
export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export interface EmailAddress {
  email: string
  name?: string
}

export interface EmailOptions {
  to: EmailAddress | EmailAddress[]
  subject: string
  html?: string
  text?: string
  from?: EmailAddress
  replyTo?: EmailAddress
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  tags?: Record<string, string>
  headers?: Record<string, string>
}

export interface EmailResult {
  id: string
  success: boolean
  error?: string
  provider: EmailProvider
}

// Template variable types for better type safety
export type TemplateVariables = Record<
  string,
  string | number | boolean | null | undefined
>

// Default sender configuration
const getDefaultFrom = (): EmailAddress => ({
  email: env.EMAIL_FROM || env.FROM_EMAIL,
  name: env.FROM_NAME,
})

// Email service class
export class EmailService {
  private static instance: EmailService

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  // Determine which provider to use
  private getProvider(): EmailProvider {
    if (resendClient) return 'resend'
    if (nodemailerTransporter) return 'nodemailer'
    throw new Error('No email provider configured')
  }

  // Send email using the configured provider with fallback
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    let lastError: Error | null = null

    // Try Resend first if available
    if (resendClient) {
      try {
        console.log('Attempting to send email via Resend...')
        const result = await this.sendWithResend(options)
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Resend failed')
        console.warn(
          'Resend failed, falling back to Nodemailer:',
          lastError.message
        )
      }
    }

    // Fallback to Nodemailer if available
    if (nodemailerTransporter) {
      try {
        console.log('Attempting to send email via Nodemailer...')
        const result = await this.sendWithNodemailer(options)
        return result
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error('Nodemailer failed')
        console.error('Nodemailer also failed:', lastError.message)
      }
    }

    // Both providers failed or none available
    const errorMessage = lastError
      ? lastError.message
      : 'No email providers configured'
    console.error('All email providers failed:', errorMessage)

    return {
      id: 'failed',
      success: false,
      error: errorMessage,
      provider: 'unknown' as EmailProvider,
    }
  }

  // Send email via Resend
  private async sendWithResend(options: EmailOptions): Promise<EmailResult> {
    if (!resendClient) {
      throw new Error('Resend client not initialized')
    }

    // Validate required fields
    if (!options.to || !options.subject || (!options.html && !options.text)) {
      throw new Error('Missing required email fields')
    }

    // Prepare email data
    const emailData: ResendEmailData = {
      from: options.from
        ? `${options.from.name} <${options.from.email}>`
        : `${getDefaultFrom().name} <${getDefaultFrom().email}>`,
      to: Array.isArray(options.to)
        ? options.to.map(addr =>
            addr.name ? `${addr.name} <${addr.email}>` : addr.email
          )
        : [
            options.to.name
              ? `${options.to.name} <${options.to.email}>`
              : options.to.email,
          ],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo
        ? [
            options.replyTo.name
              ? `${options.replyTo.name} <${options.replyTo.email}>`
              : options.replyTo.email,
          ]
        : undefined,
      cc: options.cc?.map(addr =>
        addr.name ? `${addr.name} <${addr.email}>` : addr.email
      ),
      bcc: options.bcc?.map(addr =>
        addr.name ? `${addr.name} <${addr.email}>` : addr.email
      ),
      tags: options.tags,
      headers: options.headers,
    }

    // Send email via Resend
    const response = await resendClient.emails.send(emailData)

    if (response.error) {
      throw new Error(response.error.message)
    }

    console.log(`Email sent via Resend: ${response.data?.id}`)

    return {
      id: response.data?.id || 'unknown',
      success: true,
      provider: 'resend',
    }
  }

  // Send email via Nodemailer
  private async sendWithNodemailer(
    options: EmailOptions
  ): Promise<EmailResult> {
    if (!nodemailerTransporter) {
      throw new Error('Nodemailer transporter not initialized')
    }

    // Validate required fields
    if (!options.to || !options.subject || (!options.html && !options.text)) {
      throw new Error('Missing required email fields')
    }

    const defaultFrom = getDefaultFrom()

    // Prepare email data for Nodemailer
    const emailData = {
      from: options.from
        ? options.from.name
          ? `"${options.from.name}" <${options.from.email}>`
          : options.from.email
        : defaultFrom.name
          ? `"${defaultFrom.name}" <${defaultFrom.email}>`
          : defaultFrom.email,
      to: Array.isArray(options.to)
        ? options.to
            .map(addr =>
              addr.name ? `"${addr.name}" <${addr.email}>` : addr.email
            )
            .join(', ')
        : options.to.name
          ? `"${options.to.name}" <${options.to.email}>`
          : options.to.email,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo
        ? options.replyTo.name
          ? `"${options.replyTo.name}" <${options.replyTo.email}>`
          : options.replyTo.email
        : undefined,
      cc: options.cc
        ?.map(addr =>
          addr.name ? `"${addr.name}" <${addr.email}>` : addr.email
        )
        .join(', '),
      bcc: options.bcc
        ?.map(addr =>
          addr.name ? `"${addr.name}" <${addr.email}>` : addr.email
        )
        .join(', '),
      headers: options.headers,
    }

    // Send email via Nodemailer
    const result = await nodemailerTransporter.sendMail(emailData)

    console.log(`Email sent via Nodemailer: ${result.messageId}`)

    return {
      id: result.messageId,
      success: true,
      provider: 'nodemailer',
    }
  }

  // Send templated email
  async sendTemplate(
    templateName: string,
    to: EmailAddress | EmailAddress[],
    variables: TemplateVariables,
    options?: Partial<EmailOptions>
  ): Promise<EmailResult> {
    try {
      const template = await this.getTemplate(templateName, variables)

      return this.sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        ...options,
      })
    } catch (error) {
      console.error(`Template email failed for ${templateName}:`, error)
      return {
        id: 'failed',
        success: false,
        error: error instanceof Error ? error.message : 'Template error',
        provider: 'unknown' as EmailProvider,
      }
    }
  }

  // Get email template with variable substitution
  private async getTemplate(
    templateName: string,
    variables: TemplateVariables
  ): Promise<EmailTemplate> {
    const templates = getEmailTemplates()
    const template = templates[templateName]

    if (!template) {
      throw new Error(`Email template '${templateName}' not found`)
    }

    // Simple variable substitution
    const subject = this.replaceVariables(template.subject, variables)
    const html = this.replaceVariables(template.html, variables)
    const text = template.text
      ? this.replaceVariables(template.text, variables)
      : undefined

    return { subject, html, text }
  }

  // Simple variable replacement
  private replaceVariables(
    content: string,
    variables: TemplateVariables
  ): string {
    let result = content
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      result = result.replace(new RegExp(placeholder, 'g'), String(value))
    })
    return result
  }

  // Test email configuration
  async testConfiguration(): Promise<{
    success: boolean
    error?: string
    provider: EmailProvider
  }> {
    try {
      const provider = this.getProvider()
      const testResult = await this.sendEmail({
        to: { email: 'test@example.com', name: 'Test User' },
        subject: 'Test Email Configuration',
        html: '<p>This is a test email to verify the email configuration.</p>',
        text: 'This is a test email to verify the email configuration.',
      })

      return {
        success: testResult.success,
        error: testResult.error,
        provider,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Configuration test failed',
        provider: 'unknown' as EmailProvider,
      }
    }
  }
}

// Email template definitions
function getEmailTemplates(): Record<string, EmailTemplate> {
  return {
    welcome: {
      subject: 'Welcome to {{firmName}} Law Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937;">Welcome to {{firmName}}!</h1>
          <p>Hello {{userName}},</p>
          <p>Your account has been created successfully. You can now access the law management system.</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin-top: 0; color: #374151;">Your login details:</h3>
            <p><strong>Email:</strong> {{userEmail}}</p>
            <p><strong>Role:</strong> {{userRole}}</p>
          </div>
          <p>
            <a href="{{loginUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Login Now
            </a>
          </p>
          <p>If you have any questions, please contact your administrator.</p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This email was sent from {{firmName}} Law Management Platform.
          </p>
        </div>
      `,
      text: `Welcome to {{firmName}} Law Management System!

Hello {{userName}},

Your account has been created successfully. You can now access the law management system.

Your login details:
- Email: {{userEmail}}
- Role: {{userRole}}

Login URL: {{loginUrl}}

If you have any questions, please contact your administrator.

This email was sent from {{firmName}} Law Management Platform.`,
    },

    law_firm_created: {
      subject: 'Your Law Firm Account Has Been Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #059669;">🏛️ Law Firm Account Created</h1>
          <p>Hello {{ownerFirstName}} {{ownerLastName}},</p>
          <p>Your law firm account has been successfully created by the platform administrator.</p>

          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin-top: 0; color: #1e40af;">Firm Details:</h3>
            <p><strong>Firm Name:</strong> {{firmName}}</p>
            <p><strong>Plan:</strong> {{plan}}</p>
            {{#domain}}<p><strong>Domain:</strong> {{domain}}</p>{{/domain}}
          </div>

          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #92400e;">Your Owner Account:</h3>
            <p><strong>Email:</strong> {{ownerEmail}}</p>
            <p><strong>Password:</strong> {{ownerPassword}}</p>
            <p><strong>Role:</strong> Firm Owner</p>
            <p style="font-size: 14px; color: #92400e;">
              <strong>Important:</strong> Please change your password after first login.
            </p>
          </div>

          <p>
            <a href="{{loginUrl}}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Login to Your Account
            </a>
          </p>

          <p>Welcome to the platform! You can now start managing your law firm.</p>

          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This email was sent from the Law Firm Management Platform.
          </p>
        </div>
      `,
      text: `Your Law Firm Account Has Been Created

Hello {{ownerFirstName}} {{ownerLastName}},

Your law firm account has been successfully created by the platform administrator.

Firm Details:
- Name: {{firmName}}
- Plan: {{plan}}
{{#domain}}
- Domain: {{domain}}
{{/domain}}

Your Owner Account:
- Email: {{ownerEmail}}
- Password: {{ownerPassword}}
- Role: Firm Owner

IMPORTANT: Please change your password after first login.

Login URL: {{loginUrl}}

Welcome to the platform! You can now start managing your law firm.

This email was sent from the Law Firm Management Platform.`,
    },

    court_reminder: {
      subject: 'Court Date Reminder: {{caseTitle}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">⚖️ Court Date Reminder</h1>
          <p>Hello {{lawyerName}},</p>
          <p>This is a reminder about your upcoming court date:</p>
          <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #991b1b;">{{caseTitle}}</h3>
            <p><strong>Date:</strong> {{courtDate}}</p>
            <p><strong>Time:</strong> {{courtTime}}</p>
            <p><strong>Court:</strong> {{courtName}}</p>
            <p><strong>Judge:</strong> {{judgeName}}</p>
          </div>
          <p>
            <a href="{{caseUrl}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Case Details
            </a>
          </p>
          <p>Please ensure you are prepared for this hearing.</p>
        </div>
      `,
      text: `Court Date Reminder: {{caseTitle}}

Hello {{lawyerName}},

This is a reminder about your upcoming court date:

Case: {{caseTitle}}
Date: {{courtDate}}
Time: {{courtTime}}
Court: {{courtName}}
Judge: {{judgeName}}

Case URL: {{caseUrl}}

Please ensure you are prepared for this hearing.

This reminder was sent from {{firmName}} Law Management Platform.`,
    },

    password_reset: {
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937;">Password Reset Request</h1>
          <p>Hello {{userName}},</p>
          <p>We received a request to reset your password. If you made this request, click the button below:</p>
          <p>
            <a href="{{resetUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Reset Password
            </a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            This link will expire in 1 hour for security reasons.
          </p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
      `,
      text: `Password Reset Request

Hello {{userName}},

We received a request to reset your password. If you made this request, use this link:

{{resetUrl}}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email.

This email was sent from {{firmName}} Law Management Platform.`,
    },

    task_assignment: {
      subject: 'New Task Assignment: {{taskTitle}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #059669;">📋 New Task Assignment</h1>
          <p>Hello {{assigneeName}},</p>
          <p>You have been assigned a new task:</p>
          <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #059669;">
            <h3 style="margin-top: 0; color: #047857;">{{taskTitle}}</h3>
            <p><strong>Description:</strong> {{taskDescription}}</p>
            <p><strong>Due Date:</strong> {{dueDate}}</p>
            <p><strong>Priority:</strong> {{priority}}</p>
            <p><strong>Assigned by:</strong> {{assignerName}}</p>
          </div>
          <p>
            <a href="{{taskUrl}}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Task
            </a>
          </p>
        </div>
      `,
      text: `New Task Assignment: {{taskTitle}}

Hello {{assigneeName}},

You have been assigned a new task:

Title: {{taskTitle}}
Description: {{taskDescription}}
Due Date: {{dueDate}}
Priority: {{priority}}
Assigned by: {{assignerName}}

Task URL: {{taskUrl}}

This notification was sent from {{firmName}} Law Management Platform.`,
    },
  }
}

// Convenience functions
export const emailService = EmailService.getInstance()

// Specific template variable types for better type safety
export interface WelcomeEmailVariables extends TemplateVariables {
  userName: string
  userEmail: string
  userRole: string
  firmName: string
  loginUrl: string
}

export interface LawFirmCreatedEmailVariables extends TemplateVariables {
  ownerFirstName: string
  ownerLastName: string
  ownerEmail: string
  ownerPassword: string
  firmName: string
  plan: string
  domain?: string
  loginUrl: string
}

export interface CourtReminderVariables extends TemplateVariables {
  lawyerName: string
  caseTitle: string
  courtDate: string
  courtTime: string
  courtName: string
  judgeName: string
  caseUrl: string
  firmName: string
}

export interface PasswordResetVariables extends TemplateVariables {
  userName: string
  resetUrl: string
  firmName: string
}

export interface TaskAssignmentVariables extends TemplateVariables {
  assigneeName: string
  taskTitle: string
  taskDescription: string
  dueDate: string
  priority: string
  assignerName: string
  taskUrl: string
  firmName: string
}

// Template-specific functions
export async function sendWelcomeEmail(
  to: EmailAddress,
  variables: WelcomeEmailVariables
): Promise<EmailResult> {
  return emailService.sendTemplate('welcome', to, variables)
}

export async function sendLawFirmCreatedEmail(
  to: EmailAddress,
  variables: LawFirmCreatedEmailVariables
): Promise<EmailResult> {
  return emailService.sendTemplate('law_firm_created', to, variables)
}

export async function sendCourtReminder(
  to: EmailAddress,
  variables: CourtReminderVariables
): Promise<EmailResult> {
  return emailService.sendTemplate('court_reminder', to, variables)
}

export async function sendPasswordReset(
  to: EmailAddress,
  variables: PasswordResetVariables
): Promise<EmailResult> {
  return emailService.sendTemplate('password_reset', to, variables)
}

export async function sendTaskAssignment(
  to: EmailAddress,
  variables: TaskAssignmentVariables
): Promise<EmailResult> {
  return emailService.sendTemplate('task_assignment', to, variables)
}
