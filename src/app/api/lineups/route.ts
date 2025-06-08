import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/lineups - Get all tournament lineups, supports filtering by tournamentId
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
    
    const searchParams = request.nextUrl.searchParams;
    const tournamentId = searchParams.get('tournamentId');
    const teamId = searchParams.get('teamId');
    
    // Build the query based on provided parameters
    const query: any = {};
    
    if (tournamentId) {
      query.tournamentId = tournamentId;
    }
    
    // Team owners can only see their own lineups unless they're viewing a specific tournament
    // Admins can see all lineups
    if (session.user.role === 'OWNER' && !tournamentId) {
      const team = await prisma.team.findUnique({
        where: { ownerId: session.user.id },
      });
      
      if (!team) {
        return NextResponse.json(
          { error: 'Team not found for this user' },
          { status: 404 }
        );
      }
      
      query.teamId = team.id;
    } else if (teamId && (session.user.role === 'ADMIN' || tournamentId)) {
      query.teamId = teamId;
    }
    
    // Fetch lineups based on filters
    const lineups = await prisma.tournamentLineup.findMany({
      where: query,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        },
        golfer: true,
        tournament: {
          select: {
            name: true,
            startDate: true,
            endDate: true,
            isActive: true,
          }
        }
      },
    });
    
    return NextResponse.json(lineups);
  } catch (error) {
    console.error('Error fetching lineups:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/lineups - Submit a tournament lineup (owner for own team, admin for any)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { tournamentId, golferIds, teamId } = body;
    
    if (!tournamentId || !golferIds || !Array.isArray(golferIds)) {
      return NextResponse.json(
        { error: 'Tournament ID and an array of golfer IDs are required' },
        { status: 400 }
      );
    }
    
    if (golferIds.length > 6) {
      return NextResponse.json(
        { error: 'Maximum of 6 golfers allowed per tournament lineup' },
        { status: 400 }
      );
    }
    
    // Get the tournament to check if it's still accepting lineups
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }
    
    // Check if tournament has started
    const now = new Date();
    if (new Date(tournament.startDate) <= now) {
      return NextResponse.json(
        { error: 'Lineup submissions are closed for this tournament' },
        { status: 400 }
      );
    }
    
    // Determine which team's lineup to submit
    let targetTeamId: string;
    
    if (session.user.role === 'ADMIN' && teamId) {
      // Admins can submit lineups for any team
      const team = await prisma.team.findUnique({
        where: { id: teamId },
      });
      
      if (!team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }
      
      targetTeamId = team.id;
    } else if (session.user.role === 'OWNER') {
      // Owners can only submit lineups for their own team
      const team = await prisma.team.findUnique({
        where: { ownerId: session.user.id },
      });
      
      if (!team) {
        return NextResponse.json(
          { error: 'Team not found for this user' },
          { status: 404 }
        );
      }
      
      targetTeamId = team.id;
    } else {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Ensure all golfers are in the team's roster
    const roster = await prisma.teamRoster.findMany({
      where: {
        teamId: targetTeamId,
        golferId: {
          in: golferIds,
        },
      },
    });
    
    if (roster.length !== golferIds.length) {
      return NextResponse.json(
        { error: 'All golfers must be part of this team\'s roster' },
        { status: 400 }
      );
    }
    
    // Delete any existing lineup entries for this team and tournament
    await prisma.tournamentLineup.deleteMany({
      where: {
        teamId: targetTeamId,
        tournamentId,
      },
    });
    
    // Create new lineup entries
    const lineupEntries = golferIds.map(golferId => ({
      teamId: targetTeamId,
      tournamentId,
      golferId,
    }));
    
    await prisma.tournamentLineup.createMany({
      data: lineupEntries,
    });
    
    return NextResponse.json(
      { message: 'Lineup submitted successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting lineup:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
