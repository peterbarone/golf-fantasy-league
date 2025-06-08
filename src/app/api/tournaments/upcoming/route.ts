import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/tournaments/upcoming - Get the nearest upcoming tournament
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
    
    // Get current date
    const now = new Date();
    
    // Find the nearest upcoming tournament or currently active tournament
    const upcomingTournament = await prisma.tournament.findFirst({
      where: {
        OR: [
          {
            startDate: {
              gte: now,
            },
          },
          {
            isActive: true,
          },
        ],
      },
      orderBy: {
        startDate: 'asc',
      },
    });
    
    if (!upcomingTournament) {
      return NextResponse.json(
        { message: 'No upcoming tournaments found' },
        { status: 404 }
      );
    }
    
    // If the user is an owner, add their lineup for this tournament
    let lineup = [];
    if (session.user.role === 'OWNER') {
      const team = await prisma.team.findUnique({
        where: { ownerId: session.user.id },
      });
      
      if (team) {
        lineup = await prisma.tournamentLineup.findMany({
          where: {
            teamId: team.id,
            tournamentId: upcomingTournament.id,
          },
          include: {
            golfer: true,
          },
        });
      }
    }
    
    return NextResponse.json({
      ...upcomingTournament,
      lineup,
    });
  } catch (error) {
    console.error('Error fetching upcoming tournament:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
