import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from './env'

const JWT_SECRET = env.JWT_SECRET

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export interface TokenPayload {
  userId: string
  platformUserId: string
  lawFirmId: string
  role: string
  iat?: number
  exp?: number
}

export function generateToken(payload: {
  userId: string
  platformUserId: string
  lawFirmId: string
  role: string
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload
    return payload
  } catch {
    return null
  }
}
