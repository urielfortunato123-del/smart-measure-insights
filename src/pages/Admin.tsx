import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Activity, 
  FileText, 
  TrendingUp, 
  ArrowLeft,
  RefreshCw,
  Shield,
  Clock,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading, profiles, analytics, stats, refetchData } = useAdmin();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchData();
    setTimeout(() => setRefreshing(false), 500);
  };

  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Group analytics by type for charts
  const eventCounts = analytics.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get most active users
  const userActivityCount = analytics.reduce((acc, event) => {
    acc[event.user_id] = (acc[event.user_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topUsers = Object.entries(userActivityCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Painel Administrativo</h1>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Usuários</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ativos Hoje</p>
                  <p className="text-3xl font-bold">{stats.activeToday}</p>
                </div>
                <Activity className="h-8 w-8 text-emerald-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Arquivos Analisados</p>
                  <p className="text-3xl font-bold">{stats.totalFileAnalyses}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usos Demo</p>
                  <p className="text-3xl font-bold">{stats.demoUsersCount}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Atividade
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Estatísticas
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>
                  Lista de todos os usuários registrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead>Último Login</TableHead>
                        <TableHead>Usos Demo</TableHead>
                        <TableHead>Arquivos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.email || 'N/A'}</TableCell>
                          <TableCell>{profile.full_name || 'N/A'}</TableCell>
                          <TableCell>
                            {format(new Date(profile.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {profile.last_login_at 
                              ? format(new Date(profile.last_login_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                              : 'Nunca'
                            }
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{profile.demo_uses_count || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{profile.total_files_analyzed || 0}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {profiles.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Nenhum usuário cadastrado ainda
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Atividades</CardTitle>
                <CardDescription>
                  Últimos 500 eventos registrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Usuário ID</TableHead>
                        <TableHead>Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                event.event_type === 'login' ? 'default' :
                                event.event_type === 'file_upload' ? 'secondary' :
                                event.event_type === 'demo_start' ? 'outline' :
                                'secondary'
                              }
                            >
                              {event.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {event.user_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">
                            {Object.keys(event.event_data).length > 0 
                              ? JSON.stringify(event.event_data)
                              : '-'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                      {analytics.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Nenhuma atividade registrada ainda
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Event Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Tipos de Eventos</CardTitle>
                  <CardDescription>Distribuição de eventos por tipo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(eventCounts).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{type}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ 
                                width: `${(count / analytics.length) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                    {Object.keys(eventCounts).length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum evento registrado
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Usuários Mais Ativos</CardTitle>
                  <CardDescription>Top 10 por número de eventos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topUsers.map(([userId, count], index) => {
                      const profile = profiles.find(p => p.id === userId);
                      return (
                        <div key={userId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground w-6">
                              #{index + 1}
                            </span>
                            <span className="text-sm truncate max-w-[200px]">
                              {profile?.email || userId.slice(0, 8) + '...'}
                            </span>
                          </div>
                          <Badge variant="secondary">{count} eventos</Badge>
                        </div>
                      );
                    })}
                    {topUsers.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma atividade registrada
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
