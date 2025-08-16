import TransactionDashboard from '@/components/TransactionDashboard';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import '@/globals.css';

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <TransactionDashboard />
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
