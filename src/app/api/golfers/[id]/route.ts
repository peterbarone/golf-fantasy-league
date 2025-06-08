import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/golfers/[id] - Get a specific golfer
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
    
    const golfer = await prisma.golfer.findUnique({
      where: { id: params.id },
      include: {
        teamRoster: {
          include: {
            team: true
          }
        },
        tournamentLineups: {
          include: {
            tournament: true
          }
        },
        golferResults: {
          include: {
            tournament: true
          }
        }
      }
    });

    if (!golfer) {
      return NextResponse.json(
        { error: 'Golfer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(golfer);
  } catch (error) {
    console.error('Error fetching golfer:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PATCH /api/golfers/[id] - Update a golfer (admin only)
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
    const { name, pgaId, active } = body;

    // Verify golfer exists
    const existingGolfer = await prisma.golfer.findUnique({
      where: { id: params.id }
    });

    if (!existingGolfer) {
      return NextResponse.json(
        { error: 'Golfer not found' },
        { status: 404 }
      );
    }

    // Check for duplicate PGA ID if provided
    if (pgaId && pgaId !== existingGolfer.pgaId) {
      const duplicatePgaId = await prisma.golfer.findUnique({
        where: { pgaId }
      });

      if (duplicatePgaId) {
        return NextResponse.json(
          { error: 'PGA ID already exists' },
          { status: 400 }
        );
      }
    }

    // Update golfer
    const golfer = await prisma.golfer.update({
      where: { id: params.id },
      data: {
        name: name ?? undefined,
        pgaId: pgaId ?? undefined,
        active: active ?? undefined,
      },
    });
    
    return NextResponse.json(golfer);
  } catch (error) {
    console.error('Error updating golfer:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/golfers/[id] - Delete a golfer (admin only)
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

    // Verify golfer exists
    const existingGolfer = await prisma.golfer.findUnique({
      where: { id: params.id }
    });

    if (!existingGolfer) {
      return NextResponse.json(
        { error: 'Golfer not found' },
        { status: 404 }
      );
    }

    // Check if golfer is in any rosters or tournament lineups
    const [teamRoster, tournamentLineup] = await Promise.all([
      prisma.teamRoster.findFirst({
        where: { golferId: params.id }
      }),
      prisma.tournamentLineup.findFirst({
        where: { golferId: params.id }
      })
    ]);

    if (teamRoster || tournamentLineup) {
      return NextResponse.json(
        { error: 'Cannot delete golfer: they are part of a team roster or tournament lineup' },
        { status: 400 }
      );
    }

    // Delete golfer
    await prisma.golfer.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json(
      { message: 'Golfer deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting golfer:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
