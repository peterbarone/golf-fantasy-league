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

export default function TournamentManagement() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isMajor: false,
    isWGC: false,
    isMatchPlay: false,
    isActive: false,
  });
  
  useEffect(() => {
    loadTournaments();
  }, []);
  
  const loadTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tournaments');
      
      if (response.ok) {
        const data = await response.json();
        setTournaments(data);
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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Input validation
      if (!formData.name || !formData.startDate || !formData.endDate) {
        toast.error('Name, start date, and end date are required');
        return;
      }
      
      // Simple date validation
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate < startDate) {
        toast.error('End date cannot be before start date');
        return;
      }
      
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast.success('Tournament created successfully!');
        setFormData({
          name: '',
          startDate: '',
          endDate: '',
          isMajor: false,
          isWGC: false,
          isMatchPlay: false,
          isActive: false,
        });
        setIsCreating(false);
        loadTournaments();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tournament');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error creating tournament');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSetActive = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: true }),
      });
      
      if (response.ok) {
        toast.success('Tournament activated successfully');
        loadTournaments();
      } else {
        toast.error('Failed to activate tournament');
      }
    } catch (error) {
      console.error('Error activating tournament:', error);
      toast.error('An error occurred while activating tournament');
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Tournament Management</h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {isCreating ? 'Cancel' : 'Create Tournament'}
        </button>
      </div>
      
      {isCreating && (
        <div className="mb-6 p-4 border border-gray-200 rounded-md">
          <h3 className="text-lg font-medium mb-3">Create New Tournament</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tournament Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isMajor"
                  id="isMajor"
                  checked={formData.isMajor}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="isMajor" className="ml-2 text-sm text-gray-700">
                  Major Tournament
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isWGC"
                  id="isWGC"
                  checked={formData.isWGC}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="isWGC" className="ml-2 text-sm text-gray-700">
                  WGC Tournament
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isMatchPlay"
                  id="isMatchPlay"
                  checked={formData.isMatchPlay}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="isMatchPlay" className="ml-2 text-sm text-gray-700">
                  Match Play
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Set as Active
                </label>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Creating...' : 'Create Tournament'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tournaments.map((tournament) => (
              <tr key={tournament.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {tournament.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tournament.isMajor && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 mr-1">
                      Major
                    </span>
                  )}
                  {tournament.isWGC && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 mr-1">
                      WGC
                    </span>
                  )}
                  {tournament.isMatchPlay && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Match Play
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tournament.isActive ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <a
                      href={`/dashboard/admin/tournaments/${tournament.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Manage
                    </a>
                    {!tournament.isActive && (
                      <button
                        onClick={() => handleSetActive(tournament.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Set Active
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            
            {tournaments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No tournaments found. Create a new tournament to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
