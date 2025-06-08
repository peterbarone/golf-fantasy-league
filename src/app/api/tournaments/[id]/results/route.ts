import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/tournaments/[id]/results - Get tournament results
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
    
    // Get tournament results with golfer details
    const results = await prisma.golferResult.findMany({
      where: { tournamentId: params.id },
      include: {
        golfer: true,
        tournament: true,
      },
      orderBy: {
        position: 'asc',
      },
    });
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching tournament results:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/tournaments/[id]/results - Add or update tournament results (admin only)
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
    const { results } = body;

    if (!Array.isArray(results)) {
      return NextResponse.json(
        { error: 'Results must be an array' },
        { status: 400 }
      );
    }

    // Verify tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Validate results data
    for (const result of results) {
      if (!result.golferId || !result.position || !result.score) {
        return NextResponse.json(
          { error: 'Each result must include golferId, position, and score' },
          { status: 400 }
        );
      }
    }

    // Update or create results in a transaction
    const updatedResults = await prisma.$transaction(
      results.map(result => 
        prisma.golferResult.upsert({
          where: {
            tournamentId_golferId: {
              tournamentId: params.id,
              golferId: result.golferId,
            },
          },
          create: {
            tournamentId: params.id,
            golferId: result.golferId,
            position: result.position,
            score: result.score,
            earnings: result.earnings || 0,
            fedexPoints: result.fedexPoints || 0,
          },
          update: {
            position: result.position,
            score: result.score,
            earnings: result.earnings || 0,
            fedexPoints: result.fedexPoints || 0,
          },
        })
      )
    );

    // Calculate and update team points
    await calculateTeamPoints(params.id);
    
    return NextResponse.json(updatedResults);
  } catch (error) {
    console.error('Error updating tournament results:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/tournaments/[id]/results - Delete tournament results (admin only)
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
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Delete all results for this tournament
    await prisma.$transaction([
      // Delete team points first (foreign key constraint)
      prisma.teamPoints.deleteMany({
        where: { tournamentId: params.id },
      }),
      // Then delete golfer results
      prisma.golferResult.deleteMany({
        where: { tournamentId: params.id },
      }),
    ]);
    
    return NextResponse.json(
      { message: 'Tournament results deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting tournament results:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate team points
async function calculateTeamPoints(tournamentId: string) {
  // Get tournament details and all teams with their lineups
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      tournamentLineups: {
        include: {
          team: true,
          golfer: {
            include: {
              golferResults: {
                where: { tournamentId },
              },
            },
          },
        },
      },
    },
  });

  if (!tournament) return;

  type TournamentLineup = typeof tournament.tournamentLineups[number];

  // Group lineups by team
  const teamLineups = tournament.tournamentLineups.reduce((acc: Record<string, TournamentLineup[]>, lineup: TournamentLineup) => {
    if (!acc[lineup.teamId]) acc[lineup.teamId] = [];
    acc[lineup.teamId].push(lineup);
    return acc;
  }, {});

  // Calculate points for each team
  const pointsPromises = (Object.entries(teamLineups) as [string, TournamentLineup[]][]).map(async ([teamId, lineups]) => {
    let totalPoints = 0;

    // For match play tournament (Dell Technologies Match Play)
    if (tournament.isMatchPlay) {
      lineups.forEach((lineup: TournamentLineup) => {
        const result = lineup.golfer.golferResults[0];
        if (!result) return;

        // Add points for each win in rounds 1-3
        totalPoints += (result.matchPlayWins || 0) * 2;

        // Add points based on final position
        if (result.position === 1) totalPoints += 9;
        else if (result.position === 2) totalPoints += 7;
        else if (result.position === 3) totalPoints += 6;
        else if (result.position === 4) totalPoints += 5;
        else if (result.position <= 8) totalPoints += 3;
        else if (result.position <= 16) totalPoints += 2;
      });
    }
    // For stroke play tournaments
    else {
      lineups.forEach((lineup: TournamentLineup) => {
        const result = lineup.golfer.golferResults[0];
        if (!result) return;

        let points = 0;

        // Points for making the cut
        if (result.position <= 70) points += 1;

        // Points based on position
        if (result.position === 1) points += 8;
        else if (result.position === 2) points += 6;
        else if (result.position === 3) points += 5;
        else if (result.position === 4) points += 4;
        else if (result.position === 5) points += 3;
        else if (result.position >= 6 && result.position <= 10) points += 2;
        else if (result.position >= 11 && result.position <= 25) points += 1;

        // Double points for majors
        if (tournament.isMajor) points *= 2;

        // Add 1 point to each spot for WGC events
        if (tournament.isWGC && points > 0) points += 1;

        totalPoints += points;
      });
    }

    // Update or create team points
    return prisma.teamPoints.upsert({
      where: {
        teamId_tournamentId: {
          teamId,
          tournamentId,
        },
      },
      create: {
        teamId,
        tournamentId,
        points: totalPoints,
      },
      update: {
        points: totalPoints,
      },
    });
  });

  await Promise.all(pointsPromises);

}
