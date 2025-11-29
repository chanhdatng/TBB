import { motion } from 'framer-motion';
import { staggerChildrenVariants, itemVariants } from '../../utils/animations';
import { useReducedMotion } from '../../hooks/useAnimations';

/**
 * SkeletonStats - Animated skeleton loader for stats cards
 *
 * @param {number} count - Number of stat cards to show (default: 4)
 * @param {string} className - Additional CSS classes
 */
const SkeletonStats = ({ count = 4, className = '' }) => {
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

  return (
    <motion.div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
      variants={reducedMotion ? {} : staggerChildrenVariants}
      initial="hidden"
      animate="visible"
    >
      {[...Array(count)].map((_, index) => (
        <motion.div
          key={`stat-${index}`}
          className="bg-white rounded-lg p-6 shadow-sm"
          variants={reducedMotion ? {} : itemVariants}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Label skeleton */}
              <motion.div
                className="h-3 bg-gray-200 rounded w-1/2 mb-3"
                variants={shimmerVariants}
                animate="pulse"
              />

              {/* Value skeleton */}
              <motion.div
                className="h-8 bg-gray-300 rounded w-3/4 mb-2"
                variants={shimmerVariants}
                animate="pulse"
                style={{ animationDelay: '0.1s' }}
              />

              {/* Trend skeleton */}
              <motion.div
                className="h-3 bg-gray-200 rounded w-1/3"
                variants={shimmerVariants}
                animate="pulse"
                style={{ animationDelay: '0.2s' }}
              />
            </div>

            {/* Icon skeleton */}
            <motion.div
              className="w-10 h-10 bg-gray-200 rounded-lg"
              variants={shimmerVariants}
              animate="pulse"
            />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default SkeletonStats;
