/**
 * Points calculation logic for the Golf Fantasy League
 * 
 * Point system rules:
 * - Regular Tournament: 1st: 100, 2nd: 70, 3rd: 50, 4th: 40, 5th: 30, 6-10: 20, 11-15: 10, 16-20: 5
 * - WGC Tournament: Points x 1.5
 * - Major Tournament: Points x 2
 * - Match Play: 1 point per match win
 * - Cut: -10 points
 * - Skins: Special handling through tournament skins
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TournamentPointsParams {
  tournamentId: string;
}

// Base points structure for regular tournaments
const BASE_POINTS = {
  1: 100,
  2: 70,
  3: 50,
  4: 40, 
  5: 30,
  6: 20,
  7: 20,
  8: 20,
  9: 20,
  10: 20,
  11: 10,
  12: 10,
  13: 10,
  14: 10,
  15: 10,
  16: 5,
  17: 5,
  18: 5,
  19: 5,
  20: 5
};

// Get points for a specific place
function getPointsForPlace(place: number | null): number {
  if (!place) return 0;
  if (place <= 20) {
    return BASE_POINTS[place as keyof typeof BASE_POINTS] || 0;
  }
  return 0;
}

// Calculate tournament multiplier based on tournament type
function getTournamentMultiplier(isMajor: boolean, isWGC: boolean): number {
  if (isMajor) return 2;
  if (isWGC) return 1.5;
  return 1;
}

/**
 * Calculate and save points for all teams in a specific tournament
 * @param tournamentId The ID of the tournament to calculate points for
 */
export async function calculateTournamentPoints(tournamentId: string): Promise<{ success: boolean; message: string; pointsCalculated: number; skinsAwarded: number }> {
  try {
    // Get the tournament details
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return { 
        success: false, 
        message: 'Tournament not found',
        pointsCalculated: 0,
        skinsAwarded: 0
      };
    }

    // Get all teams with their lineups for this tournament
    const teams = await prisma.team.findMany({
      include: {
        tournamentLineup: {
          where: { tournamentId },
          include: {
            golfer: true,
          }
        }
      }
    });

    // Get all golfer results for this tournament
    const golferResults = await prisma.golferResult.findMany({
      where: { tournamentId },
      include: {
        golfer: true,
      }
    });

    // Calculate the multiplier for this tournament
    const multiplier = getTournamentMultiplier(tournament.isMajor, tournament.isWGC);

    // Calculate points for each team
    let totalPointsCalculated = 0;
    let totalSkinsAwarded = 0;
    
    for (const team of teams) {
      let teamPoints = 0;
      let teamSkinPoints = 0;

      // Loop through each golfer in the team's lineup
      for (const lineupEntry of team.tournamentLineup) {
        // Find the results for this golfer
        const result = golferResults.find((r: any) => r.golferId === lineupEntry.golferId);
        
        if (result) {
          let golferPoints = 0;
          
          // Points based on place
          if (tournament.isMatchPlay) {
            // Match play points - 1 point per win
            golferPoints += (result.matchPlayWins || 0);
          } else {
            // Stroke play points based on leaderboard position
            golferPoints += getPointsForPlace(result.place);
          }
          
          // Apply tournament multiplier
          golferPoints = Math.round(golferPoints * multiplier);
          
          // Cut penalty (-10 points)
          if (result.isCut) {
            golferPoints -= 10;
          }
          
          // Count skins for this golfer
          if (result.skinCount && result.skinCount > 0) {
            teamSkinPoints += result.skinCount;
          }
          
          teamPoints += golferPoints;
        }
      }
      
      // Update or create team points record
      await prisma.teamPoints.upsert({
        where: {
          teamId_tournamentId: {
            teamId: team.id,
            tournamentId,
          }
        },
        update: {
          points: teamPoints,
          skinCount: teamSkinPoints,
        },
        create: {
          teamId: team.id,
          tournamentId,
          points: teamPoints,
          skinCount: teamSkinPoints,
        }
      });
      
      // Add to totals
      totalPointsCalculated += teamPoints;
      totalSkinsAwarded += teamSkinPoints;
    }
    
    // Update tournament skins with skin winners count
    const tournamentSkins = await prisma.tournamentSkins.findUnique({
      where: { tournamentId },
    });
    
    if (tournamentSkins) {
      const totalSkins = golferResults.reduce((sum: number, result: any) => sum + (result.skinCount || 0), 0);
      
      if (totalSkins === 0 && tournamentSkins) {
        // If no skins won, mark as carryover
        await prisma.tournamentSkins.update({
          where: { tournamentId },
          data: { carryOver: true },
        });
      }
    }
    
    return {
      success: true,
      message: 'Points calculated successfully',
      pointsCalculated: totalPointsCalculated,
      skinsAwarded: totalSkinsAwarded
    };
    
  } catch (error) {
    console.error('Error calculating tournament points:', error);
    return {
      success: false, 
      message: 'Error calculating tournament points',
      pointsCalculated: 0,
      skinsAwarded: 0
    };
  }
}
