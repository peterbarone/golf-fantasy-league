import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/tournaments/[id]/skins - Get tournament skins info
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
    
    // Get tournament skins info
    const skins = await prisma.tournamentSkins.findUnique({
      where: { tournamentId: params.id },
      include: {
        tournament: {
          include: {
            tournamentLineups: {
              include: {
                team: true,
                golfer: true,
              },
            },
          },
        },
      },
    });

    if (!skins) {
      return NextResponse.json(
        { error: 'Tournament skins not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(skins);
  } catch (error) {
    console.error('Error fetching tournament skins:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PATCH /api/tournaments/[id]/skins - Update tournament skins (admin only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { skinValue, carryOver } = body;

    if (typeof skinValue !== 'number' || typeof carryOver !== 'boolean') {
      return NextResponse.json(
        { error: 'Skin value and carryOver status are required' },
        { status: 400 }
      );
    }

    // Verify tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        tournamentSkins: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (!tournament.tournamentSkins) {
      return NextResponse.json(
        { error: 'Tournament skins entry not found' },
        { status: 404 }
      );
    }

    // Update skins
    const skins = await prisma.tournamentSkins.update({
      where: { tournamentId: params.id },
      data: {
        skinValue,
        carryOver,
      },
    });
    
    return NextResponse.json(skins);
  } catch (error) {
    console.error('Error updating tournament skins:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/tournaments/[id]/skins/calculate - Calculate skins value based on team participation (admin only)
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

    // Get tournament with lineups
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        tournamentLineups: {
          include: {
            team: true,
          },
        },
        tournamentSkins: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (!tournament.tournamentSkins) {
      return NextResponse.json(
        { error: 'Tournament skins entry not found' },
        { status: 404 }
      );
    }

    type TournamentLineup = typeof tournament.tournamentLineups[number];

    // Get unique teams participating
    const participatingTeams = new Set(
      tournament.tournamentLineups.map((lineup: TournamentLineup) => lineup.teamId)
    );

    // Calculate skins value ($10 per team)
    const baseValue = participatingTeams.size * 10;

    // Add carry over amount if applicable
    const totalValue = tournament.tournamentSkins.carryOver 
      ? baseValue + tournament.tournamentSkins.skinValue
      : baseValue;

    // Update skins value
    const skins = await prisma.tournamentSkins.update({
      where: { tournamentId: params.id },
      data: {
        skinValue: totalValue,
      },
    });
    
    return NextResponse.json(skins);
  } catch (error) {
    console.error('Error calculating tournament skins:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
