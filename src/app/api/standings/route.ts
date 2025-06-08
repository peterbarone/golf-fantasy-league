import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/standings - Get overall league standings
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
    
    // Get all teams with their owners
    const teams = await prisma.team.findMany({
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          }
        },
        // Include all tournament points for this team
        teamPoints: {
          include: {
            tournament: true,
          }
        }
      }
    });
    
    // Calculate the total points and skins for each team across all tournaments
    const standings = teams.map(team => {
      // Sum up all points and skins across tournaments
      const totalPoints = team.teamPoints.reduce((sum, tp) => sum + tp.points, 0);
      const totalSkins = team.teamPoints.reduce((sum, tp) => sum + tp.skinCount, 0);
      
      // Count tournaments where team participated
      const tournamentCount = team.teamPoints.length;
      
      // Calculate average points per tournament
      const averagePoints = tournamentCount > 0 
        ? Math.round((totalPoints / tournamentCount) * 100) / 100 
        : 0;
      
      return {
        id: team.id,
        name: team.name,
        owner: team.owner,
        totalPoints,
        totalSkins,
        tournamentCount,
        averagePoints,
        // Include details of each tournament performance
        tournaments: team.teamPoints.map(tp => ({
          tournamentId: tp.tournamentId,
          tournamentName: tp.tournament.name,
          points: tp.points,
          skins: tp.skinCount,
          date: tp.tournament.startDate,
        })),
      };
    });
    
    // Sort standings by total points (descending)
    const sortedStandings = standings.sort((a, b) => b.totalPoints - a.totalPoints);
    
    return NextResponse.json(sortedStandings);
  } catch (error) {
    console.error('Error fetching standings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
