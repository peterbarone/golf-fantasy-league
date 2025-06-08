'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Owner {
  name: string | null;
  email: string;
}

interface TournamentPerformance {
  tournamentId: string;
  tournamentName: string;
  points: number;
  skins: number;
  date: string;
}

interface TeamStanding {
  id: string;
  name: string;
  owner: Owner;
  totalPoints: number;
  totalSkins: number;
  tournamentCount: number;
  averagePoints: number;
  tournaments: TournamentPerformance[];
}

interface LeagueStandingsProps {
  highlightUserId?: string;
}

export default function LeagueStandings({ highlightUserId }: LeagueStandingsProps) {
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  
  useEffect(() => {
    loadStandings();
  }, []);
  
  const loadStandings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/standings');
      
      if (response.ok) {
        const data = await response.json();
        setStandings(data);
      } else {
        toast.error('Failed to load standings');
      }
    } catch (error) {
      console.error('Error loading standings:', error);
      toast.error('An error occurred while loading standings');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleTeamExpand = (teamId: string) => {
    setExpandedTeam(expandedTeam === teamId ? null : teamId);
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">League Standings</h3>
      
      {standings.length === 0 ? (
        <p className="text-gray-500">No standings available yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Points
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Points
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skins
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {standings.map((team, index) => (
                <>
                  <tr 
                    key={team.id} 
                    className={highlightUserId && team.owner.email === highlightUserId ? 'bg-blue-50' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {team.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {team.owner.name || team.owner.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {team.totalPoints}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {team.averagePoints}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {team.totalSkins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => toggleTeamExpand(team.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {expandedTeam === team.id ? 'Hide' : 'Show'}
                      </button>
                    </td>
                  </tr>
                  {expandedTeam === team.id && team.tournaments.length > 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4">
                        <div className="bg-gray-50 p-3 rounded-md">
                          <h4 className="text-sm font-medium mb-2">Tournament Performance</h4>
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Tournament
                                </th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Points
                                </th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Skins
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {team.tournaments
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((tournament) => (
                                  <tr key={tournament.tournamentId}>
                                    <td className="px-4 py-2 text-xs text-gray-900">
                                      {tournament.tournamentName}
                                    </td>
                                    <td className="px-4 py-2 text-xs text-gray-900">
                                      {new Date(tournament.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-2 text-xs text-gray-900">
                                      {tournament.points}
                                    </td>
                                    <td className="px-4 py-2 text-xs text-gray-900">
                                      {tournament.skins}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
