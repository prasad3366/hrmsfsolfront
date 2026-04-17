import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../hooks/useTeam';
import ApiService, { Team, TeamMember } from '../../services/api';
import { CreateTeamModal } from '../../components/team/CreateTeamModal';
import { AddMembersModal } from '../../components/team/AddMembersModal';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/components';
import { Users, User, Crown, RefreshCw, Plus, AlertCircle } from 'lucide-react';

const TeamManagement: React.FC = () => {
  const { user } = useAuth();
  const { getAllMyTeams, getMyTeam, isLoading, error, team, teams, deleteTeam, removeTeamMember } = useTeam();
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const formatManagerName = (team: Team) => {
    const manager = team.manager;
    if (!manager) {
      return (team as any).managerName || 'N/A';
    }
    if (typeof manager === 'string') {
      return manager;
    }
    const fullName = `${manager.firstName || ''} ${manager.lastName || ''}`.trim();
    return fullName || manager.name || (team as any).managerName || manager.empCode || 'N/A';
  };

  const formatMemberName = (member: TeamMember) => {
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
    return fullName || member.name || member.empCode || 'Unknown';
  };

  const getMembersCount = (team: Team) => {
    if (Array.isArray(team.members)) return team.members.length;
    return team.membersCount ?? 0;
  };

  const getCreatedDate = (team: Team) => {
    const dateValue = team.createdAt || team.updatedAt || team.created_at || team.updated_at || (team as any).created;
    return dateValue ? new Date(dateValue).toLocaleDateString() : 'N/A';
  };
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const canManageTeams = user?.role === 'ADMIN' || user?.role === 'HR';
  const isManager = user?.role === 'MANAGER';

  const refreshManagerTeams = async () => {
    if (!user?.employeeId) {
      console.warn('[Team.tsx] Manager employeeId not available yet. Waiting for profile load.');
      return;
    }
    await getAllMyTeams();
  };

  useEffect(() => {
    if (canManageTeams) {
      fetchAllTeams();
    } else if (isManager && user?.employeeId) {
      getAllMyTeams();
    }
  }, [canManageTeams, isManager, user?.employeeId]);

  const fetchAllTeams = async () => {
    setLoadingTeams(true);
    setFetchError(null);
    try {
      const teamsData = await ApiService.getAllTeams();
      console.log(`📊 [Team.tsx.fetchAllTeams] Received ${teamsData.length} teams`);
      
      // Log details for each team
      teamsData.forEach((team, index) => {
        console.log(`   Team ${index + 1}: "${team.name}" (ID: ${team.id}) - ${team.members?.length || 0} members`);
        if (team.members && team.members.length > 0) {
          console.log(`     Members: ${team.members.map(m => `${m.name || m.firstName + ' ' + m.lastName} (${m.id})`).join(', ')}`);
        }
      });
      
      setAllTeams(teamsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load teams';
      console.error('❌ [Team.tsx.fetchAllTeams] Error:', message);
      setFetchError(message);
      setAllTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleTeamCreated = (createdTeam?: Team) => {
    setIsCreateModalOpen(false);
    // Refresh teams from backend to ensure all data is synced
    if (createdTeam) {
      fetchAllTeams();
    }
  };

  const handleMembersAdded = () => {
    setIsAddMembersModalOpen(false);
    setSelectedTeam(null);
    console.log('🔄 [Team.tsx] Members added modal closed, refreshing team data...');
    if (canManageTeams) {
      fetchAllTeams();
    } else if (isManager) {
      getAllMyTeams();
    }
  };

  const handleAddMembers = (team: Team) => {
    setSelectedTeam(team);
    setIsAddMembersModalOpen(true);
  };

  const handleDeleteTeam = async (teamId: number | string) => {
    console.log('🗑️ [Team.tsx.handleDeleteTeam] Attempting to delete team with ID:', teamId, typeof teamId);
    if (!window.confirm('Are you sure you want to delete this team? This will remove team assignment from all members.')) {
      return;
    }

    const deleted = await deleteTeam(teamId);
    if (deleted) {
      if (canManageTeams) {
        fetchAllTeams();
      } else if (isManager) {
        getAllMyTeams();
      }
    }
  };

  const renderManagerView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Teams</h1>
          <p className="text-gray-600">Manage your assigned teams</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              refreshManagerTeams();
            }}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={async () => {
              console.log('🔍 Testing API directly...');
              try {
                const response = await ApiService.getMyTeam();
                console.log('🔍 Direct API response:', JSON.stringify(response, null, 2));
                alert(`API Response:\n${JSON.stringify(response, null, 2)}`);
              } catch (err) {
                console.error('🔍 API test failed:', err);
                alert(`API Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
              }
            }}
            variant="outline"
            size="sm"
          >
            Debug API
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Error Loading Teams</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            {error.includes('Employee ID') && (
              <p className="text-xs text-red-500 mt-2">
                💡 Your account may not be properly linked. Please log out and log back in, or contact HR.
              </p>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading your teams...
          </CardContent>
        </Card>
      ) : teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((teamData) => (
            <Card key={teamData.id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  {teamData.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">Manager:</span>
                    <span>{formatManagerName(teamData)}</span>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Team Members ({getMembersCount(teamData)})</h3>
                    {teamData.members && teamData.members.length > 0 ? (
                      <div className="space-y-2">
                        {teamData.members.map((member: any) => (
                          <div key={member.id ?? `${member.empCode || member.name}-${Math.random()}`} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                            <User className="w-4 h-4 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{formatMemberName(member)}</p>
                              <p className="text-xs text-gray-500">ID: {member.id || member.empCode || 'N/A'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No team members yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Assigned</h3>
            <p className="text-gray-500 text-center">
              You don't have any teams assigned yet. Please contact HR for team assignment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAdminView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600">Create and manage teams</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fetchAllTeams()}
            variant="outline"
            disabled={loadingTeams}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingTeams ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#2A4B9B] hover:bg-[#1e3a7b] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </div>
      </div>

      {fetchError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Failed to Load Teams</p>
            <p className="text-sm text-red-600 mt-1">{fetchError}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Teams</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTeams ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading teams...
            </div>
          ) : allTeams.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Created</h3>
              <p className="text-gray-500">Create your first team to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {allTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{formatManagerName(team)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getMembersCount(team)} members
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getCreatedDate(team)}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMembers(team)}
                      >
                        Add Members
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTeam(team.id)}
                      >
                        Delete Team
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleTeamCreated}
      />

      {selectedTeam && (
        <AddMembersModal
          isOpen={isAddMembersModalOpen}
          onClose={() => setIsAddMembersModalOpen(false)}
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          currentMembers={selectedTeam.members?.map(m => m.id) || []}
          teamMembers={selectedTeam.members}
          onSuccess={handleMembersAdded}
        />
      )}
    </div>
  );

  if (canManageTeams) {
    return renderAdminView();
  }

  return renderManagerView();
};

export default TeamManagement;