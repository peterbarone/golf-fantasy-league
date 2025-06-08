import { config } from '@/lib/auth';
import { type NextRequest } from 'next/server';
import { type Session } from 'next-auth';

export async function GET(request: NextRequest) {
  const session = await config.callbacks?.session?.({ session: {} as Session, token: {} });
  return Response.json(session);
}

export async function POST(request: NextRequest) {
  const session = await config.callbacks?.session?.({ session: {} as Session, token: {} });
  return Response.json(session);
}

export const runtime = 'nodejs';

