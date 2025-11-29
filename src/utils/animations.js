// Animation timing constants
export const DURATION_FAST = 0.25; // 250ms
export const DURATION_MODERATE = 0.35; // 350ms
export const DURATION_SLOW = 0.4; // 400ms

// Spring configurations
export const springConfig = {
  type: "spring",
  damping: 25,
  stiffness: 300
};

export const springBounce = {
  type: "spring",
  damping: 20,
  stiffness: 400
};

export const springGentle = {
  type: "spring",
  damping: 30,
  stiffness: 250
};

// Easing functions
export const easeOut = [0, 0.55, 0.45, 1];
export const easeIn = [0.55, 0, 1, 0.45];
export const easeInOut = [0.65, 0, 0.35, 1];

// Fade in variants
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION_MODERATE, ease: easeOut }
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION_FAST, ease: easeIn }
  }
};

// Slide up variants
export const slideUpVariants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION_MODERATE, ease: easeOut }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: DURATION_FAST, ease: easeIn }
  }
};

// Slide in from right (for toasts, side panels)
export const slideInFromRightVariants = {
  hidden: {
    opacity: 0,
    x: 300,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: springBounce
  },
  exit: {
    opacity: 0,
    x: 300,
    scale: 0.8,
    transition: { duration: DURATION_MODERATE, ease: easeIn }
  }
};

// Scale variants (for modals)
export const scaleVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springConfig
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: DURATION_MODERATE, ease: easeIn }
  }
};

// Page transition variants
export const pageTransitionVariants = {
  hidden: {
    opacity: 0,
    y: -10
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION_MODERATE,
      ease: easeOut
    }
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      duration: DURATION_FAST,
      ease: easeIn
    }
  }
};

// Stagger children variants
export const staggerChildrenVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

// Stagger fast (for lists with many items)
export const staggerFastVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0
    }
  }
};

// Item variants (to be used with stagger containers)
export const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION_FAST }
  }
};

// Validation shake animation
export const shakeVariants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: DURATION_SLOW }
  }
};

// Hover scale effect
export const hoverScaleVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2, ease: easeOut }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

// Button hover variants
export const buttonHoverVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    y: -2,
    transition: { duration: 0.15 }
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: { duration: 0.1 }
  }
};

// List item slide in
export const listItemVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    marginBottom: 0
  },
  visible: {
    opacity: 1,
    height: "auto",
    marginBottom: 12,
    transition: { duration: DURATION_MODERATE, ease: easeOut }
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    transition: { duration: DURATION_FAST, ease: easeIn }
  }
};

// Backdrop variants
export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION_FAST }
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION_FAST }
  }
};

// Skeleton pulse animation
export const skeletonPulseVariants = {
  pulse: {
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Count up transition config
export const countUpConfig = {
  duration: 1,
  ease: easeOut
};

// Tooltip variants
export const tooltipVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.15 }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.1 }
  }
};

// Dropdown menu variants
export const dropdownVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: easeOut }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.15, ease: easeIn }
  }
};
