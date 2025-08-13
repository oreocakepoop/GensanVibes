
import React from 'react';
import { locations } from '../data/locations.ts';
import type { View } from '../types.ts';
import { motion } from 'framer-motion';

interface BarangayDirectoryProps {
  onNavigate: (view: View) => void;
}

const BarangayDirectory: React.FC<BarangayDirectoryProps> = ({ onNavigate }) => {
  const GSCBarangays = locations['General Santos City'] || [];

  return (
    <nav>
      <ul className="space-y-1">
        {GSCBarangays.map(barangay => (
          <li key={barangay}>
            <motion.button
              onClick={() => onNavigate({ type: 'barangayHub', barangayName: barangay })}
              className="w-full text-left text-sm font-medium text-brand-text-secondary hover:text-brand-text py-1 px-2 rounded-md transition-colors hover:bg-brand-bg"
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              {barangay}
            </motion.button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default BarangayDirectory;