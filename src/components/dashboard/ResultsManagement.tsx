'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Golfer {
  id: string;
  name: string;
}

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isMajor: boolean;
  isWGC: boolean;
  isMatchPlay: boolean;
}

interface GolferResult {
  id?: string;
  golfer: Golfer;
  golferId: string;
  tournamentId: string;
  place: number | null;
  score: number | null;
  isCut: boolean;
  matchPlayWins: number;
  skinCount: number;
}

export default function ResultsManagement() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [results, setResults] = useState<GolferResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingResults, setSavingResults] = useState(false);
  const [calculatingPoints, setCalculatingPoints] = useState(false);
  
  // Fetch tournaments on component mount
  useEffect(() => {
    loadTournaments();
  }, []);
  
  // Fetch golfers and results when a tournament is selected
  useEffect(() => {
    if (selectedTournament) {
      loadGolfers();
      loadResults(selectedTournament.id);
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
  
  const loadGolfers = async () => {
    try {
      const response = await fetch('/api/golfers?active=true');
      
      if (response.ok) {
        const data = await response.json();
        setGolfers(data);
      } else {
        toast.error('Failed to load golfers');
      }
    } catch (error) {
      console.error('Error loading golfers:', error);
      toast.error('An error occurred while loading golfers');
    }
  };
  
  const loadResults = async (tournamentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/results?tournamentId=${tournamentId}`);
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        
        // If no results yet, initialize with golfers from lineups
        if (data.length === 0) {
          await loadGolfersInLineups(tournamentId);
        }
      } else {
        toast.error('Failed to load results');
      }
    } catch (error) {
      console.error('Error loading results:', error);
      toast.error('An error occurred while loading results');
    } finally {
      setLoading(false);
    }
  };
  
  const loadGolfersInLineups = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/lineups?tournamentId=${tournamentId}`);
      
      if (response.ok) {
        const lineups = await response.json();
        
        // Extract unique golfers from all lineups
        const uniqueGolferIds = new Set<string>();
        const golferMap = new Map<string, Golfer>();
        
        lineups.forEach((lineup: any) => {
          if (!uniqueGolferIds.has(lineup.golferId)) {
            uniqueGolferIds.add(lineup.golferId);
            golferMap.set(lineup.golferId, lineup.golfer);
          }
        });
        
        // Initialize results for these golfers
        const initialResults: GolferResult[] = Array.from(uniqueGolferIds).map(golferId => ({
          golferId,
          golfer: golferMap.get(golferId) as Golfer,
          tournamentId,
          place: null,
          score: null,
          isCut: false,
          matchPlayWins: 0,
          skinCount: 0
        }));
        
        setResults(initialResults);
      }
    } catch (error) {
      console.error('Error loading lineups:', error);
    }
  };
  
  const handleTournamentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tournamentId = e.target.value;
    const selected = tournaments.find(t => t.id === tournamentId) || null;
    setSelectedTournament(selected);
  };
  
  const handleAddGolfer = () => {
    // Find golfers not already in results
    const golfersInResults = new Set(results.map(r => r.golferId));
    const availableGolfers = golfers.filter(g => !golfersInResults.has(g.id));
    
    if (availableGolfers.length === 0) {
      toast.error('All active golfers are already added');
      return;
    }
    
    // Add the first available golfer to results
    if (selectedTournament) {
      const newResult: GolferResult = {
        golferId: availableGolfers[0].id,
        golfer: availableGolfers[0],
        tournamentId: selectedTournament.id,
        place: null,
        score: null,
        isCut: false,
        matchPlayWins: 0,
        skinCount: 0
      };
      
      setResults([...results, newResult]);
    }
  };
  
  const handleResultChange = (golferId: string, field: keyof GolferResult, value: any) => {
    setResults(prev => 
      prev.map(result => 
        result.golferId === golferId 
          ? { ...result, [field]: value }
          : result
      )
    );
  };
  
  const handleSaveResults = async () => {
    if (!selectedTournament) return;
    
    try {
      setSavingResults(true);
      
      // Save each result one by one
      for (const result of results) {
        await fetch('/api/results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tournamentId: selectedTournament.id,
            golferId: result.golferId,
            place: result.place,
            score: result.score,
            isCut: result.isCut,
            matchPlayWins: result.matchPlayWins,
            skinCount: result.skinCount,
          }),
        });
      }
      
      toast.success('Results saved successfully!');
    } catch (error) {
      console.error('Error saving results:', error);
      toast.error('An error occurred while saving results');
    } finally {
      setSavingResults(false);
    }
  };
  
  const handleCalculatePoints = async () => {
    if (!selectedTournament) return;
    
    try {
      setCalculatingPoints(true);
      
      const response = await fetch('/api/points/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId: selectedTournament.id,
        }),
      });
      
      if (response.ok) {
        toast.success('Points calculated successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to calculate points');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error calculating points');
    } finally {
      setCalculatingPoints(false);
    }
  };
  
  const sortResults = () => {
    return [...results].sort((a, b) => {
      // Sort nulls to the bottom
      if (a.place === null && b.place === null) return 0;
      if (a.place === null) return 1;
      if (b.place === null) return -1;
      
      // Sort by place
      return a.place - b.place;
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
      <h2 className="text-xl font-semibold mb-6">Tournament Results Management</h2>
      
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
              {tournament.name} ({new Date(tournament.startDate).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>
      
      {selectedTournament && (
        <>
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div>
              <button 
                onClick={handleAddGolfer}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 mr-3"
              >
                Add Golfer
              </button>
              
              <button 
                onClick={handleSaveResults}
                disabled={savingResults || results.length === 0}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 mr-3"
              >
                {savingResults ? 'Saving...' : 'Save Results'}
              </button>
              
              <button 
                onClick={handleCalculatePoints}
                disabled={calculatingPoints || results.length === 0}
                className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                {calculatingPoints ? 'Calculating...' : 'Calculate Points'}
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Golfer
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Place
                    </th>
                    {selectedTournament.isMatchPlay ? (
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Match Wins
                      </th>
                    ) : (
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                    )}
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skins
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortResults().map((result) => (
                    <tr key={result.golferId}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {result.golfer.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <input
                          type="number"
                          value={result.place !== null ? result.place : ''}
                          onChange={(e) => handleResultChange(
                            result.golferId, 
                            'place', 
                            e.target.value === '' ? null : parseInt(e.target.value)
                          )}
                          min="1"
                          className="p-1 w-16 border border-gray-300 rounded text-center"
                        />
                      </td>
                      {selectedTournament.isMatchPlay ? (
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <input
                            type="number"
                            value={result.matchPlayWins}
                            onChange={(e) => handleResultChange(
                              result.golferId, 
                              'matchPlayWins', 
                              parseInt(e.target.value) || 0
                            )}
                            min="0"
                            className="p-1 w-16 border border-gray-300 rounded text-center"
                          />
                        </td>
                      ) : (
                        <td className="px-4 py-3 text-sm text-gray-500">
                          <input
                            type="number"
                            value={result.score !== null ? result.score : ''}
                            onChange={(e) => handleResultChange(
                              result.golferId, 
                              'score', 
                              e.target.value === '' ? null : parseInt(e.target.value)
                            )}
                            className="p-1 w-16 border border-gray-300 rounded text-center"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <select
                          value={result.isCut ? 'cut' : 'active'}
                          onChange={(e) => handleResultChange(
                            result.golferId, 
                            'isCut', 
                            e.target.value === 'cut'
                          )}
                          className="p-1 border border-gray-300 rounded"
                        >
                          <option value="active">Active</option>
                          <option value="cut">Cut</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <input
                          type="number"
                          value={result.skinCount}
                          onChange={(e) => handleResultChange(
                            result.golferId, 
                            'skinCount', 
                            parseInt(e.target.value) || 0
                          )}
                          min="0"
                          className="p-1 w-16 border border-gray-300 rounded text-center"
                        />
                      </td>
                    </tr>
                  ))}
                  
                  {results.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-center text-sm text-gray-500">
                        No golfers added yet. Click "Add Golfer" to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
