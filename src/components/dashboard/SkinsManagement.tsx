'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Tournament {
  id: string;
  name: string;
  startDate: string;
}

interface TeamSkin {
  id: string;
  teamId: string;
  teamName: string;
  ownerName: string;
  count: number;
}

interface TournamentSkins {
  id: string;
  tournamentId: string;
  tournamentName: string;
  startDate: string;
  skinValue: number;
  carryOver: boolean;
  previousSkinCount: number;
  previousSkinValue: number;
  teamSkins: TeamSkin[];
}

export default function SkinsManagement() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [skinsData, setSkinsData] = useState<TournamentSkins | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    skinValue: 0,
    carryOver: false,
  });
  
  useEffect(() => {
    loadTournaments();
  }, []);
  
  useEffect(() => {
    if (selectedTournament) {
      loadSkins(selectedTournament.id);
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
          new Date(t.startDate) <= new Date() && new Date() <= new Date(t.startDate)
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
  
  const loadSkins = async (tournamentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/skins/${tournamentId}`);
      
      if (response.ok) {
        const data = await response.json();
        setSkinsData(data);
        
        // Update form data with current values
        setFormData({
          skinValue: data.skinValue,
          carryOver: data.carryOver
        });
      } else if (response.status === 404) {
        setSkinsData(null);
        setFormData({
          skinValue: 25, // Default value
          carryOver: false,
        });
      } else {
        toast.error('Failed to load skins data');
      }
    } catch (error) {
      console.error('Error loading skins data:', error);
      toast.error('An error occurred while loading skins data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTournamentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tournamentId = e.target.value;
    const selected = tournaments.find(t => t.id === tournamentId) || null;
    setSelectedTournament(selected);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    });
  };
  
  const handleUpdateSkins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;
    
    try {
      setUpdating(true);
      
      const response = await fetch(`/api/skins/${selectedTournament.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skinValue: formData.skinValue,
          carryOver: formData.carryOver,
        }),
      });
      
      if (response.ok) {
        toast.success('Skins settings updated successfully!');
        loadSkins(selectedTournament.id);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update skins');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error updating skins');
    } finally {
      setUpdating(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
      <h2 className="text-xl font-semibold mb-6">Skins Management</h2>
      
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
          <div className="mb-6 p-4 border border-gray-200 rounded-md">
            <h3 className="text-lg font-medium mb-3">Skins Settings</h3>
            <form onSubmit={handleUpdateSkins}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skin Value ($)
                  </label>
                  <input
                    type="number"
                    name="skinValue"
                    value={formData.skinValue}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    min="0"
                    step="5"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Value of each skin in this tournament
                  </p>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="carryOver"
                    id="carryOver"
                    checked={formData.carryOver}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="carryOver" className="ml-2 text-sm text-gray-700">
                    Carry over skins from previous tournament
                  </label>
                  <div className="ml-2" title="If checked, the value of any unclaimed skins from the previous tournament will be added to this tournament's skins pot.">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {skinsData && skinsData.carryOver && skinsData.previousSkinValue > 0 && (
                <div className="mb-4 bg-blue-50 p-3 rounded">
                  <p className="text-sm text-blue-800">
                    {skinsData.previousSkinCount} skins were not won in the previous tournament, 
                    carrying over {formatCurrency(skinsData.previousSkinValue)}.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {updating ? 'Updating...' : 'Update Settings'}
                </button>
              </div>
            </form>
          </div>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-medium mb-3">Skins Results</h3>
              
              {skinsData?.teamSkins?.length > 0 ? (
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
                          Skins
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {skinsData.teamSkins.map((skin) => (
                        <tr key={skin.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {skin.teamName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {skin.ownerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {skin.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(skin.count * skinsData.skinValue)}
                          </td>
                        </tr>
                      ))}
                      
                      <tr className="bg-gray-50">
                        <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Total Skins Value
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {skinsData.teamSkins.reduce((total, skin) => total + skin.count, 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(
                            skinsData.teamSkins.reduce((total, skin) => total + skin.count * skinsData.skinValue, 0)
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">
                  No skins have been awarded for this tournament yet.
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
