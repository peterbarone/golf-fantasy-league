'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Golfer {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Team {
  id: string;
  name: string;
  owner: User;
}

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface LineupEntry {
  id: string;
  teamId: string;
  team: Team;
  golferId: string;
  golfer: Golfer;
}

interface TournamentLineups {
  tournament: Tournament;
  lineups: {
    team: Team;
    golfers: Golfer[];
  }[];
}

export default function LineupManagement() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [lineups, setLineups] = useState<TournamentLineups | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadTournaments();
  }, []);
  
  useEffect(() => {
    if (selectedTournament) {
      loadLineups(selectedTournament.id);
    }
  }, [selectedTournament]);
  
  const loadTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tournaments');
      
      if (response.ok) {
        const data = await response.json();
        setTournaments(data);
        
        // Find active tournament if any
        const activeTournament = data.find((t: Tournament) => 
          new Date(t.startDate) <= new Date() && new Date(t.endDate) >= new Date()
        );
        
        if (activeTournament) {
          setSelectedTournament(activeTournament);
        } else if (data.length > 0) {
          // Default to most recent tournament
          const sortedTournaments = [...data].sort(
            (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
          setSelectedTournament(sortedTournaments[0]);
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
  
  const loadLineups = async (tournamentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lineups?tournamentId=${tournamentId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Process data to group by team
        if (selectedTournament) {
          // First create a map of teams to lineups
          const teamMap = new Map<string, {
            team: Team,
            golfers: Golfer[]
          }>();
          
          // Populate the map
          data.forEach((entry: LineupEntry) => {
            if (!teamMap.has(entry.teamId)) {
              teamMap.set(entry.teamId, {
                team: entry.team,
                golfers: []
              });
            }
            
            teamMap.get(entry.teamId)?.golfers.push(entry.golfer);
          });
          
          // Convert map to array
          const lineupsByTeam = Array.from(teamMap.values());
          
          setLineups({
            tournament: selectedTournament,
            lineups: lineupsByTeam
          });
        }
      } else {
        setLineups(null);
        toast.error('Failed to load lineups');
      }
    } catch (error) {
      console.error('Error loading lineups:', error);
      toast.error('An error occurred while loading lineups');
    } finally {
      setLoading(false);
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
      <h2 className="text-xl font-semibold mb-6">Tournament Lineups</h2>
      
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
        <>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ) : lineups && lineups.lineups.length > 0 ? (
            <div>
              <h3 className="text-lg font-medium mb-3">
                Lineups for {lineups.tournament.name} ({formatDate(lineups.tournament.startDate)})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lineups.lineups.map((lineup) => (
                  <div key={lineup.team.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <h4 className="font-medium text-base">{lineup.team.name}</h4>
                      <p className="text-sm text-gray-500">
                        Owner: {lineup.team.owner.name || lineup.team.owner.email}
                      </p>
                    </div>
                    
                    <h5 className="text-sm font-medium text-gray-600 mb-2">Selected Golfers:</h5>
                    <ul className="space-y-1">
                      {lineup.golfers.map((golfer) => (
                        <li key={golfer.id} className="text-sm text-gray-800">
                          {golfer.name}
                        </li>
                      ))}
                    </ul>
                    
                    {lineup.golfers.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No golfers selected</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded">
              <p className="text-yellow-700">
                No lineups have been submitted for this tournament yet.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
