import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/teams/[id]/lineup - Get team's tournament lineup
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tournament ID from query params
    const searchParams = request.nextUrl.searchParams;
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }
    
    // Get team's tournament lineup
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tournamentLineups: {
          where: {
            tournamentId,
          },
          include: {
            golfer: true,
            tournament: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user is admin or team owner
    if (session.user.role !== 'ADMIN' && session.user.id !== team.ownerId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(team);
  } catch (error) {
    console.error('Error fetching team lineup:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/teams/[id]/lineup - Set team's tournament lineup
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tournamentId, golferIds } = body;

    if (!tournamentId || !golferIds || !Array.isArray(golferIds)) {
      return NextResponse.json(
        { error: 'Tournament ID and array of golfer IDs are required' },
        { status: 400 }
      );
    }

    // Check if tournament exists and is active
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (!tournament.isActive) {
      return NextResponse.json(
        { error: 'Tournament is not active' },
        { status: 400 }
      );
    }

    // Check if team exists and user has permission
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        teamRoster: true,
        tournamentLineups: {
          where: {
            tournamentId,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user is admin or team owner
    if (session.user.role !== 'ADMIN' && session.user.id !== team.ownerId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if lineup already exists
    if (team.tournamentLineups.length > 0) {
      return NextResponse.json(
        { error: 'Team lineup for this tournament already exists' },
        { status: 400 }
      );
    }

    // Check lineup size (4 golfers required)
    if (golferIds.length !== 4) {
      return NextResponse.json(
        { error: 'Team lineup must have exactly 4 golfers' },
        { status: 400 }
      );
    }

    // Check if all golfers are on team roster
    const rosterGolferIds = team.teamRoster.map(r => r.golferId);
    const invalidGolfers = golferIds.filter(id => !rosterGolferIds.includes(id));

    if (invalidGolfers.length > 0) {
      return NextResponse.json(
        { error: 'All golfers must be on team roster' },
        { status: 400 }
      );
    }

    // Create tournament lineup entries
    const lineupEntries = await prisma.$transaction(
      golferIds.map(golferId =>
        prisma.tournamentLineup.create({
          data: {
            teamId: params.id,
            tournamentId,
            golferId,
          },
          include: {
            golfer: true,
          },
        })
      )
    );
    
    return NextResponse.json(lineupEntries, { status: 201 });
  } catch (error) {
    console.error('Error setting team lineup:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id]/lineup - Remove team's tournament lineup
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tournament ID from query params
    const searchParams = request.nextUrl.searchParams;
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Check if tournament exists and is active
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (!tournament.isActive) {
      return NextResponse.json(
        { error: 'Tournament is not active' },
        { status: 400 }
      );
    }

    // Check if team exists and user has permission
    const team = await prisma.team.findUnique({
      where: { id: params.id },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user is admin or team owner
    if (session.user.role !== 'ADMIN' && session.user.id !== team.ownerId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete tournament lineup
    await prisma.tournamentLineup.deleteMany({
      where: {
        teamId: params.id,
        tournamentId,
      },
    });
    
    return NextResponse.json(
      { message: 'Team lineup removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing team lineup:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
