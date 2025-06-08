import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/tournaments/[id]/calculate-points - Trigger point calculation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Check authentication and admin role
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get tournament with results
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        golferResults: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Get all teams with their lineups for this tournament
    const teams = await prisma.team.findMany({
      include: {
        lineups: {
          where: { tournamentId: params.id },
          include: {
            golfer: true,
          },
        },
      },
    });

    // Calculate points for each team
    const teamPoints = [];

    for (const team of teams) {
      const lineup = team.lineups[0]; // Each team should have only one lineup per tournament
      if (!lineup) continue; // Skip if team has no lineup

      // Calculate total points for the team's lineup
      let points = 0;
      for (const golfer of lineup.golfer) {
        const result = tournament.golferResults.find((r: { golferId: string }) => r.golferId === golfer.id);
        if (!result) continue;

        // Add points based on position
        if (result.position === 1) points += 8;
        else if (result.position === 2) points += 6;
        else if (result.position === 3) points += 4;
        else if (result.position === 4) points += 3;
        else if (result.position === 5) points += 2;
        else if (result.position <= 10) points += 1;

        // Add points for making the cut
        if (!result.missedCut) points += 1;

        // Double points for majors
        if (tournament.isMajor) points *= 2;

        // Add 1 point to each scoring position for WGC events
        if (tournament.isWGC) points += 1;
      }

      // Create or update team points
      const teamPoint = await prisma.teamPoints.upsert({
        where: {
          teamId_tournamentId: {
            teamId: team.id,
            tournamentId: params.id,
          },
        },
        create: {
          teamId: team.id,
          tournamentId: params.id,
          points,
        },
        update: {
          points,
        },
      });

      teamPoints.push(teamPoint);
    }

    return NextResponse.json(teamPoints);
  } catch (error) {
    console.error('Error calculating points:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

function calculatePositionPoints(position: number, isMajor: boolean, isWGC: boolean): number {
  // Base points for regular tournaments
  let points = Math.max(0, 101 - position);
  
  // Bonus multiplier for Majors and WGC events
  if (isMajor) {
    points *= 1.5;
  } else if (isWGC) {
    points *= 1.25;
  }
  
  return Math.round(points);
}
