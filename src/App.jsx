import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import { ForkProvider } from './context/ForkContext';
import AppShell from './components/fork/AppShell';
import MapScreen from './pages/MapScreen';
import SavedScreen from './pages/SavedScreen';
import FriendsScreen from './pages/FriendsScreen';
import ProfileScreen from './pages/ProfileScreen';
import PlaceDetail from './pages/PlaceDetail';
import FriendProfile from './pages/FriendProfile';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <ForkProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<MapScreen />} />
          <Route path="/saved" element={<SavedScreen />} />
          <Route path="/friends" element={<FriendsScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/place/:id" element={<PlaceDetail />} />
          <Route path="/friend/:name" element={<FriendProfile />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </ForkProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App