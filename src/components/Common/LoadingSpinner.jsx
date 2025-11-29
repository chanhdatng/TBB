import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useAnimations';

/**
 * LoadingSpinner - Enhanced loading spinner with smooth animations
 *
 * @param {string} size - Size of the spinner: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} className - Additional CSS classes
 * @param {string} text - Optional loading text
 * @param {boolean} fullScreen - Show as full screen loader
 */
const LoadingSpinner = ({
  size = 'md',
  className = '',
  text = '',
  fullScreen = false
}) => {
  const reducedMotion = useReducedMotion();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      scale: reducedMotion ? 1 : [1, 1.1, 1],
      transition: {
        rotate: {
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        },
        scale: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.2 }
    }
  };

  const spinnerContent = (
    <motion.div
      className="flex flex-col items-center justify-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={spinnerVariants}
        animate="animate"
        className={className}
      >
        <Loader2 className={`${sizeClasses[size]} text-primary`} />
      </motion.div>
      {text && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mt-2 text-gray-600 text-sm"
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-gray-50 z-50"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {spinnerContent}
      </motion.div>
    );
  }

  return spinnerContent;
};

export default LoadingSpinner;
