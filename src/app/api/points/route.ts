import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateTournamentPoints } from '@/lib/pointsCalculator';

const prisma = new PrismaClient();

// GET /api/points - Get points for all teams in a tournament
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
    
    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch tournament points for all teams
    const points = await prisma.teamPoints.findMany({
      where: {
        tournamentId,
      },
      include: {
        team: {
          include: {
            owner: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        },
        tournament: true,
      },
      orderBy: {
        points: 'desc',
      },
    });
    
    return NextResponse.json(points);
  } catch (error) {
    console.error('Error fetching team points:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/points/calculate - Calculate points for a tournament (admin only)
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
    
    // Check for admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { tournamentId } = body;
    
    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }
    
    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }
    
    // Calculate and save points for this tournament
    const result = await calculateTournamentPoints(tournamentId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Points calculated successfully',
      pointsCalculated: result.pointsCalculated,
      skinsAwarded: result.skinsAwarded
    });
  } catch (error) {
    console.error('Error calculating points:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
