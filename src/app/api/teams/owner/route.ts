import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/teams/owner - Get the team of the currently logged-in owner
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Ensure user is an owner
    if (session.user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only team owners can access this resource' },
        { status: 403 }
      );
    }
    
    // Get the team for the logged-in user with roster details
    const team = await prisma.team.findUnique({
      where: { ownerId: session.user.id },
      include: {
        teamRoster: {
          include: {
            golfer: true,
          },
        },
      },
    });
    
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found for this user' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(team);
  } catch (error) {
    console.error('Error fetching owner team:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
