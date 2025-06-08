'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// Define types for our data
interface Golfer {
  id: string;
  name: string;
}

interface TeamRoster {
  id: string;
  golfer: Golfer;
}

interface Team {
  id: string;
  name: string;
  teamRoster: TeamRoster[];
}

interface TournamentLineup {
  id: string;
  golfer: Golfer;
}

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  lineup?: TournamentLineup[];
}

export default function OwnerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [upcomingTournament, setUpcomingTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    // Redirect admin to admin dashboard
    if (session.user.role === 'ADMIN') {
      router.push('/dashboard/admin');
      return;
    }
    
    // Fetch team data for the owner
    const fetchTeamData = async () => {
      try {
        const teamResponse = await fetch(`/api/teams/owner`);
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          setTeam(teamData);
        }
        
        // Get upcoming tournament
        const tournamentResponse = await fetch('/api/tournaments/upcoming');
        if (tournamentResponse.ok) {
          const tournamentData = await tournamentResponse.json();
          setUpcomingTournament(tournamentData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching owner data:', error);
        setLoading(false);
      }
    };
    
    fetchTeamData();
  }, [session, status, router]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-green-500 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Owner Dashboard</h1>
      
      {team ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Team Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Your Team</h2>
            <div className="mb-4">
              <p className="text-gray-600">Team Name</p>
              <p className="text-lg font-medium">{team.name}</p>
            </div>
            
            <h3 className="text-lg font-medium mb-2">Your Roster</h3>
            {team.teamRoster && team.teamRoster.length > 0 ? (
              <ul className="divide-y">
                {team.teamRoster.map((roster) => (
                  <li key={roster.id} className="py-2">
                    {roster.golfer.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No golfers assigned to your team yet.</p>
            )}
          </div>
          
          {/* Upcoming Tournament */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Tournament</h2>
            {upcomingTournament ? (
              <div>
                <div className="mb-4">
                  <p className="text-gray-600">Tournament Name</p>
                  <p className="text-lg font-medium">{upcomingTournament.name}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-600">Dates</p>
                  <p className="text-lg font-medium">
                    {new Date(upcomingTournament.startDate).toLocaleDateString()} to {new Date(upcomingTournament.endDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Your Lineup</h3>
                  {upcomingTournament.lineup && upcomingTournament.lineup.length > 0 ? (
                    <ul className="divide-y">
                      {upcomingTournament.lineup.map((lineup) => (
                        <li key={lineup.id} className="py-2">
                          {lineup.golfer.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div>
                      <p className="text-amber-600 mb-2">You haven't submitted your lineup yet!</p>
                      <button 
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        onClick={() => router.push(`/tournaments/${upcomingTournament.id}/lineup`)}
                      >
                        Submit Lineup
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">No upcoming tournaments at the moment.</p>
            )}
          </div>
          
          {/* Tournament History */}
          <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Tournament History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tournament</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* This would be populated with tournament history data */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">No data available</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <p className="text-amber-700">You don't have a team yet. Please contact the admin.</p>
        </div>
      )}
    </div>
  );
}
