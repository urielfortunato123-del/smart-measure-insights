import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

export const AdminButton = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate('/admin')}
      className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
    >
      <Shield className="h-4 w-4" />
      Admin
    </Button>
  );
};
