'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  team?: {
    id: string;
    name: string;
  } | null;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('');
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OWNER',
  });
  
  useEffect(() => {
    loadUsers();
  }, [roleFilter]);
  
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const url = roleFilter ? `/api/users?role=${roleFilter}` : '/api/users';
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('An error occurred while loading users');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.password) {
      toast.error('Email and password are required');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('User created successfully');
        setUsers([...users, data]);
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'OWNER',
        });
        setShowCreateForm(false);
      } else {
        const error = await response.json();
        toast.error(`Failed to create user: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('An error occurred while creating the user');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success(`User "${userEmail}" deleted successfully`);
        setUsers(users.filter(user => user.id !== userId));
      } else {
        const error = await response.json();
        toast.error(`Failed to delete user: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('An error occurred while deleting the user');
    }
  };
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'OWNER':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-xl font-semibold mb-2 md:mb-0">Users</h2>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <div className="flex items-center">
            <label htmlFor="roleFilter" className="text-sm mr-2">Filter by role:</label>
            <select
              id="roleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="p-1 text-sm border border-gray-300 rounded"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="OWNER">Owner</option>
            </select>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700"
          >
            {showCreateForm ? 'Cancel' : 'Add New User'}
          </button>
        </div>
      </div>
      
      {showCreateForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-3">Create New User</h3>
          <form onSubmit={handleCreateUser}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="p-2 border border-gray-300 rounded w-full"
                placeholder="Optional"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="p-2 border border-gray-300 rounded w-full"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                Password *
              </label>
              <input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="p-2 border border-gray-300 rounded w-full"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">
                Role
              </label>
              <select
                id="role"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="p-2 border border-gray-300 rounded w-full"
              >
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded mr-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {users.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-yellow-700">No users found. Create a new user to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name / Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name || '—'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.team ? (
                      <a href={`/dashboard/admin/teams?id=${user.team.id}`} className="text-blue-600 hover:text-blue-800">
                        {user.team.name}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={`/dashboard/admin/users/${user.id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">
                      Edit
                    </a>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="text-red-600 hover:text-red-900"
                      disabled={user.role === 'ADMIN'}
                    >
                      Delete
                    </button>
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
