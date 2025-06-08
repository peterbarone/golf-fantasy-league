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

interface TournamentDetailProps {
  tournamentId: string;
}

export default function TournamentDetail({ tournamentId }: TournamentDetailProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
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
    loadTournament();
  }, [tournamentId]);
  
  const loadTournament = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      
      if (response.ok) {
        const data = await response.json();
        setTournament(data);
        setFormData({
          name: data.name,
          startDate: data.startDate.split('T')[0], // Format date for input
          endDate: data.endDate.split('T')[0],
          isMajor: data.isMajor,
          isWGC: data.isWGC,
          isMatchPlay: data.isMatchPlay,
          isActive: data.isActive,
        });
      } else {
        toast.error('Failed to load tournament');
      }
    } catch (error) {
      console.error('Error loading tournament:', error);
      toast.error('An error occurred while loading the tournament');
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
  
  const handleCalculatePoints = async () => {
    try {
      setIsCalculating(true);
      
      const response = await fetch(`/api/tournaments/${tournamentId}/calculate-points`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('Points calculated successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to calculate points');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error calculating points');
    } finally {
      setIsCalculating(false);
    }
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
      
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast.success('Tournament updated successfully!');
        setIsEditing(false);
        loadTournament();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update tournament');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error updating tournament');
    } finally {
      setIsSubmitting(false);
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
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!tournament) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-500">Tournament not found</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      {!isEditing ? (
        <>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{tournament.name}</h2>
              <p className="text-gray-600">
                {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
              </p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit Tournament
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">Tournament Details</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    tournament.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tournament.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {tournament.isMajor && (
                    <span className="px-2 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                      Major
                    </span>
                  )}
                  {tournament.isWGC && (
                    <span className="px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      WGC
                    </span>
                  )}
                  {tournament.isMatchPlay && (
                    <span className="px-2 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                      Match Play
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Edit Tournament</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Tournament Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isMajor"
                    name="isMajor"
                    checked={formData.isMajor}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="isMajor" className="ml-2 text-sm text-gray-700">
                    Major Tournament
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isWGC"
                    name="isWGC"
                    checked={formData.isWGC}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="isWGC" className="ml-2 text-sm text-gray-700">
                    World Golf Championship
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isMatchPlay"
                    name="isMatchPlay"
                    checked={formData.isMatchPlay}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="isMatchPlay" className="ml-2 text-sm text-gray-700">
                    Match Play Format
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Active Tournament
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleCalculatePoints}
              disabled={isCalculating}
              className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ${
                isCalculating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isCalculating ? 'Calculating...' : 'Calculate Points'}
            </button>
            
            <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
