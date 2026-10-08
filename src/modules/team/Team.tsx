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
  const { getAllMyTeams, isLoading, error, teams, deleteTeam } = useTeam();
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

  const canManageTeams = ['SUPER_ADMIN', 'CEO', 'HR'].includes(user?.role ?? '');
  const isManager = ['IT_MANAGER', 'SALES_MANAGER', 'FINANCE_MANAGER'].includes(user?.role ?? '');

  const refreshManagerTeams = async () => {
    await getAllMyTeams();
  };

  useEffect(() => {
    if (canManageTeams) {
      fetchAllTeams();
    } else if (isManager || user?.role === 'EMPLOYEE') {
      getAllMyTeams();
    }
  }, [canManageTeams, isManager, user?.role]);

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
    if (!globalThis.confirm('Are you sure you want to delete this team? This will remove team assignment from all members.')) {
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
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b08a3e]">People</p>
          <h1 className="text-2xl font-bold tracking-tight text-[#073b5c] sm:text-3xl">My Teams</h1>
          <p className="mt-1 text-sm text-[#617984]">Manage your assigned teams</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {teams.map((teamData) => (
            <Card key={teamData.id} className="min-w-0">
              <CardHeader>
                <CardTitle className="flex min-w-0 items-center text-[#073b5c]">
                  <Users className="mr-2 h-5 w-5 shrink-0 text-[#1e627d]" />
                  <span className="truncate">{teamData.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
                    <Crown className="h-4 w-4 shrink-0 text-[#b08a3e]" />
                    <span className="font-semibold text-[#12354a]">Manager:</span>
                    <span className="min-w-0 break-words text-[#486271]">{formatManagerName(teamData)}</span>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Team Members ({getMembersCount(teamData)})</h3>
                    {teamData.members && teamData.members.length > 0 ? (
                      <div className="space-y-2">
                        {teamData.members.map((member: any) => (
                          <div key={member.id ?? `${member.empCode || member.name}-${Math.random()}`} className="flex min-w-0 items-center gap-2 rounded-lg bg-[#f6faf9] p-2">
                            <User className="h-4 w-4 shrink-0 text-[#78909a]" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[#12354a]">{formatMemberName(member)}</p>
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
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b08a3e]">People</p>
          <h1 className="text-2xl font-bold tracking-tight text-[#073b5c] sm:text-3xl">Team Management</h1>
          <p className="mt-1 text-sm text-[#617984]">Create and manage teams</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
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
            variant="gold"
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

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-[#e4ecec]">
          <CardTitle className="text-[#073b5c]">All Teams</CardTitle>
          {!loadingTeams && allTeams.length > 0 && <Badge variant="blue">{allTeams.length} teams</Badge>}
        </CardHeader>
        <CardContent className="min-w-0">
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
            <Table className="min-w-[46rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {allTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="max-w-[16rem] break-words font-semibold text-[#12354a]">{team.name}</TableCell>
                    <TableCell className="max-w-[14rem] break-words">{formatManagerName(team)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="default">
                        {getMembersCount(team)} members
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getCreatedDate(team)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMembers(team)}
                      >
                        Add Members
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteTeam(team.id)}
                      >
                        Delete Team
                      </Button>
                      </div>
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