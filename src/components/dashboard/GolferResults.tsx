'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Golfer {
  id: string;
  name: string;
}

interface TournamentResult {
  id: string;
  golferId: string;
  tournamentId: string;
  position: number | null;
  isCut: boolean;
  isWD: boolean;
  matchPlayWins: number;
  matchPlayLosses: number;
  matchPlayDraws: number;
  golfer: Golfer;
}

interface GolferResultsProps {
  tournamentId: string;
}

export default function GolferResults({ tournamentId }: GolferResultsProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<TournamentResult[]>([]);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [tournament, setTournament] = useState<any>(null);
  const [selectedGolfer, setSelectedGolfer] = useState<string>('');
  const [formData, setFormData] = useState({
    position: '',
    isCut: false,
    isWD: false,
    matchPlayWins: 0,
    matchPlayLosses: 0,
    matchPlayDraws: 0,
  });
  
  useEffect(() => {
    loadData();
  }, [tournamentId]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load tournament details
      const tournamentResponse = await fetch(`/api/tournaments/${tournamentId}`);
      if (tournamentResponse.ok) {
        const tournamentData = await tournamentResponse.json();
        setTournament(tournamentData);
      }
      
      // Load existing results
      const resultsResponse = await fetch(`/api/tournaments/${tournamentId}/results`);
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setResults(resultsData);
      }
      
      // Load all golfers
      const golfersResponse = await fetch('/api/golfers');
      if (golfersResponse.ok) {
        const golfersData = await golfersResponse.json();
        setGolfers(golfersData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked,
      }));
    } else if (name === 'position') {
      // Allow empty string or valid number
      if (value === '' || (!isNaN(Number(value)) && Number(value) > 0)) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGolfer) {
      toast.error('Please select a golfer');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const payload = {
        golferId: selectedGolfer,
        position: formData.position ? parseInt(formData.position) : null,
        isCut: formData.isCut,
        isWD: formData.isWD,
        matchPlayWins: tournament?.isMatchPlay ? parseInt(formData.matchPlayWins.toString()) : 0,
        matchPlayLosses: tournament?.isMatchPlay ? parseInt(formData.matchPlayLosses.toString()) : 0,
        matchPlayDraws: tournament?.isMatchPlay ? parseInt(formData.matchPlayDraws.toString()) : 0,
      };
      
      const response = await fetch(`/api/tournaments/${tournamentId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        toast.success('Result added successfully');
        // Reset form
        setSelectedGolfer('');
        setFormData({
          position: '',
          isCut: false,
          isWD: false,
          matchPlayWins: 0,
          matchPlayLosses: 0,
          matchPlayDraws: 0,
        });
        // Reload results
        loadData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add result');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error adding result');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteResult = async (golferId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/results/${golferId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Result deleted successfully');
        loadData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete result');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error deleting result');
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Add Result Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Add Tournament Result</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="golfer" className="block text-sm font-medium text-gray-700 mb-1">
              Select Golfer
            </label>
            <select
              id="golfer"
              value={selectedGolfer}
              onChange={(e) => setSelectedGolfer(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              required
            >
              <option value="">Select a golfer...</option>
              {golfers
                .filter(g => !results.some(r => r.golferId === g.id))
                .map(golfer => (
                  <option key={golfer.id} value={golfer.id}>
                    {golfer.name}
                  </option>
                ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                Final Position
              </label>
              <input
                type="number"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                min="1"
                className="w-full p-2 border border-gray-300 rounded"
                disabled={formData.isCut || formData.isWD}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isCut"
                  name="isCut"
                  checked={formData.isCut}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  disabled={formData.isWD}
                />
                <label htmlFor="isCut" className="ml-2 text-sm text-gray-700">
                  Missed Cut
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isWD"
                  name="isWD"
                  checked={formData.isWD}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  disabled={formData.isCut}
                />
                <label htmlFor="isWD" className="ml-2 text-sm text-gray-700">
                  Withdrew
                </label>
              </div>
            </div>
          </div>
          
          {tournament?.isMatchPlay && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="matchPlayWins" className="block text-sm font-medium text-gray-700 mb-1">
                  Match Wins
                </label>
                <input
                  type="number"
                  id="matchPlayWins"
                  name="matchPlayWins"
                  value={formData.matchPlayWins}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label htmlFor="matchPlayLosses" className="block text-sm font-medium text-gray-700 mb-1">
                  Match Losses
                </label>
                <input
                  type="number"
                  id="matchPlayLosses"
                  name="matchPlayLosses"
                  value={formData.matchPlayLosses}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label htmlFor="matchPlayDraws" className="block text-sm font-medium text-gray-700 mb-1">
                  Match Draws
                </label>
                <input
                  type="number"
                  id="matchPlayDraws"
                  name="matchPlayDraws"
                  value={formData.matchPlayDraws}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                submitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Adding...' : 'Add Result'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Tournament Results</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Golfer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
                {tournament?.isMatchPlay && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Match Play Record
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => (
                <tr key={result.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {result.golfer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.isWD ? (
                      <span className="text-red-600">WD</span>
                    ) : result.isCut ? (
                      <span className="text-orange-600">Cut</span>
                    ) : (
                      <span>Position: {result.position}</span>
                    )}
                  </td>
                  {tournament?.isMatchPlay && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.matchPlayWins}-{result.matchPlayLosses}
                      {result.matchPlayDraws > 0 ? `-${result.matchPlayDraws}` : ''}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDeleteResult(result.golferId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              
              {results.length === 0 && (
                <tr>
                  <td
                    colSpan={tournament?.isMatchPlay ? 4 : 3}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No results added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
