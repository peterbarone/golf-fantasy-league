import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/golfers - Get all golfers
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') === 'true';
    
    // Fetch golfers with optional active filter
    const golfers = await prisma.golfer.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(golfers);
  } catch (error) {
    console.error('Error fetching golfers:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/golfers - Create a new golfer (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check for admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { name, pgaId, active } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Golfer name is required' },
        { status: 400 }
      );
    }
    
    // Create new golfer
    const golfer = await prisma.golfer.create({
      data: {
        name,
        pgaId: pgaId || `PGA-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        active: active ?? true,
      },
    });
    
    return NextResponse.json(golfer, { status: 201 });
  } catch (error) {
    console.error('Error creating golfer:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
