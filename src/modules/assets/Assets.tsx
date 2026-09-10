import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal, Search, Filter, Download, History } from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  Badge,
} from '../../components/ui/components';
import { useAssets } from '../../hooks/useAssets';
import ApiService, { type Asset } from '../../services/api';
import { CreateAssetModal } from '../../components/assets/CreateAssetModal';
import { AssignAssetModal } from '../../components/assets/AssignAssetModal';
import { getAssetActions } from './asset-actions';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { EditAssetModal } from '../../components/assets/EditAssetModal';

const getAssetAssignedLabel = (asset: any): string => {
  if (asset.user?.firstName && asset.user?.lastName) {
    return `${asset.user.firstName} ${asset.user.lastName}`;
  }
  if (asset.user?.email) {
    return asset.user.email;
  }
  if (asset.assignedTo) {
    return `User #${asset.assignedTo}`;
  }
  return '-';
};

const renderAssetStatusBadge = (asset: any) => {
  if (asset.status === 'RETURNED') {
    return (
      <Badge variant="default" className="bg-gray-200 text-gray-800 border-none">
        Returned
      </Badge>
    );
  }

  if (asset.status === 'ASSIGNED') {
    return (
      <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-none inline-flex items-center whitespace-nowrap">
        <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 inline-block" />
        <span>Assigned</span>
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="bg-amber-100 text-amber-800 border-none">
      Unassigned
    </Badge>
  );
};

const Assets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { assets, isLoading, error, fetchAssets, fetchMyAssets, createAsset, assignAsset, returnAsset, updateAsset } = useAssets();
  const { addNotification } = useNotifications();
  const isAssetAdministrator = ['SUPER_ADMIN', 'CEO', 'HR'].includes(user?.role ?? '');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<'assign' | 'reassign'>('assign');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  useEffect(() => {
    if (isAssetAdministrator) {
      fetchAssets();
    } else {
      fetchMyAssets();
    }
  }, [fetchAssets, fetchMyAssets, isAssetAdministrator]);

  const filteredAssets = (assets || []).filter((asset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const assetContent = isLoading ? (
    <div className="p-8 text-center text-slate-500">Loading assets...</div>
  ) : error ? (
    <div className="p-8 text-center text-red-600">{error}</div>
  ) : filteredAssets.length === 0 ? (
    <div className="p-8 text-center text-slate-500">
      {searchTerm ? 'No assets found matching your search.' : 'No assets created yet.'}
    </div>
  ) : (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Assigned Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <tbody>
        {filteredAssets.map((asset) => (
          <TableRow key={asset.id} className="hover:bg-slate-50">
            <TableCell className="font-medium">{asset.name}</TableCell>
            <TableCell className="text-sm text-slate-600">{asset.description || '-'}</TableCell>
            <TableCell className="text-sm">{getAssetAssignedLabel(asset)}</TableCell>
            <TableCell className="text-sm">
              {asset.assignedAt ? new Date(asset.assignedAt).toLocaleDateString() : '-'}
            </TableCell>
            <TableCell className="text-sm">{renderAssetStatusBadge(asset)}</TableCell>
            <TableCell className="text-sm">
              {new Date(asset.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex gap-2 justify-end">
                {isAssetAdministrator && getAssetActions(asset as Asset).includes('assign') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedAssetId(asset.id);
                      setAssignmentMode('assign');
                      setIsAssignModalOpen(true);
                    }}
                  >
                    Assign
                  </Button>
                )}
                {isAssetAdministrator && getAssetActions(asset as Asset).includes('reassign') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedAssetId(asset.id);
                      setAssignmentMode('reassign');
                      setIsAssignModalOpen(true);
                    }}
                  >
                    Reassign
                  </Button>
                )}
                {isAssetAdministrator && getAssetActions(asset as Asset).includes('return') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReturnAsset(asset.id)}
                  >
                    Return
                  </Button>
                )}
                {isAssetAdministrator && (
                  <Button variant="ghost" size="icon" aria-label="Edit asset" onClick={() => setEditingAsset(asset as Asset)}>
                    <MoreHorizontal size={18} />
                  </Button>
                )}
                {isAssetAdministrator && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="View assignment history"
                    onClick={async () => {
                      const history = await ApiService.getAssetHistory(asset.id);
                      window.alert(history.map((entry) => `${entry.user?.email || `User #${entry.assignedTo}`} - ${new Date(entry.assignedAt).toLocaleString()}`).join('\n') || 'No assignment history.');
                    }}
                  >
                    <History size={18} />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );

  const handleCreateAsset = async (data: any) => {
    try {
      await createAsset(data);
      addNotification({
        type: 'other',
        title: 'Asset Created',
        message: `Asset "${data.name}" has been created successfully.`,
      });
      
      // Close modal and navigate to employee profile if asset was assigned
      setIsCreateModalOpen(false);
      if (data.assignedTo) {
        setTimeout(() => {
          navigate(`/employees/${data.assignedTo}`);
        }, 500);
      }
    } catch (err) {
      addNotification({
        type: 'other',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to create asset',
      });
      throw err;
    }
  };

  const handleAssignAsset = async (data: { assetId: number; employeeId: number }) => {
    try {
      await assignAsset(data);
      addNotification({
        type: 'other',
        title: 'Asset Assigned',
        message: 'Asset has been assigned successfully.',
      });
      
      // Close modal and navigate to employee profile
      setIsAssignModalOpen(false);
      setSelectedAssetId(null);
      setTimeout(() => {
        navigate(`/employees/${data.employeeId}`);
      }, 500);
    } catch (err) {
      addNotification({
        type: 'other',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to assign asset',
      });
      throw err;
    }
  };

  const handleReturnAsset = async (assetId: number) => {
    try {
      await returnAsset(assetId);
      addNotification({
        type: 'other',
        title: 'Asset Returned',
        message: 'Asset has been returned successfully.',
      });
    } catch (err) {
      addNotification({
        type: 'other',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to return asset',
      });
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assets</h1>
          <p className="text-slate-500">Manage organizational assets and equipment</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download size={16} /> Export
          </Button>
          {isAssetAdministrator && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
              <Plus size={16} /> Add Asset
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <Input
                placeholder="Search by name, description..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter size={16} /> Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">{assetContent}</CardContent>
      </Card>

      {isAssetAdministrator && <CreateAssetModal
        isOpen={isCreateModalOpen}
        isLoading={isLoading}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateAsset}
      />}

      <EditAssetModal
        asset={editingAsset}
        isLoading={isLoading}
        onClose={() => setEditingAsset(null)}
        onSubmit={async (data) => {
          await updateAsset(editingAsset!.id, data);
        }}
      />

      <AssignAssetModal
        isOpen={isAssignModalOpen}
        assetId={selectedAssetId ?? undefined}
        mode={assignmentMode}
        isLoading={isLoading}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedAssetId(null);
          setAssignmentMode('assign');
        }}
        onSubmit={handleAssignAsset}
      />
    </div>
  );
};

export default Assets;
