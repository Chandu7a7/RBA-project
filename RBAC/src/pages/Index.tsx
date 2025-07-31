import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { PermissionsManager } from '@/components/PermissionsManager';
import { RolesManager } from '@/components/RolesManager';
import { RolePermissionsManager } from '@/components/RolePermissionsManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">RBAC Management Dashboard</h1>
          <p className="text-muted-foreground">
            Manage roles, permissions, and their relationships
          </p>
        </div>

        <Tabs defaultValue="permissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="assignments">Role Assignments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="permissions">
            <PermissionsManager />
          </TabsContent>
          
          <TabsContent value="roles">
            <RolesManager />
          </TabsContent>
          
          <TabsContent value="assignments">
            <RolePermissionsManager />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;
