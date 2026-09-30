import { animate, inView, stagger } from 'motion';

/**
 * Animate elements on initial mount with smooth staggered fade-in + slide-up
 */
export function useStaggerFade(selector: string, delay = 0.04) {
  onMounted(() => {
    if (typeof window === 'undefined') return;
    // Respect user's motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    requestAnimationFrame(() => {
      const elements = document.querySelectorAll(selector);
      if (!elements.length) return;
      animate(
        elements,
        { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0px)'] },
        { duration: 0.4, delay: stagger(delay), ease: [0.16, 1, 0.3, 1] },
      );
    });
  });
}

/**
 * Animate elements when scrolled into viewport using inView
 */
export function useScrollFade(selector: string) {
  onMounted(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    requestAnimationFrame(() => {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        inView(
          el,
          () => {
            animate(
              el,
              { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0px)'] },
              { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
            );
          },
          { margin: '0px 0px -40px 0px' },
        );
      }
    });
  });
}
