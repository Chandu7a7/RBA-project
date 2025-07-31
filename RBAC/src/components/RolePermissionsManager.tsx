import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Link, Unlink } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface Permission {
  id: string;
  name: string;
  description: string | null;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
  role: { name: string };
  permission: { name: string };
}

export function RolePermissionsManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesResult, permissionsResult, rolePermissionsResult] = await Promise.all([
        supabase.from('roles').select('*').order('name'),
        supabase.from('permissions').select('*').order('name'),
        supabase
          .from('role_permissions')
          .select(`
            role_id,
            permission_id,
            roles!inner(name),
            permissions!inner(name)
          `)
      ]);

      if (rolesResult.error) throw rolesResult.error;
      if (permissionsResult.error) throw permissionsResult.error;
      if (rolePermissionsResult.error) throw rolePermissionsResult.error;

      setRoles(rolesResult.data || []);
      setPermissions(permissionsResult.data || []);
      setRolePermissions(rolePermissionsResult.data?.map(rp => ({
        role_id: rp.role_id,
        permission_id: rp.permission_id,
        role: { name: (rp.roles as any).name },
        permission: { name: (rp.permissions as any).name }
      })) || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPermissions = async () => {
    if (!selectedRole || selectedPermissions.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a role and at least one permission',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Remove existing permissions for this role
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', selectedRole);

      // Add new permissions
      const insertData = selectedPermissions.map(permissionId => ({
        role_id: selectedRole,
        permission_id: permissionId
      }));

      const { error } = await supabase
        .from('role_permissions')
        .insert(insertData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Permissions assigned successfully',
      });

      setIsDialogOpen(false);
      setSelectedRole('');
      setSelectedPermissions([]);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemovePermission = async (roleId: string, permissionId: string) => {
    try {
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .eq('permission_id', permissionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Permission removed successfully',
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getRolePermissions = (roleId: string) => {
    return rolePermissions.filter(rp => rp.role_id === roleId);
  };

  const openAssignDialog = () => {
    setSelectedRole('');
    setSelectedPermissions([]);
    setIsDialogOpen(true);
  };

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    // Pre-select existing permissions for this role
    const existingPermissions = getRolePermissions(roleId).map(rp => rp.permission_id);
    setSelectedPermissions(existingPermissions);
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  if (loading) {
    return <div>Loading role permissions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Role-Permission Mapping
            </CardTitle>
            <CardDescription>
              Assign permissions to roles
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAssignDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Assign Permissions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign Permissions to Role</DialogTitle>
                <DialogDescription>
                  Select a role and choose which permissions to assign to it.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="role-select">Select Role</label>
                  <Select value={selectedRole} onValueChange={handleRoleSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedRole && (
                  <div className="grid gap-2">
                    <label>Select Permissions</label>
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-lg p-3">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={(checked) => 
                              handlePermissionToggle(permission.id, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={permission.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permission.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleAssignPermissions}>
                  Assign Permissions
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {roles.map((role) => {
            const rolePerms = getRolePermissions(role.id);
            return (
              <div key={role.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{role.name}</h3>
                  <Badge variant="outline">
                    {rolePerms.length} permission{rolePerms.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rolePerms.length > 0 ? (
                    rolePerms.map((rp) => (
                      <div key={`${rp.role_id}-${rp.permission_id}`} className="flex items-center gap-1">
                        <Badge variant="secondary">{rp.permission.name}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleRemovePermission(rp.role_id, rp.permission_id)}
                        >
                          <Unlink className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No permissions assigned</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}