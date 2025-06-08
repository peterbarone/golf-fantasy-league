import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/stats/weekly - Get weekly standings and skins winners
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
    const weekParam = searchParams.get('week');

    // Get all tournaments for the year
    const tournaments = await prisma.tournament.findMany({
      where: {
        startDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${parseInt(year) + 1}-01-01`),
        },
        ...(weekParam && {
          startDate: {
            gte: new Date(weekParam),
            lt: new Date(new Date(weekParam).getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        }),
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
        tournamentSkins: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    // Get all teams for season totals
    const teams = await prisma.team.findMany({
      include: {
        owner: {
          select: {
            name: true,
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
        },
      },
    });

    interface TeamStanding {
      teamId: string;
      teamName: string;
      ownerName: string;
      totalPoints: number;
      tournamentCount: number;
      averagePoints: number;
    }

    interface TeamStanding {
      teamId: string;
      teamName: string;
      ownerName: string;
      totalPoints: number;
      tournamentCount: number;
      averagePoints: number;
    }

    interface TeamWithPoints {
      id: string;
      name: string;
      owner: { name: string };
      teamPoints: Array<{ points: number }>
    }

    interface TournamentWithPoints {
      id: string;
      name: string;
      startDate: Date;
      endDate: Date;
      isMajor: boolean;
      isWGC: boolean;
      isMatchPlay: boolean;
      teamPoints: Array<{
        points: number;
        team: {
          id: string;
          name: string;
          owner: { name: string };
        };
      }>;
      tournamentSkins: Array<{
        skinValue: number;
        carryOver: boolean;
        winningTeamIds: string[];
      }>;
    }

    // Calculate season standings
    const seasonStandings = teams.map((team: TeamWithPoints): TeamStanding => {
      const totalPoints = team.teamPoints.reduce((sum: number, tp: { points: number }) => sum + tp.points, 0);
      const tournamentCount = team.teamPoints.length;

      return {
        teamId: team.id,
        teamName: team.name,
        ownerName: team.owner.name,
        totalPoints,
        tournamentCount,
        averagePoints: totalPoints / tournamentCount || 0,
      };
    }).sort((a: TeamStanding, b: TeamStanding) => {
      // Sort by total points, break ties by average points
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return b.averagePoints - a.averagePoints;
    });

    // Calculate weekly results for each tournament
    const weeklyResults = tournaments.map((tournament: TournamentWithPoints) => {
      // Sort teams by points for this tournament
      const results = tournament.teamPoints
        .sort((a, b) => b.points - a.points)
        .map((tp, index: number) => ({
          position: index + 1,
          teamId: tp.team.id,
          teamName: tp.team.name,
          ownerName: tp.team.owner.name,
          points: tp.points,
        }));

      // Get skins information
      const skins = tournament.tournamentSkins[0];

      return {
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        isMajor: tournament.isMajor,
        isWGC: tournament.isWGC,
        isMatchPlay: tournament.isMatchPlay,
        results,
        skins: {
          value: skins?.skinValue || 0,
          carryOver: skins?.carryOver || false,
          winners: skins?.winningTeamIds || [],
        },
      };
    });

    // Calculate payouts based on season standings
    const payouts = calculateSeasonPayouts(seasonStandings);

    return NextResponse.json({
      year,
      seasonStandings: seasonStandings.map((standing: TeamStanding, index: number) => ({
        ...standing,
        position: index + 1,
        payout: payouts[index] || 0,
      })),
      weeklyResults,
    });
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate season payouts
function calculateSeasonPayouts(standings: Array<{
  teamId: string;
  teamName: string;
  ownerName: string;
  totalPoints: number;
  tournamentCount: number;
  averagePoints: number;
}>): number[] {
  // Example payout structure (adjust as needed):
  // 1st: $500
  // 2nd: $300
  // 3rd: $200
  // 4th: $100
  const payoutStructure = [500, 300, 200, 100];
  
  return standings.map((_, index) => payoutStructure[index] || 0);
}
