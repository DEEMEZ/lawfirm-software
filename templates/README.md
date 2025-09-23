# Email Templates

This folder contains email templates for the Law Firm Platform.

## Available Templates

### 1. Welcome Email (`welcome`)
Sent when a new user is added to a law firm.

**Variables:**
- `firmName` - Name of the law firm
- `userName` - Name of the new user
- `userEmail` - Email address of the new user
- `userRole` - Role assigned to the user
- `loginUrl` - URL to login to the platform

### 2. Court Date Reminder (`court_reminder`)
Sent to remind lawyers of upcoming court dates.

**Variables:**
- `lawyerName` - Name of the lawyer
- `caseTitle` - Title/name of the case
- `courtDate` - Date of the court hearing
- `courtTime` - Time of the court hearing
- `courtName` - Name of the court
- `judgeName` - Name of the judge
- `caseUrl` - URL to view case details
- `firmName` - Name of the law firm

### 3. Password Reset (`password_reset`)
Sent when a user requests a password reset.

**Variables:**
- `userName` - Name of the user
- `resetUrl` - URL to reset the password
- `firmName` - Name of the law firm

### 4. Task Assignment (`task_assignment`)
Sent when a new task is assigned to a user.

**Variables:**
- `assigneeName` - Name of the user assigned the task
- `taskTitle` - Title of the task
- `taskDescription` - Description of the task
- `dueDate` - Due date for the task
- `priority` - Priority level of the task
- `assignerName` - Name of the user who assigned the task
- `taskUrl` - URL to view task details
- `firmName` - Name of the law firm

## Template System

Templates are defined in `src/lib/email.ts` and support simple variable substitution using `{{variableName}}` syntax.

## Testing

Use the `/api/email/test` endpoint to test email templates:

```bash
# Test basic email
POST /api/email/test
{
  "type": "basic",
  "recipient": {
    "email": "test@example.com",
    "name": "Test User"
  }
}

# Test welcome email template
POST /api/email/test
{
  "type": "welcome",
  "recipient": {
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

## Configuration

Email configuration is managed through environment variables:

- `RESEND_API_KEY` - Resend API key (required)
- `FROM_EMAIL` - Default sender email address
- `FROM_NAME` - Default sender name

See `.env.example` for the complete configuration.