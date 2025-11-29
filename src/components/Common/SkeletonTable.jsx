import { motion } from 'framer-motion';
import { staggerFastVariants, itemVariants } from '../../utils/animations';
import { useReducedMotion } from '../../hooks/useAnimations';

/**
 * SkeletonTable - Animated skeleton loader for table components
 *
 * @param {number} rows - Number of rows to show (default: 5)
 * @param {number} columns - Number of columns to show (default: 5)
 * @param {string} className - Additional CSS classes
 */
const SkeletonTable = ({ rows = 5, columns = 5, className = '' }) => {
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
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Table Header Skeleton */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[...Array(columns)].map((_, index) => (
            <motion.div
              key={`header-${index}`}
              className="h-4 bg-gray-300 rounded"
              variants={shimmerVariants}
              animate="pulse"
            />
          ))}
        </div>
      </div>

      {/* Table Rows Skeleton */}
      <motion.div
        variants={reducedMotion ? {} : staggerFastVariants}
        initial="hidden"
        animate="visible"
      >
        {[...Array(rows)].map((_, rowIndex) => (
          <motion.div
            key={`row-${rowIndex}`}
            className="border-b border-gray-100 last:border-0"
            variants={reducedMotion ? {} : itemVariants}
          >
            <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {[...Array(columns)].map((_, colIndex) => (
                <motion.div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className={`h-3 bg-gray-200 rounded ${
                    colIndex === 0 ? 'w-3/4' : colIndex === columns - 1 ? 'w-1/2' : 'w-full'
                  }`}
                  variants={shimmerVariants}
                  animate="pulse"
                  style={{ animationDelay: `${(rowIndex * columns + colIndex) * 0.05}s` }}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default SkeletonTable;
