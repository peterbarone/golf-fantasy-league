'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isMajor: boolean;
  isWGC: boolean;
  isMatchPlay: boolean;
  isActive: boolean;
}

interface TeamPoints {
  id: string;
  teamId: string;
  team: {
    id: string;
    name: string;
    owner: {
      name: string | null;
      email: string;
    };
  };
  tournamentId: string;
  points: number;
  skinCount: number;
}

export default function PointsManagement() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [teamPoints, setTeamPoints] = useState<TeamPoints[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  
  useEffect(() => {
    loadTournaments();
  }, []);
  
  useEffect(() => {
    if (selectedTournament) {
      loadTeamPoints(selectedTournament.id);
    }
  }, [selectedTournament]);
  
  const loadTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tournaments');
      
      if (response.ok) {
        const data = await response.json();
        setTournaments(data);
        
        // Try to find recently completed tournament if any
        const completedTournaments = data.filter((t: Tournament) => 
          new Date(t.endDate) < new Date()
        );
        
        if (completedTournaments.length > 0) {
          // Sort by most recently completed first
          const sortedTournaments = [...completedTournaments].sort(
            (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
          );
          setSelectedTournament(sortedTournaments[0]);
        } else if (data.length > 0) {
          // Default to first tournament
          setSelectedTournament(data[0]);
        }
      } else {
        toast.error('Failed to load tournaments');
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
      toast.error('An error occurred while loading tournaments');
    } finally {
      setLoading(false);
    }
  };
  
  const loadTeamPoints = async (tournamentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/points?tournamentId=${tournamentId}`);
      
      if (response.ok) {
        const data = await response.json();
        setTeamPoints(data);
      } else {
        setTeamPoints([]);
        // Only show error if it's not a case of no points calculated yet
        if (response.status !== 404) {
          toast.error('Failed to load team points');
        }
      }
    } catch (error) {
      console.error('Error loading team points:', error);
      toast.error('An error occurred while loading team points');
    } finally {
      setLoading(false);
    }
  };
  
  const calculatePoints = async () => {
    if (!selectedTournament) return;
    
    try {
      setCalculating(true);
      const response = await fetch('/api/points/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: selectedTournament.id }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(
          `Points calculated successfully! ${data.pointsCalculated} total points and ${data.skinsAwarded} skins awarded.`
        );
        loadTeamPoints(selectedTournament.id);
      } else {
        toast.error(`Failed to calculate points: ${data.error}`);
      }
    } catch (error) {
      console.error('Error calculating points:', error);
      toast.error('An error occurred while calculating points');
    } finally {
      setCalculating(false);
    }
  };
  
  const handleTournamentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tournamentId = e.target.value;
    const selected = tournaments.find(t => t.id === tournamentId) || null;
    setSelectedTournament(selected);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const getTournamentTypeLabel = (tournament: Tournament) => {
    if (tournament.isMajor) return 'Major';
    if (tournament.isWGC) return 'WGC';
    if (tournament.isMatchPlay) return 'Match Play';
    return 'Regular';
  };
  
  if (loading && tournaments.length === 0) {
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
      <h2 className="text-xl font-semibold mb-6">Tournament Points Management</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Tournament
        </label>
        <select
          value={selectedTournament?.id || ''}
          onChange={handleTournamentChange}
          className="p-2 border border-gray-300 rounded w-full md:w-1/2"
        >
          <option value="">Select a tournament</option>
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name} ({formatDate(tournament.startDate)})
            </option>
          ))}
        </select>
      </div>
      
      {selectedTournament && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-2">
            {selectedTournament.name} ({formatDate(selectedTournament.startDate)} - {formatDate(selectedTournament.endDate)})
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2 py-1 bg-gray-100 text-sm rounded">
              Type: {getTournamentTypeLabel(selectedTournament)}
            </span>
            {selectedTournament.isMatchPlay ? (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                Match Play Scoring (1 point per match win)
              </span>
            ) : (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                Stroke Play Scoring ({selectedTournament.isMajor ? '2x' : selectedTournament.isWGC ? '1.5x' : '1x'} multiplier)
              </span>
            )}
            {new Date(selectedTournament.endDate) < new Date() ? (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                Tournament Completed
              </span>
            ) : (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
                Tournament In Progress or Upcoming
              </span>
            )}
          </div>
          
          {new Date(selectedTournament.endDate) < new Date() && (
            <div className="mb-6">
              <button
                onClick={calculatePoints}
                disabled={calculating}
                className={`px-4 py-2 text-white font-medium rounded ${
                  calculating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {calculating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Calculating Points...
                  </span>
                ) : (
                  'Calculate/Update Points'
                )}
              </button>
              <p className="mt-2 text-sm text-gray-600">
                This will calculate or update points for all teams based on tournament results.
              </p>
            </div>
          )}
        </div>
      )}
      
      {loading && selectedTournament ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      ) : teamPoints.length > 0 ? (
        <div>
          <h3 className="text-lg font-medium mb-3">Team Points</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skins
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamPoints
                  .sort((a, b) => b.points - a.points)
                  .map((tp) => (
                    <tr key={tp.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tp.team.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tp.team.owner.name || tp.team.owner.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {tp.points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tp.skinCount}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedTournament ? (
        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-yellow-700">
            No points have been calculated for this tournament yet. 
            {new Date(selectedTournament.endDate) < new Date() && 
              ' You can calculate points using the button above.'}
          </p>
        </div>
      ) : null}
    </div>
  );
}
