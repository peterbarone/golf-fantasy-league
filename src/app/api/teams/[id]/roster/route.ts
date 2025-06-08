import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/teams/[id]/roster - Get team roster
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
    
    // Get team with roster
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
        teamRoster: {
          include: {
            golfer: true,
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
    console.error('Error fetching team roster:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/teams/[id]/roster - Add golfer to team roster (admin only)
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
    
    // Check for admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { golferId } = body;

    if (!golferId) {
      return NextResponse.json(
        { error: 'Golfer ID is required' },
        { status: 400 }
      );
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        teamRoster: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check roster limit (12 golfers max)
    if (team.teamRoster.length >= 12) {
      return NextResponse.json(
        { error: 'Team roster is full (12 golfers maximum)' },
        { status: 400 }
      );
    }

    // Check if golfer exists
    const golfer = await prisma.golfer.findUnique({
      where: { id: golferId },
    });

    if (!golfer) {
      return NextResponse.json(
        { error: 'Golfer not found' },
        { status: 404 }
      );
    }

    // Check if golfer is already on this team
    const existingRoster = await prisma.teamRoster.findUnique({
      where: {
        teamId_golferId: {
          teamId: params.id,
          golferId,
        },
      },
    });

    if (existingRoster) {
      return NextResponse.json(
        { error: 'Golfer is already on this team' },
        { status: 400 }
      );
    }

    // Add golfer to team roster
    const teamRoster = await prisma.teamRoster.create({
      data: {
        teamId: params.id,
        golferId,
      },
      include: {
        golfer: true,
      },
    });
    
    return NextResponse.json(teamRoster, { status: 201 });
  } catch (error) {
    console.error('Error adding golfer to team roster:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id]/roster/[golferId] - Remove golfer from team roster (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; golferId: string } }
) {
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

    // Check if roster entry exists
    const rosterEntry = await prisma.teamRoster.findUnique({
      where: {
        teamId_golferId: {
          teamId: params.id,
          golferId: params.golferId,
        },
      },
      include: {
        tournamentLineups: true,
      },
    });

    if (!rosterEntry) {
      return NextResponse.json(
        { error: 'Golfer is not on this team' },
        { status: 404 }
      );
    }

    // Check if golfer is in any tournament lineups
    if (rosterEntry.tournamentLineups.length > 0) {
      return NextResponse.json(
        { error: 'Cannot remove golfer: they are in tournament lineups' },
        { status: 400 }
      );
    }

    // Remove golfer from team roster
    await prisma.teamRoster.delete({
      where: {
        teamId_golferId: {
          teamId: params.id,
          golferId: params.golferId,
        },
      },
    });
    
    return NextResponse.json(
      { message: 'Golfer removed from team roster' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing golfer from team roster:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
