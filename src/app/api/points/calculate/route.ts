import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { calculateTournamentPoints } from '@/lib/pointsCalculator';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admin can calculate points
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    // Parse request body
    const body = await req.json();
    const { tournamentId } = body;
    
    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }
    
    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }
    
    // Calculate points for the tournament
    const result = await calculateTournamentPoints(tournamentId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Points calculated successfully',
      pointsCalculated: result.pointsCalculated,
      skinsAwarded: result.skinsAwarded
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error calculating points:', error);
    return NextResponse.json({ error: 'Failed to calculate points' }, { status: 500 });
  }
}
