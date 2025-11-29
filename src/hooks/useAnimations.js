import { useState, useEffect, useRef, useCallback } from 'react';
import { useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import { countUpConfig } from '../utils/animations';

/**
 * Hook to detect if user prefers reduced motion
 * Respects accessibility preferences
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

/**
 * Hook for animated count-up effect
 * @param {number} targetValue - The target number to count up to
 * @param {number} duration - Duration of the animation in seconds
 * @returns {MotionValue} - Animated value to use in motion components
 */
export const useCountUp = (targetValue, duration = 1) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const prevTargetRef = useRef(targetValue);

  useEffect(() => {
    // Only animate if value actually changed
    if (prevTargetRef.current !== targetValue) {
      const controls = animate(count, targetValue, {
        ...countUpConfig,
        duration
      });

      prevTargetRef.current = targetValue;

      return () => controls.stop();
    }
  }, [targetValue, count, duration]);

  return rounded;
};

/**
 * Hook for animated count-up with formatting
 * @param {number} targetValue - The target number to count up to
 * @param {Function} formatter - Function to format the number
 * @param {number} duration - Duration of the animation in seconds
 * @returns {string} - Formatted animated value
 */
export const useFormattedCountUp = (targetValue, formatter = (n) => n.toString(), duration = 1) => {
  const [displayValue, setDisplayValue] = useState(formatter(0));
  const prevTargetRef = useRef(targetValue);

  useEffect(() => {
    if (prevTargetRef.current !== targetValue) {
      const startValue = prevTargetRef.current || 0;
      const startTime = performance.now();

      const updateValue = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);

        // Easing function (easeOut)
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (targetValue - startValue) * easedProgress;

        setDisplayValue(formatter(Math.round(currentValue)));

        if (progress < 1) {
          requestAnimationFrame(updateValue);
        } else {
          prevTargetRef.current = targetValue;
        }
      };

      requestAnimationFrame(updateValue);
    }
  }, [targetValue, formatter, duration]);

  return displayValue;
};

/**
 * Hook for consistent hover scale effect
 * @param {number} scale - Scale value on hover (default 1.02)
 * @returns {object} - Motion props to spread on component
 */
export const useHoverScale = (scale = 1.02) => {
  const reducedMotion = useReducedMotion();

  return {
    whileHover: reducedMotion ? {} : { scale, transition: { duration: 0.2 } },
    whileTap: reducedMotion ? {} : { scale: 0.98, transition: { duration: 0.1 } }
  };
};

/**
 * Hook for staggered list animations with IntersectionObserver
 * @param {number} threshold - Intersection threshold (0-1)
 * @returns {object} - Ref and animation controls
 */
export const useStaggeredList = (threshold = 0.1) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: threshold });
  const reducedMotion = useReducedMotion();

  return {
    ref,
    animate: isInView && !reducedMotion ? 'visible' : 'hidden'
  };
};

/**
 * Hook for page transition state
 * @returns {boolean} - Whether page is transitioning
 */
export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = useCallback(() => {
    setIsTransitioning(true);
  }, []);

  const endTransition = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return { isTransitioning, startTransition, endTransition };
};

/**
 * Hook for sequential animations
 * @param {number} delay - Delay in milliseconds
 * @returns {boolean} - Whether to show the element
 */
export const useSequentialShow = (delay = 0) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return show;
};

/**
 * Hook for scroll-triggered animations
 * @param {object} options - IntersectionObserver options
 * @returns {object} - Ref and inView state
 */
export const useScrollAnimation = (options = {}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    amount: 0.3,
    ...options
  });
  const reducedMotion = useReducedMotion();

  return {
    ref,
    isInView: reducedMotion ? true : isInView
  };
};

/**
 * Hook for animated presence with callback
 * @param {boolean} isVisible - Whether element should be visible
 * @param {number} duration - Animation duration in ms
 * @returns {object} - shouldRender and isVisible state
 */
export const useAnimatedPresence = (isVisible, duration = 300) => {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  return { shouldRender, isVisible };
};

/**
 * Hook to get animation variants based on reduced motion preference
 * @param {object} variants - Animation variants
 * @param {object} staticVariants - Simplified variants for reduced motion
 * @returns {object} - Appropriate variants based on user preference
 */
export const useAdaptiveVariants = (variants, staticVariants = null) => {
  const reducedMotion = useReducedMotion();

  if (reducedMotion && staticVariants) {
    return staticVariants;
  }

  if (reducedMotion) {
    // Return instant transitions
    return Object.keys(variants).reduce((acc, key) => {
      acc[key] = {
        ...variants[key],
        transition: { duration: 0 }
      };
      return acc;
    }, {});
  }

  return variants;
};
