import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/stats/season - Get season-long stats and leaderboards
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    // Get all tournaments for the year
    const tournaments = await prisma.tournament.findMany({
      where: {
        startDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${parseInt(year) + 1}-01-01`),
        },
      },
      include: {
        teamPoints: {
          include: {
            team: {
              include: {
                owner: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        golferResults: {
          include: {
            golfer: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    // Calculate season-long team stats
    const teamStats = new Map<string, {
      teamId: string;
      teamName: string;
      ownerName: string;
      totalPoints: number;
      tournamentWins: number;
      top5Finishes: number;
      averagePoints: number;
      tournaments: number;
    }>();

    // Calculate season-long golfer stats
    const golferStats = new Map<string, {
      golferId: string;
      golferName: string;
      tournaments: number;
      wins: number;
      top5s: number;
      top10s: number;
      top25s: number;
      totalEarnings: number;
      totalFedexPoints: number;
    }>();

    // Process each tournament
    tournaments.forEach(tournament => {
      // Process team points
      tournament.teamPoints.forEach(teamPoint => {
        const team = teamPoint.team;
        const stats = teamStats.get(team.id) || {
          teamId: team.id,
          teamName: team.name,
          ownerName: team.owner.name,
          totalPoints: 0,
          tournamentWins: 0,
          top5Finishes: 0,
          averagePoints: 0,
          tournaments: 0,
        };

        stats.totalPoints += teamPoint.points;
        stats.tournaments += 1;
        stats.averagePoints = stats.totalPoints / stats.tournaments;

        // Check if team won or finished in top 5
        const position = tournament.teamPoints
          .sort((a, b) => b.points - a.points)
          .findIndex(tp => tp.teamId === team.id) + 1;

        if (position === 1) stats.tournamentWins += 1;
        if (position <= 5) stats.top5Finishes += 1;

        teamStats.set(team.id, stats);
      });

      // Process golfer results
      tournament.golferResults.forEach(result => {
        const golfer = result.golfer;
        const stats = golferStats.get(golfer.id) || {
          golferId: golfer.id,
          golferName: golfer.name,
          tournaments: 0,
          wins: 0,
          top5s: 0,
          top10s: 0,
          top25s: 0,
          totalEarnings: 0,
          totalFedexPoints: 0,
        };

        stats.tournaments += 1;
        stats.totalEarnings += result.earnings || 0;
        stats.totalFedexPoints += result.fedexPoints || 0;

        if (result.position === 1) stats.wins += 1;
        if (result.position <= 5) stats.top5s += 1;
        if (result.position <= 10) stats.top10s += 1;
        if (result.position <= 25) stats.top25s += 1;

        golferStats.set(golfer.id, stats);
      });
    });

    // Convert Maps to arrays and sort
    const teamLeaderboard = Array.from(teamStats.values())
      .sort((a, b) => b.totalPoints - a.totalPoints);

    const golferLeaderboard = Array.from(golferStats.values())
      .sort((a, b) => b.totalEarnings - a.totalEarnings);

    return NextResponse.json({
      year,
      tournaments: tournaments.map(t => ({
        id: t.id,
        name: t.name,
        startDate: t.startDate,
        endDate: t.endDate,
        isMajor: t.isMajor,
        isWGC: t.isWGC,
      })),
      teamLeaderboard,
      golferLeaderboard,
    });
  } catch (error) {
    console.error('Error fetching season stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
