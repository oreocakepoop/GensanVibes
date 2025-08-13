import React, { useState } from 'react';
import { auth } from '../firebase.ts';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state change will handle redirecting to the main app
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during login.');
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg p-4">
        <div className="w-full max-w-sm">
            <h1 className="text-5xl font-bold text-center text-brand-text mb-2 font-serif">Gensan Vibes</h1>
            <p className="text-center text-brand-text-secondary mb-8 text-lg">Welcome back! Log in to see what's new.</p>
            <div className="bg-brand-surface p-8 rounded-xl shadow-lg">
                <form onSubmit={handleLogin}>
                    {error && <p className="bg-brand-accent-light text-brand-accent p-3 rounded-md mb-6 text-sm">{error}</p>}
                    <div className="mb-4">
                        <label className="block text-brand-text-secondary text-sm font-semibold mb-2" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-11 px-4 py-2 text-base bg-brand-bg text-brand-text border-2 border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-brand-text-secondary text-sm font-semibold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-11 px-4 py-2 text-base bg-brand-bg text-brand-text border-2 border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 bg-brand-accent hover:opacity-90 text-brand-surface font-bold py-2 px-4 rounded-lg transition-all text-base disabled:bg-brand-subtle disabled:text-brand-text-secondary disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>
            </div>
            <p className="text-center text-base text-brand-text-secondary mt-6">
                Don't have an account?{' '}
                <button onClick={onSwitchToRegister} className="font-semibold text-brand-accent hover:underline">
                    Sign Up
                </button>
            </p>
        </div>
    </div>
  );
};

export default LoginPage;