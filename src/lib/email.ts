// Email Service Provider (Resend) Wiring
// Purpose: Send transactional emails with templates and error logging

// Types for Resend API
interface ResendEmailData {
  from: string
  to: string[]
  subject: string
  html: string
  text?: string
  reply_to?: string[]
  cc?: string[]
  bcc?: string[]
  tags?: { name: string; value: string }[]
  headers?: Record<string, string>
}

interface ResendResponse {
  data?: { id: string }
  error?: { message: string }
}

interface ResendEmailsAPI {
  send: (data: ResendEmailData) => Promise<ResendResponse>
}

interface ResendClient {
  emails: ResendEmailsAPI
}

// Dynamic import for Resend to handle missing dependency gracefully
let ResendClass: new (apiKey: string) => ResendClient

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ResendClass = require('resend').Resend as new (apiKey: string) => ResendClient
} catch {
  console.warn('Resend not available - email functionality disabled')
  // Mock implementation for when Resend is not available
  ResendClass = class MockResend implements ResendClient {
    emails = {
      send: (): Promise<ResendResponse> => Promise.resolve({ data: { id: 'mock' } })
    }
  }
}

import { env } from './env'

// Initialize Resend client
const resend = new ResendClass(env.RESEND_API_KEY)

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
  from?: EmailAddress
  subject: string
  html: string
  text?: string
  replyTo?: EmailAddress
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  tags?: { name: string; value: string }[]
  headers?: Record<string, string>
}

export interface EmailResult {
  id: string
  success: boolean
  error?: string
}

// Template variable types for better type safety
export type TemplateVariables = Record<string, string | number | boolean | null | undefined>

// Default sender configuration
const DEFAULT_FROM = {
  email: env.FROM_EMAIL || 'noreply@example.com',
  name: env.FROM_NAME || 'Law Firm Platform'
}

// Email service class
export class EmailService {
  private static instance: EmailService
  private resend: ResendClient

  private constructor() {
    this.resend = resend
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  // Send email with error handling and logging
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Validate required fields
      if (!options.to || !options.subject || (!options.html && !options.text)) {
        throw new Error('Missing required email fields')
      }

      // Prepare email data
      const emailData: ResendEmailData = {
        from: options.from ? `${options.from.name} <${options.from.email}>` : `${DEFAULT_FROM.name} <${DEFAULT_FROM.email}>`,
        to: Array.isArray(options.to)
          ? options.to.map(addr => addr.name ? `${addr.name} <${addr.email}>` : addr.email)
          : [options.to.name ? `${options.to.name} <${options.to.email}>` : options.to.email],
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo ? [options.replyTo.name ? `${options.replyTo.name} <${options.replyTo.email}>` : options.replyTo.email] : undefined,
        cc: options.cc?.map(addr => addr.name ? `${addr.name} <${addr.email}>` : addr.email),
        bcc: options.bcc?.map(addr => addr.name ? `${addr.name} <${addr.email}>` : addr.email),
        tags: options.tags,
        headers: options.headers
      }

      // Send email via Resend
      const response = await this.resend.emails.send(emailData)

      if (response.error) {
        throw new Error(response.error.message)
      }

      // Log successful send
      console.log(`Email sent successfully: ${response.data?.id}`)

      return {
        id: response.data?.id || 'unknown',
        success: true
      }

    } catch (error) {
      console.error('Email send failed:', error)

      return {
        id: 'failed',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
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
        ...options
      })
    } catch (error) {
      console.error(`Template email failed for ${templateName}:`, error)
      return {
        id: 'failed',
        success: false,
        error: error instanceof Error ? error.message : 'Template error'
      }
    }
  }

  // Get email template with variable substitution
  private async getTemplate(templateName: string, variables: TemplateVariables): Promise<EmailTemplate> {
    const templates = getEmailTemplates()
    const template = templates[templateName]

    if (!template) {
      throw new Error(`Email template '${templateName}' not found`)
    }

    // Simple variable substitution
    const subject = this.replaceVariables(template.subject, variables)
    const html = this.replaceVariables(template.html, variables)
    const text = template.text ? this.replaceVariables(template.text, variables) : undefined

    return { subject, html, text }
  }

  // Simple variable replacement
  private replaceVariables(content: string, variables: TemplateVariables): string {
    let result = content
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      result = result.replace(new RegExp(placeholder, 'g'), String(value))
    })
    return result
  }

  // Test email configuration
  async testConfiguration(): Promise<{ success: boolean; error?: string }> {
    try {
      const testResult = await this.sendEmail({
        to: { email: 'test@example.com', name: 'Test User' },
        subject: 'Test Email Configuration',
        html: '<p>This is a test email to verify the email configuration.</p>',
        text: 'This is a test email to verify the email configuration.'
      })

      return {
        success: testResult.success,
        error: testResult.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Configuration test failed'
      }
    }
  }
}

// Email template definitions
function getEmailTemplates(): Record<string, EmailTemplate> {
  return {
    welcome: {
      subject: 'Welcome to {{firmName}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937;">Welcome to {{firmName}}</h1>
          <p>Hello {{userName}},</p>
          <p>Welcome to our law firm platform! Your account has been created and you can now access the system.</p>
          <p><strong>Your login details:</strong></p>
          <ul>
            <li>Email: {{userEmail}}</li>
            <li>Role: {{userRole}}</li>
          </ul>
          <p>
            <a href="{{loginUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Login to Platform
            </a>
          </p>
          <p>If you have any questions, please contact your administrator.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">This email was sent from {{firmName}} Law Management Platform.</p>
        </div>
      `,
      text: `Welcome to {{firmName}}

Hello {{userName}},

Welcome to our law firm platform! Your account has been created and you can now access the system.

Your login details:
- Email: {{userEmail}}
- Role: {{userRole}}

Login URL: {{loginUrl}}

If you have any questions, please contact your administrator.

This email was sent from {{firmName}} Law Management Platform.`
    },

    court_reminder: {
      subject: 'Court Date Reminder: {{caseTitle}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">⚖️ Court Date Reminder</h1>
          <p>Hello {{lawyerName}},</p>
          <p>This is a reminder for your upcoming court date:</p>
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #dc2626;">{{caseTitle}}</h3>
            <p style="margin: 4px 0;"><strong>Date:</strong> {{courtDate}}</p>
            <p style="margin: 4px 0;"><strong>Time:</strong> {{courtTime}}</p>
            <p style="margin: 4px 0;"><strong>Court:</strong> {{courtName}}</p>
            <p style="margin: 4px 0;"><strong>Judge:</strong> {{judgeName}}</p>
          </div>
          <p>
            <a href="{{caseUrl}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Case Details
            </a>
          </p>
          <p>Please ensure you are prepared for this hearing.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">This reminder was sent from {{firmName}} Law Management Platform.</p>
        </div>
      `,
      text: `Court Date Reminder: {{caseTitle}}

Hello {{lawyerName}},

This is a reminder for your upcoming court date:

Case: {{caseTitle}}
Date: {{courtDate}}
Time: {{courtTime}}
Court: {{courtName}}
Judge: {{judgeName}}

Case URL: {{caseUrl}}

Please ensure you are prepared for this hearing.

This reminder was sent from {{firmName}} Law Management Platform.`
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
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">This email was sent from {{firmName}} Law Management Platform.</p>
        </div>
      `,
      text: `Password Reset Request

Hello {{userName}},

We received a request to reset your password. If you made this request, use this link:

{{resetUrl}}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email.

This email was sent from {{firmName}} Law Management Platform.`
    },

    task_assignment: {
      subject: 'New Task Assignment: {{taskTitle}}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #059669;">📋 New Task Assignment</h1>
          <p>Hello {{assigneeName}},</p>
          <p>You have been assigned a new task:</p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 6px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #059669;">{{taskTitle}}</h3>
            <p style="margin: 4px 0;">{{taskDescription}}</p>
            <p style="margin: 4px 0;"><strong>Due Date:</strong> {{dueDate}}</p>
            <p style="margin: 4px 0;"><strong>Priority:</strong> {{priority}}</p>
            <p style="margin: 4px 0;"><strong>Assigned by:</strong> {{assignerName}}</p>
          </div>
          <p>
            <a href="{{taskUrl}}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Task
            </a>
          </p>
          <hr style="margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">This notification was sent from {{firmName}} Law Management Platform.</p>
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

This notification was sent from {{firmName}} Law Management Platform.`
    }
  }
}

// Convenience functions
export const emailService = EmailService.getInstance()

// Specific template variable types for better type safety
export interface WelcomeEmailVariables extends TemplateVariables {
  firmName: string
  userName: string
  userEmail: string
  userRole: string
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

// Quick send functions with proper typing
export async function sendWelcomeEmail(
  to: EmailAddress,
  variables: WelcomeEmailVariables
): Promise<EmailResult> {
  return emailService.sendTemplate('welcome', to, variables)
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