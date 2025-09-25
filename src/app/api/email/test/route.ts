// Email Test API Route
// Purpose: Test email configuration and send test emails

import { NextRequest, NextResponse } from 'next/server'
import {
  emailService,
  sendWelcomeEmail,
  sendCourtReminder,
  sendLawFirmCreatedEmail,
  LawFirmCreatedEmailVariables,
} from '@/lib/email'
import { withRole } from '@/lib/auth-guards'
import { ROLES } from '@/lib/rbac'

// POST /api/email/test - Test email configuration
export const POST = withRole(
  ROLES.SUPER_ADMIN,
  async (request: NextRequest) => {
    try {
      const body = await request.json()
      const { type = 'basic', recipient } = body

      if (!recipient || !recipient.email) {
        return NextResponse.json(
          { error: 'Recipient email is required' },
          { status: 400 }
        )
      }

      let result

      switch (type) {
        case 'basic':
          // Send basic test email
          result = await emailService.sendEmail({
            to: {
              email: recipient.email,
              name: recipient.name || 'Test User',
            },
            subject: 'Email Configuration Test',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #3b82f6;">Email Configuration Test</h1>
              <p>Hello,</p>
              <p>This is a test email to verify that the email configuration is working correctly.</p>
              <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="margin: 0 0 8px 0;">Test Details:</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Email Provider: Resend</li>
                  <li>Template: Basic Test</li>
                  <li>Sent At: ${new Date().toISOString()}</li>
                  <li>Environment: ${process.env.NODE_ENV}</li>
                </ul>
              </div>
              <p>If you received this email, the configuration is working properly!</p>
              <hr style="margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px;">This is an automated test email from the Law Firm Platform.</p>
            </div>
          `,
            text: `Email Configuration Test

Hello,

This is a test email to verify that the email configuration is working correctly.

Test Details:
- Email Provider: Resend
- Template: Basic Test
- Sent At: ${new Date().toISOString()}
- Environment: ${process.env.NODE_ENV}

If you received this email, the configuration is working properly!

This is an automated test email from the Law Firm Platform.`,
          })
          break

        case 'welcome':
          // Send welcome email template test
          result = await sendWelcomeEmail(
            {
              email: recipient.email,
              name: recipient.name || 'Test User',
            },
            {
              firmName: 'Test Law Firm',
              userName: recipient.name || 'Test User',
              userEmail: recipient.email,
              userRole: 'Test Role',
              loginUrl: 'https://example.com/login',
            }
          )
          break

        case 'court_reminder':
          // Send court reminder template test
          result = await sendCourtReminder(
            {
              email: recipient.email,
              name: recipient.name || 'Test Lawyer',
            },
            {
              lawyerName: recipient.name || 'Test Lawyer',
              caseTitle: 'Test Case vs. Example Client',
              courtDate: 'January 15, 2024',
              courtTime: '9:00 AM',
              courtName: 'Superior Court of Test County',
              judgeName: 'Hon. Test Judge',
              caseUrl: 'https://example.com/cases/test-case',
              firmName: 'Test Law Firm',
            }
          )
          break

        case 'law_firm_created':
          // Send law firm created email template test
          const variables: LawFirmCreatedEmailVariables = {
            ownerFirstName: 'Test',
            ownerLastName: 'Owner',
            ownerEmail: recipient.email,
            ownerPassword: 'test123456',
            firmName: 'Test Law Firm',
            plan: 'STARTER',
            domain: 'test.lawfirm.com',
            loginUrl:
              process.env.NEXTAUTH_URL || 'http://localhost:3000/auth/login',
          }

          result = await sendLawFirmCreatedEmail(
            {
              email: recipient.email,
              name: recipient.name || 'Test Owner',
            },
            variables
          )
          break

        default:
          return NextResponse.json(
            {
              error:
                'Invalid test type. Use: basic, welcome, court_reminder, or law_firm_created',
            },
            { status: 400 }
          )
      }

      // Log the result for debugging
      console.log(`Email test result (${type}):`, result)

      if (result.success) {
        return NextResponse.json({
          message: `Test email (${type}) sent successfully`,
          emailId: result.id,
          recipient: recipient.email,
          type,
        })
      } else {
        return NextResponse.json(
          {
            error: `Failed to send test email: ${result.error}`,
            type,
          },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('Email test failed:', error)
      return NextResponse.json(
        {
          error: 'Email test failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  }
)

// GET /api/email/test - Check email configuration
export const GET = withRole(ROLES.SUPER_ADMIN, async () => {
  try {
    // Test email service configuration
    const configTest = await emailService.testConfiguration()

    const configuration = {
      resend: {
        configured: !!process.env.RESEND_API_KEY,
        apiKey: process.env.RESEND_API_KEY
          ? '***configured***'
          : 'not configured',
      },
      nodemailer: {
        configured: !!(
          process.env.EMAIL_SERVICE &&
          process.env.EMAIL_USERNAME &&
          process.env.EMAIL_PASSWORD
        ),
        service: process.env.EMAIL_SERVICE || 'not configured',
        username: process.env.EMAIL_USERNAME
          ? '***configured***'
          : 'not configured',
      },
      fallbackOrder: ['resend', 'nodemailer'],
      fromEmail:
        process.env.EMAIL_FROM ||
        process.env.FROM_EMAIL ||
        'noreply@lawfirm.example.com',
      fromName: process.env.FROM_NAME || 'Law Firm Platform',
      environment: process.env.NODE_ENV,
    }

    return NextResponse.json({
      message: 'Email configuration status',
      configuration,
      testResult: configTest,
      availableTemplates: [
        'welcome',
        'court_reminder',
        'law_firm_created',
        'password_reset',
        'task_assignment',
      ],
    })
  } catch (error) {
    console.error('Email configuration check failed:', error)
    return NextResponse.json(
      { error: 'Failed to check email configuration' },
      { status: 500 }
    )
  }
})
