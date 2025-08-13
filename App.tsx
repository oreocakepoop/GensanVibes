
import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

import MainApp from './MainApp';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AppSkeleton from './components/AppSkeleton';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginView, setIsLoginView] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <AppSkeleton />;
  }

  if (!user) {
    return isLoginView ? (
      <LoginPage onSwitchToRegister={() => setIsLoginView(false)} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setIsLoginView(true)} />
    );
  }

  return <MainApp />;
};

export default App;