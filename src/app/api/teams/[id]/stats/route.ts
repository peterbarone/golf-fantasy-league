import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/teams/[id]/stats - Get detailed statistics for a specific team
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get team with all related data
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        roster: true,
        tournamentLineups: {
          where: {
            tournament: {
              startDate: {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${parseInt(year) + 1}-01-01`),
              },
            },
          },
          include: {
            tournament: true,
            golfer: {
              include: {
                golferResults: {
                  where: {
                    tournament: {
                      startDate: {
                        gte: new Date(`${year}-01-01`),
                        lt: new Date(`${parseInt(year) + 1}-01-01`),
                      },
                    },
                  },
                },
              },
            },
          },
        },
        teamPoints: {
          where: {
            tournament: {
              startDate: {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${parseInt(year) + 1}-01-01`),
              },
            },
          },
          include: {
            tournament: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Calculate tournament performance stats
    const tournamentStats = {
      totalTournaments: team.teamPoints.length,
      wins: 0,
      top5s: 0,
      top10s: 0,
      totalPoints: 0,
      averagePoints: 0,
      bestFinish: null as number | null,
      worstFinish: null as number | null,
      majorResults: [] as { tournament: string; position: number; points: number }[],
      wgcResults: [] as { tournament: string; position: number; points: number }[],
    };

    // Calculate roster performance stats
    const rosterStats = team.roster.map(golfer => {
      const lineups = team.tournamentLineups.filter(l => l.golferId === golfer.id);
      const results = lineups.map(l => ({
        tournament: l.tournament.name,
        result: l.golfer.golferResults[0]?.position || null,
        points: team.teamPoints.find(tp => tp.tournamentId === l.tournamentId)?.points || 0,
      }));

      return {
        golfer: {
          id: golfer.id,
          name: golfer.name,
        },
        timesSelected: lineups.length,
        averageFinish: results
          .filter(r => r.result !== null)
          .reduce((sum, r) => sum + (r.result || 0), 0) / results.length || 0,
        bestFinish: Math.min(...results.filter(r => r.result !== null).map(r => r.result || Infinity)),
        pointsContributed: results.reduce((sum, r) => sum + r.points, 0),
        results,
      };
    });

    // Process each tournament result
    team.teamPoints.forEach(teamPoint => {
      const tournament = teamPoint.tournament;
      const position = tournament.teamPoints
        .sort((a, b) => b.points - a.points)
        .findIndex(tp => tp.teamId === team.id) + 1;

      tournamentStats.totalPoints += teamPoint.points;

      if (position === 1) tournamentStats.wins++;
      if (position <= 5) tournamentStats.top5s++;
      if (position <= 10) tournamentStats.top10s++;

      if (tournamentStats.bestFinish === null || position < tournamentStats.bestFinish) {
        tournamentStats.bestFinish = position;
      }
      if (tournamentStats.worstFinish === null || position > tournamentStats.worstFinish) {
        tournamentStats.worstFinish = position;
      }

      const result = {
        tournament: tournament.name,
        position,
        points: teamPoint.points,
      };

      if (tournament.isMajor) {
        tournamentStats.majorResults.push(result);
      }
      if (tournament.isWGC) {
        tournamentStats.wgcResults.push(result);
      }
    });

    // Calculate average points
    tournamentStats.averagePoints = tournamentStats.totalPoints / tournamentStats.totalTournaments || 0;

    // Sort roster stats by points contributed
    rosterStats.sort((a, b) => b.pointsContributed - a.pointsContributed);

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        owner: team.owner,
      },
      year,
      tournamentStats,
      rosterStats,
    });
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
