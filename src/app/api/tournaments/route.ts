import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { tournamentSchema, validateBody } from '@/lib/schemas';
import { ZodError } from 'zod';

// GET /api/tournaments - Get all tournaments
export async function GET() {
  try {
    const session = await auth();
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all tournaments ordered by start date
    const tournaments = await prisma.tournament.findMany({
      orderBy: {
        startDate: 'asc',
      },
    });

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/tournaments - Create a new tournament
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check authentication and admin role
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Validate request body
    const data = await validateBody(request, tournamentSchema);

    // Create new tournament
    const tournament = await prisma.tournament.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isMajor: data.isMajor,
        isWGC: data.isWGC,
        isMatchPlay: data.isMatchPlay,
        isActive: data.isActive,
      },
    });

    // If this tournament is active, deactivate all others
    if (tournament.isActive) {
      await prisma.tournament.updateMany({
        where: {
          id: { not: tournament.id },
        },
        data: {
          isActive: false,
        },
      });
    }

    // Create initial tournament skins entry
    await prisma.tournamentSkins.create({
      data: {
        tournamentId: tournament.id,
        skinValue: 0,
        carryOver: false,
      },
    });

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error creating tournament:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation Error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
