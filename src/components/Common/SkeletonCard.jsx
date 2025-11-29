import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useAnimations';

/**
 * SkeletonCard - Animated skeleton loader for card components
 *
 * @param {string} className - Additional CSS classes
 * @param {number} lines - Number of text lines to show (default: 3)
 * @param {boolean} showIcon - Show icon skeleton (default: false)
 */
const SkeletonCard = ({ className = '', lines = 3, showIcon = false }) => {
  const reducedMotion = useReducedMotion();

  const shimmerVariants = {
    pulse: {
      opacity: reducedMotion ? 0.7 : [0.4, 1, 0.4],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      className={`bg-white rounded-lg p-6 shadow-sm ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Title skeleton */}
          <motion.div
            className="h-4 bg-gray-200 rounded w-1/3 mb-4"
            variants={shimmerVariants}
            animate="pulse"
          />

          {/* Text lines skeleton */}
          {[...Array(lines)].map((_, index) => (
            <motion.div
              key={index}
              className={`h-3 bg-gray-200 rounded mb-2 ${
                index === lines - 1 ? 'w-2/3' : 'w-full'
              }`}
              variants={shimmerVariants}
              animate="pulse"
              style={{ animationDelay: `${index * 0.1}s` }}
            />
          ))}
        </div>

        {/* Icon skeleton */}
        {showIcon && (
          <motion.div
            className="w-12 h-12 bg-gray-200 rounded-full ml-4"
            variants={shimmerVariants}
            animate="pulse"
          />
        )}
      </div>
    </motion.div>
  );
};

export default SkeletonCard;
