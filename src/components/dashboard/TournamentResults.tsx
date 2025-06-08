'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface GolferResult {
  golfer: {
    id: string;
    name: string;
  };
  place: number | null;
  score: number | null;
  isCut: boolean;
  matchPlayWins: number;
  skinCount: number;
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

interface TournamentResultsProps {
  tournamentId: string;
  isAdmin?: boolean;
}

export default function TournamentResults({ tournamentId, isAdmin = false }: TournamentResultsProps) {
  const [results, setResults] = useState<GolferResult[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (tournamentId) {
      loadResults();
    }
  }, [tournamentId]);
  
  const loadResults = async () => {
    try {
      setLoading(true);
      
      // Fetch tournament details
      const tournResponse = await fetch(`/api/tournaments?id=${tournamentId}`);
      if (tournResponse.ok) {
        const tournData = await tournResponse.json();
        if (Array.isArray(tournData) && tournData.length > 0) {
          setTournament(tournData[0]);
        } else if (!Array.isArray(tournData)) {
          setTournament(tournData);
        }
      }
      
      // Fetch tournament results
      const resultsResponse = await fetch(`/api/results?tournamentId=${tournamentId}`);
      if (resultsResponse.ok) {
        const data = await resultsResponse.json();
        setResults(data);
      } else {
        toast.error('Failed to load tournament results');
      }
    } catch (error) {
      console.error('Error loading tournament results:', error);
      toast.error('An error occurred while loading tournament results');
    } finally {
      setLoading(false);
    }
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
  
  if (!tournament) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Tournament information not available</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{tournament.name} Results</h3>
      
      {results.length === 0 ? (
        <p className="text-gray-500">No results available for this tournament yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Golfer
                </th>
                {tournament.isMatchPlay ? (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Match Wins
                  </th>
                ) : (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skins
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => (
                <tr key={result.golfer.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {result.place || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.golfer.name}
                  </td>
                  {tournament.isMatchPlay ? (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.matchPlayWins || 0}
                    </td>
                  ) : (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.score !== null ? result.score > 0 ? `+${result.score}` : result.score : '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.isCut ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Cut
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.skinCount || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
