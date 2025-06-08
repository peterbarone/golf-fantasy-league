import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/skins - Get skins information for tournaments
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
    
    const searchParams = request.nextUrl.searchParams;
    const tournamentId = searchParams.get('tournamentId');
    
    // Build query based on provided parameters
    const query: any = {};
    if (tournamentId) {
      query.tournamentId = tournamentId;
    }
    
    // Fetch tournament skins
    const skins = await prisma.tournamentSkins.findMany({
      where: query,
      include: {
        tournament: true,
      },
      orderBy: {
        tournament: {
          startDate: 'desc',
        },
      },
    });
    
    // For each tournament, get skin winners if any
    type TournamentSkin = {
      id: string;
      tournamentId: string;
      skinValue: number;
      carryOver: boolean;
      tournament: {
        id: string;
        name: string;
        startDate: Date;
      };
    };

    const skinsWithWinners = await Promise.all(
      skins.map(async (skin: TournamentSkin) => {
        // Get golfer results with skins for this tournament
        const skinWinners = await prisma.golferResult.findMany({
          where: {
            tournamentId: skin.tournamentId,
            skinCount: {
              gt: 0,
            },
          },
          include: {
            golfer: true,
            // Get the teams that included this golfer in their lineup
            tournament: {
              include: {
                tournamentLineup: {
                  where: {
                    golferId: {
                      in: (await prisma.golferResult.findMany({
                        where: {
                          tournamentId: skin.tournamentId,
                          skinCount: { gt: 0 },
                        },
                        select: { golferId: true },
                      })).map((r: { golferId: string }) => r.golferId),
                    },
                  },
                  include: {
                    team: true,
                    golfer: true,
                  },
                },
              },
            },
          },
        });
        
        return {
          ...skin,
          winners: skinWinners,
        };
      })
    );
    
    return NextResponse.json(skinsWithWinners);
  } catch (error) {
    console.error('Error fetching skins:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/skins - Update skins information for a tournament (admin only)
export async function POST(request: NextRequest) {
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
    const { tournamentId, skinValue, carryOver } = body;
    
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
    
    // Find previous tournament with carried over skins
    let totalSkinValue = skinValue || 0;
    
    if (carryOver) {
      // Find the most recent tournament before this one that has carry over
      const previousTournaments = await prisma.tournament.findMany({
        where: {
          endDate: {
            lt: tournament.startDate,
          },
        },
        orderBy: {
          endDate: 'desc',
        },
        take: 5, // Look at the 5 most recent tournaments
      });
      
      // Check if any of these have carried over skins
      for (const prevTournament of previousTournaments) {
        const prevSkins = await prisma.tournamentSkins.findUnique({
          where: { tournamentId: prevTournament.id },
        });
        
        if (prevSkins && prevSkins.carryOver) {
          totalSkinValue += prevSkins.skinValue;
          break; // Only carry over from the most recent tournament
        }
      }
    }
    
    // Update tournament skins
    const updatedSkins = await prisma.tournamentSkins.upsert({
      where: { tournamentId },
      update: {
        skinValue: totalSkinValue,
        carryOver,
      },
      create: {
        tournamentId,
        skinValue: totalSkinValue,
        carryOver,
      },
    });
    
    return NextResponse.json(updatedSkins);
  } catch (error) {
    console.error('Error updating skins:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
