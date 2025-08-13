import React from 'react';
import multiavatar from '@multiavatar/multiavatar';

interface MultiavatarProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  seed: string;
}

const MultiavatarComponent: React.FC<MultiavatarProps> = ({ seed, ...props }) => {
  try {
    // The theme option was incorrect and causing a crash. Removed it to use the stable, default version.
    const svgCode = multiavatar(seed || 'default-seed');
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgCode)}`;
    return <img src={svgDataUrl} {...props} />;
  } catch (e) {
    console.error("Failed to generate Multiavatar", e);
    // Return a placeholder or default image on failure
    const placeholderSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#f1f5f9"/></svg>`;
    const placeholderUrl = `data:image/svg+xml;base64,${btoa(placeholderSvg)}`;
    return <img src={placeholderUrl} {...props} />;
  }
};

export default MultiavatarComponent;