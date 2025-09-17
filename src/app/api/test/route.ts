import { NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()

    // Run a simple query
    const result = await client.query('SELECT NOW()')

    return NextResponse.json({
      success: true,
      message: 'Database connected successfully!',
      serverTime: result.rows[0].now,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}
