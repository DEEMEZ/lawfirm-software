import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  // Email configuration
  RESEND_API_KEY: z
    .string()
    .min(1, 'RESEND_API_KEY is required for email functionality'),
  FROM_EMAIL: z.string().email().default('noreply@lawfirm.example.com'),
  FROM_NAME: z.string().default('Law Firm Platform'),

  // Storage configuration (optional)
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
})

function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues || []

      const missingVars = issues
        .filter(
          err =>
            err.code === 'invalid_type' &&
            (err as { received?: string }).received === 'undefined'
        )
        .map(err => err.path.join('.'))

      const invalidVars = issues
        .filter(
          err =>
            err.code !== 'invalid_type' ||
            (err as { received?: string }).received !== 'undefined'
        )
        .map(err => `${err.path.join('.')}: ${err.message}`)

      let errorMessage = '❌ Environment validation failed:\n\n'

      if (missingVars.length > 0) {
        errorMessage += `Missing required environment variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}\n\n`
      }

      if (invalidVars.length > 0) {
        errorMessage += `Invalid environment variables:\n${invalidVars.map(v => `  - ${v}`).join('\n')}\n\n`
      }

      errorMessage +=
        'Please check your .env file and ensure all required variables are set.\n'
      errorMessage += 'See .env.example for the required format.\n'

      throw new Error(errorMessage)
    }
    throw error
  }
}

export const env = validateEnv()

// Re-export for convenience
export type Env = z.infer<typeof envSchema>
