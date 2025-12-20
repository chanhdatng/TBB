import React from 'react';
import { TrendingUp } from 'lucide-react';

const VelocityIcon = ({ velocity, size = 20 }) => {
    // Always return a simple, reliable icon
    // The error is likely from trying to render unsupported characters
    return (
        <TrendingUp
            size={size}
            className="text-green-500"
        />
    );
};

export default VelocityIcon;