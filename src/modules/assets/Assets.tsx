import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal, Search, Filter, Download } from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  Badge,
} from '../../components/ui/components';
import { useAssets } from '../../hooks/useAssets';
import { CreateAssetModal } from '../../components/assets/CreateAssetModal';
import { AssignAssetModal } from '../../components/assets/AssignAssetModal';
import { useNotifications } from '../../context/NotificationContext';

const Assets = () => {
  const navigate = useNavigate();
  const { assets, isLoading, fetchAssets, createAsset, assignAsset, returnAsset } = useAssets();
  const { addNotification } = useNotifications();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const filteredAssets = (assets || []).filter((asset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.type?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const handleCreateAsset = async (data: any) => {
    try {
      await createAsset(data);
      addNotification({
        type: 'success',
        title: 'Asset Created',
        message: `Asset "${data.name}" has been created successfully.`,
      });
    } catch (err) {
      addNotification({
        type: 'error',
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
        type: 'success',
        title: 'Asset Assigned',
        message: 'Asset has been assigned successfully.',
      });
    } catch (err) {
      addNotification({
        type: 'error',
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
        type: 'success',
        title: 'Asset Returned',
        message: 'Asset has been returned successfully.',
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to return asset',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'ASSIGNED':
        return 'default';
      case 'MAINTENANCE':
        return 'warning';
      case 'RETIRED':
        return 'danger';
      default:
        return 'default';
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
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus size={16} /> Add Asset
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <Input
                placeholder="Search by name, tag..."
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
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading assets...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {searchTerm ? 'No assets found matching your search.' : 'No assets created yet.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Brand/Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell className="text-sm text-slate-600">{asset.assetTag}</TableCell>
                    <TableCell className="text-sm">{asset.type}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {asset.brand && asset.model ? `${asset.brand} ${asset.model}` : asset.brand || asset.model || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(asset.status)}>{asset.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {asset.status === 'AVAILABLE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAssetId(asset.id);
                              setIsAssignModalOpen(true);
                            }}
                          >
                            Assign
                          </Button>
                        )}
                        {asset.status === 'ASSIGNED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReturnAsset(asset.id)}
                          >
                            Return
                          </Button>
                        )}
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal size={18} />
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

      <CreateAssetModal
        isOpen={isCreateModalOpen}
        isLoading={isLoading}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateAsset}
      />

      <AssignAssetModal
        isOpen={isAssignModalOpen}
        assetId={selectedAssetId ?? undefined}
        isLoading={isLoading}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedAssetId(null);
        }}
        onSubmit={handleAssignAsset}
      />
    </div>
  );
};

export default Assets;
