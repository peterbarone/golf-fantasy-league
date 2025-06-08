'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Golfer {
  id: string;
  name: string;
  pgaId: string;
  active: boolean;
}

export default function GolferManagement() {
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterActive, setFilterActive] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    pgaId: '',
    active: true,
  });
  
  useEffect(() => {
    loadGolfers();
  }, [filterActive]);
  
  const loadGolfers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/golfers?active=${filterActive}`);
      
      if (response.ok) {
        const data = await response.json();
        setGolfers(data);
      } else {
        toast.error('Failed to load golfers');
      }
    } catch (error) {
      console.error('Error loading golfers:', error);
      toast.error('An error occurred while loading golfers');
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
      
      if (!formData.name) {
        toast.error('Golfer name is required');
        return;
      }
      
      const response = await fetch('/api/golfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast.success('Golfer created successfully!');
        setFormData({
          name: '',
          pgaId: '',
          active: true,
        });
        setIsCreating(false);
        loadGolfers();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create golfer');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error creating golfer');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleToggleActive = async (golfer: Golfer) => {
    try {
      const response = await fetch(`/api/golfers/${golfer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !golfer.active }),
      });
      
      if (response.ok) {
        toast.success(`${golfer.name} ${golfer.active ? 'deactivated' : 'activated'} successfully`);
        loadGolfers();
      } else {
        toast.error('Failed to update golfer');
      }
    } catch (error) {
      console.error('Error updating golfer:', error);
      toast.error('An error occurred while updating golfer');
    }
  };
  
  // Filter golfers based on search term
  const filteredGolfers = golfers.filter(golfer => 
    golfer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    golfer.pgaId.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
        <h2 className="text-xl font-semibold">Golfer Management</h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {isCreating ? 'Cancel' : 'Add Golfer'}
        </button>
      </div>
      
      {isCreating && (
        <div className="mb-6 p-4 border border-gray-200 rounded-md">
          <h3 className="text-lg font-medium mb-3">Add New Golfer</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Golfer Name
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
                  PGA ID (Optional)
                </label>
                <input
                  type="text"
                  name="pgaId"
                  value={formData.pgaId}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Will be auto-generated if empty"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  id="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                  Active Golfer
                </label>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Adding...' : 'Add Golfer'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setFilterActive(true)}
            className={`px-3 py-1 rounded ${filterActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Active
          </button>
          <button 
            onClick={() => setFilterActive(false)}
            className={`px-3 py-1 rounded ${!filterActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            All Golfers
          </button>
        </div>
        
        <div>
          <input
            type="text"
            placeholder="Search golfers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border border-gray-300 rounded w-full sm:w-auto"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PGA ID
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
            {filteredGolfers.map((golfer) => (
              <tr key={golfer.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {golfer.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {golfer.pgaId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {golfer.active ? (
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
                  <button
                    onClick={() => handleToggleActive(golfer)}
                    className={`text-${golfer.active ? 'red' : 'green'}-600 hover:text-${golfer.active ? 'red' : 'green'}-800 mr-3`}
                  >
                    {golfer.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            
            {filteredGolfers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No golfers found. {searchTerm ? 'Try a different search term.' : 'Add a new golfer to get started.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredGolfers.length} of {golfers.length} golfers
      </div>
    </div>
  );
}
