import { useState, useCallback } from 'react';
import ApiService, { Team, CreateTeamDto, AddMembersDto } from '../services/api';

export interface UseTeamReturn {
  isLoading: boolean;
  error: string | null;
  success: string | null;
  team: Team | null;
  teams: Team[];
  createTeam: (team: CreateTeamDto) => Promise<Team | null>;
  addMembers: (teamId: number, members: AddMembersDto) => Promise<any>;
  removeTeamMember: (teamId: number | string, employeeId: number) => Promise<boolean>;
  deleteTeam: (teamId: number | string) => Promise<boolean>;
  getMyTeam: () => Promise<Team | null>;
  getAllMyTeams: () => Promise<Team[]>;
  reset: () => void;
}

/**
 * Hook for managing team operations with loading and error states
 */
export const useTeam = (): UseTeamReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  const createTeam = async (teamData: CreateTeamDto): Promise<Team | null> => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await ApiService.createTeam(teamData);
      setSuccess('Team created successfully');
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create team';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const addMembers = async (teamId: number, members: AddMembersDto): Promise<any> => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await ApiService.addMembers(teamId, members);
      setSuccess('Members added successfully');
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add members';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const removeTeamMember = async (teamId: number | string, employeeId: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await ApiService.removeTeamMember(teamId, employeeId);
      setSuccess('Member removed successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTeam = async (teamId: number | string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await ApiService.deleteTeam(teamId);
      setSuccess('Team deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete team';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getAllMyTeams = async (): Promise<Team[]> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 [useTeam.getAllMyTeams] Fetching teams from API...');
      const response = await ApiService.getMyTeam();
      console.log('📊 [useTeam.getAllMyTeams] Raw response:', response);
      
      // Backend returns array of teams for managers
      if (Array.isArray(response)) {
        console.log(`📊 [useTeam.getAllMyTeams] Received ${response.length} teams:`);
        response.forEach((team, index) => {
          console.log(`   Team ${index + 1}: ${team.name} (${team.members?.length || 0} members)`);
        });
        setTeams(response);
        return response;
      } else if (response) {
        // Fallback for single team response (shouldn't happen with new backend)
        console.log('📊 [useTeam.getAllMyTeams] Received single team, converting to array');
        setTeams([response]);
        setTeam(response);
        return [response];
      } else {
        console.log('📊 [useTeam.getAllMyTeams] No teams found');
        setTeams([]);
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch teams';
      console.error('❌ [useTeam.getAllMyTeams] Error:', errorMessage);
      setError(errorMessage);
      setTeams([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getMyTeam = async (): Promise<Team | null> => {
    // Wrapper for backwards compatibility - calls getAllMyTeams
    const allTeams = await getAllMyTeams();
    return allTeams.length > 0 ? allTeams[0] : null;
  };

  const reset = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    isLoading,
    error,
    success,
    team,
    teams,
    createTeam,
    addMembers,
    removeTeamMember,
    deleteTeam,
    getMyTeam,
    getAllMyTeams,
    reset,
  };
};