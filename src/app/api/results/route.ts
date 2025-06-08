import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/results - Get results for a specific tournament
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
    
    // Fetch tournament results
    const results = await prisma.golferResult.findMany({
      where: {
        tournamentId,
      },
      include: {
        golfer: true,
      },
      orderBy: {
        place: 'asc',
      },
    });
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/results - Submit results for a golfer in a tournament (admin only)
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
    const { tournamentId, golferId, place, score, isCut, matchPlayWins, skinCount } = body;
    
    if (!tournamentId || !golferId) {
      return NextResponse.json(
        { error: 'Tournament ID and golfer ID are required' },
        { status: 400 }
      );
    }
    
    // Check if tournament and golfer exist
    const [tournament, golfer] = await Promise.all([
      prisma.tournament.findUnique({ where: { id: tournamentId } }),
      prisma.golfer.findUnique({ where: { id: golferId } }),
    ]);
    
    if (!tournament || !golfer) {
      return NextResponse.json(
        { error: 'Tournament or golfer not found' },
        { status: 404 }
      );
    }
    
    // Update or create the result
    const result = await prisma.golferResult.upsert({
      where: {
        tournamentId_golferId: {
          tournamentId,
          golferId,
        },
      },
      update: {
        place: place ?? null,
        score: score ?? null,
        isCut: isCut ?? false,
        matchPlayWins: matchPlayWins ?? 0,
        skinCount: skinCount ?? 0,
      },
      create: {
        tournamentId,
        golferId,
        place: place ?? null,
        score: score ?? null,
        isCut: isCut ?? false,
        matchPlayWins: matchPlayWins ?? 0,
        skinCount: skinCount ?? 0,
      },
    });
    
    // After submitting results, calculate team points if needed
    // This is a placeholder for now - we'll implement point calculation logic later
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error submitting result:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
