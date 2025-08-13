
import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { locations } from '../data/locations';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [barangay, setBarangay] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const availableCities = Object.keys(locations);
  const availableBarangays = city ? locations[city] : [];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (username.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    if (!city || !barangay) {
      setError("Please select your city and barangay.");
      return;
    }
    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user) {
        // Save user info to Realtime Database
        await set(ref(db, `users/${user.uid}`), {
          username: username,
          email: email,
          createdAt: new Date().toISOString(),
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          vibePoints: 0,
          followers: {},
          following: {},
          city: city,
          barangay: barangay,
          avatarStyle: '', // Default avatar is an empty string, falls back to userId
          badges: {},
        });
      }
      // Auth state change will handle redirecting to the main app
    } catch (err: any) {
      setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg p-4">
        <div className="w-full max-w-sm">
            <h1 className="text-5xl font-bold text-center text-brand-text mb-2 font-serif">Gensan Vibes</h1>
            <p className="text-center text-brand-text-secondary mb-8 text-lg">Join the vibe. Create your account.</p>
            <div className="bg-brand-surface p-8 rounded-xl shadow-lg">
                <form onSubmit={handleRegister}>
                    {error && <p className="bg-brand-accent-light text-brand-accent p-3 rounded-md mb-6 text-sm">{error}</p>}
                     <div className="mb-4">
                        <label className="block text-brand-text-secondary text-sm font-semibold mb-2" htmlFor="username">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full h-11 px-4 py-2 text-base bg-brand-bg text-brand-text border-2 border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition"
                            required
                        />
                    </div>
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
                    <div className="mb-4">
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
                    <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-brand-text-secondary text-sm font-semibold mb-2" htmlFor="city">
                                City/Municipality
                            </label>
                            <select
                                id="city"
                                value={city}
                                onChange={(e) => { setCity(e.target.value); setBarangay(''); }}
                                className="w-full h-11 px-4 text-base bg-brand-bg text-brand-text border-2 border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition appearance-none"
                                required
                            >
                                <option value="" disabled>Select City</option>
                                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                           <label className="block text-brand-text-secondary text-sm font-semibold mb-2" htmlFor="barangay">
                                Barangay
                            </label>
                            <select
                                id="barangay"
                                value={barangay}
                                onChange={(e) => setBarangay(e.target.value)}
                                className="w-full h-11 px-4 text-base bg-brand-bg text-brand-text border-2 border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition appearance-none"
                                required
                                disabled={!city}
                            >
                                <option value="" disabled>Select Barangay</option>
                                {availableBarangays.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 h-11 bg-brand-accent hover:opacity-90 text-brand-surface font-bold py-2 px-4 rounded-lg transition-all text-base disabled:bg-brand-subtle disabled:text-brand-text-secondary disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
            </div>
            <p className="text-center text-base text-brand-text-secondary mt-6">
                Already have an account?{' '}
                <button onClick={onSwitchToLogin} className="font-semibold text-brand-accent hover:underline">
                    Log In
                </button>
            </p>
        </div>
    </div>
  );
};

export default RegisterPage;