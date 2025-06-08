import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/teams - Get all teams (admin only)
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
    
    // Check for admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get all teams with their owners and roster count
    const teams = await prisma.team.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        teamRoster: {
          include: {
            golfer: true,
          },
        },
      },
    });
    
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team (admin only)
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
    const { name, ownerId } = body;
    
    if (!name || !ownerId) {
      return NextResponse.json(
        { error: 'Team name and owner ID are required' },
        { status: 400 }
      );
    }
    
    // Check if user exists and has no team yet
    const user = await prisma.user.findUnique({
      where: { id: ownerId },
      include: { team: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (user.team) {
      return NextResponse.json(
        { error: 'User already has a team' },
        { status: 400 }
      );
    }
    
    // Create new team
    const team = await prisma.team.create({
      data: {
        name,
        ownerId,
      },
    });
    
    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
