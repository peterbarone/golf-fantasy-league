'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface ProfileFormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserProfile() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [passwordChangeMode, setPasswordChangeMode] = useState(false);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
    }
  }, [session]);
  
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/profile`);
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const error = await response.json();
        toast.error(`Failed to load profile: ${error.error}`);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('An error occurred while loading your profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const validateForm = () => {
    if (passwordChangeMode) {
      if (!formData.currentPassword) {
        toast.error('Current password is required');
        return false;
      }
      
      if (formData.newPassword.length < 8) {
        toast.error('New password must be at least 8 characters');
        return false;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('New passwords do not match');
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      const payload = {
        name: formData.name,
        ...(passwordChangeMode && {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      };
      
      const response = await fetch(`/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        toast.success('Profile updated successfully');
        
        // Update the session with new data
        await update({
          ...session,
          user: {
            ...session?.user,
            name: updatedUser.name,
          },
        });
        
        // Reset password fields
        if (passwordChangeMode) {
          setFormData({
            ...formData,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          setPasswordChangeMode(false);
        }
      } else {
        const error = await response.json();
        toast.error(`Failed to update profile: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating your profile');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!userData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-500">Failed to load user profile. Please try refreshing the page.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">User Profile</h2>
        <p className="text-gray-600">Update your personal information and password</p>
      </div>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-md font-medium mb-2">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{userData.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-medium">
              <span className={`px-2 py-1 text-xs rounded-full ${
                userData.role === 'ADMIN' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {userData.role}
              </span>
            </p>
          </div>
          {userData.team && (
            <div>
              <p className="text-sm text-gray-500">Team</p>
              <p className="font-medium">{userData.team.name}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Member Since</p>
            <p className="font-medium">
              {new Date(userData.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <h3 className="text-md font-medium mb-4">Edit Profile</h3>
        
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setPasswordChangeMode(!passwordChangeMode)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {passwordChangeMode ? 'Cancel Password Change' : 'Change Password'}
          </button>
        </div>
        
        {passwordChangeMode && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <h4 className="text-sm font-medium mb-3">Change Password</h4>
            
            <div className="mb-4">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                required={passwordChangeMode}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                required={passwordChangeMode}
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                required={passwordChangeMode}
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
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
