import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Globe, Settings } from 'lucide-react';
import { EnvironmentProfile, CreateEnvironmentProfileData } from '../../types';
import { environmentService } from '../../services/environmentService';
import { CreateEnvironmentModal } from './CreateEnvironmentModal';

interface EnvironmentSelectorProps {
  selectedProfile: EnvironmentProfile | null;
  onProfileSelect: (profile: EnvironmentProfile) => void;
}

export const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({
  selectedProfile,
  onProfileSelect
}) => {
  const [profiles, setProfiles] = useState<EnvironmentProfile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockProfiles: EnvironmentProfile[] = [
        {
          id: '1',
          name: 'Development',
          clientId: 'dev-client-123',
          url: 'https://dev-api.example.com',
          createdAt: new Date().toISOString(),
          createdBy: 'admin@example.com'
        },
        {
          id: '2',
          name: 'Production',
          clientId: 'prod-client-456',
          url: 'https://api.example.com',
          createdAt: new Date().toISOString(),
          createdBy: 'admin@example.com'
        }
      ];
      
      setProfiles(mockProfiles);
      
      // Auto-select first profile if none selected
      if (!selectedProfile && mockProfiles.length > 0) {
        onProfileSelect(mockProfiles[0]);
      }
    } catch (error) {
      console.error('Failed to fetch environment profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (profileData: CreateEnvironmentProfileData) => {
    try {
      // Mock creation - replace with actual API call
      const newProfile: EnvironmentProfile = {
        id: Date.now().toString(),
        ...profileData,
        createdAt: new Date().toISOString(),
        createdBy: 'current-user@example.com'
      };
      
      setProfiles(prev => [...prev, newProfile]);
      onProfileSelect(newProfile);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create environment profile:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="w-4 h-4 bg-gray-300 rounded"></div>
        <div className="w-24 h-4 bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
        >
          <div className="flex items-center space-x-2 min-w-0">
            <Globe size={16} className="text-gray-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 truncate">
              {selectedProfile ? selectedProfile.name : 'Select Environment'}
            </span>
          </div>
          <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            <div className="p-2">
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus size={16} />
                <span>Create New Environment</span>
              </button>
            </div>
            
            {profiles.length > 0 && (
              <>
                <div className="border-t border-gray-100"></div>
                <div className="p-2 space-y-1">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => {
                        onProfileSelect(profile);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-start space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        selectedProfile?.id === profile.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Settings size={16} className="mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{profile.name}</div>
                        <div className="text-xs text-gray-500 truncate">{profile.url}</div>
                        <div className="text-xs text-gray-400">Client: {profile.clientId}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateEnvironmentModal
          onClose={() => setShowCreateModal(false)}
          onCreateProfile={handleCreateProfile}
        />
      )}
    </>
  );
};