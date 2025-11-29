import { motion } from 'framer-motion';
import { pageTransitionVariants } from '../../utils/animations';
import { useReducedMotion } from '../../hooks/useAnimations';

/**
 * AnimatedPage - Wrapper component for page-level animations
 * Provides consistent entry/exit animations for route transitions
 *
 * @param {ReactNode} children - Page content
 * @param {object} className - Additional CSS classes
 * @param {object} variants - Custom animation variants (optional)
 */
const AnimatedPage = ({ children, className = '', variants = null }) => {
  const reducedMotion = useReducedMotion();
  const animationVariants = variants || pageTransitionVariants;

  // If reduced motion is preferred, disable animations
  const motionProps = reducedMotion
    ? {}
    : {
        initial: 'hidden',
        animate: 'visible',
        exit: 'exit',
        variants: animationVariants
      };

  return (
    <motion.div
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;
