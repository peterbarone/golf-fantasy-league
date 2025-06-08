import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/tournaments/[id] - Get a specific tournament
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
    
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        tournamentLineups: {
          include: {
            team: true,
            golfer: true
          }
        },
        golferResults: {
          include: {
            golfer: true
          }
        },
        teamPoints: {
          include: {
            team: true
          }
        },
        tournamentSkins: true
      }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PATCH /api/tournaments/[id] - Update a tournament (admin only)
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
    const { name, startDate, endDate, isMajor, isWGC, isMatchPlay, isActive } = body;

    // Verify tournament exists
    const existingTournament = await prisma.tournament.findUnique({
      where: { id: params.id }
    });

    if (!existingTournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // If setting this tournament as active, deactivate any other active tournaments
    if (isActive) {
      await prisma.tournament.updateMany({
        where: {
          id: { not: params.id },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    // Update tournament
    const tournament = await prisma.tournament.update({
      where: { id: params.id },
      data: {
        name: name ?? undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isMajor: isMajor ?? undefined,
        isWGC: isWGC ?? undefined,
        isMatchPlay: isMatchPlay ?? undefined,
        isActive: isActive ?? undefined,
      },
    });
    
    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error updating tournament:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/tournaments/[id] - Delete a tournament (admin only)
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
    
    // Check for admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Verify tournament exists
    const existingTournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        tournamentLineups: true,
        golferResults: true,
        teamPoints: true,
      }
    });

    if (!existingTournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if tournament has any associated data
    if (
      existingTournament.tournamentLineups.length > 0 ||
      existingTournament.golferResults.length > 0 ||
      existingTournament.teamPoints.length > 0
    ) {
      return NextResponse.json(
        { error: 'Cannot delete tournament: it has associated lineups, results, or points' },
        { status: 400 }
      );
    }

    // Delete tournament and its skins (cascade will handle this)
    await prisma.tournament.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json(
      { message: 'Tournament deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
