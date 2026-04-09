/** @jsxImportSource react */
'use client';

import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isActive) {
      return;
    }

    const host = hostRef.current;
    if (!host) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setIsActive(true);
      return;
    }

    const fallbackTimer = window.setTimeout(() => {
      setIsActive(true);
    }, 1800);

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          window.clearTimeout(fallbackTimer);
          setIsActive(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '420px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(host);

    return () => {
      window.clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [isActive]);

  return (
    <div ref={hostRef} className={cn('h-full w-full', className)}>
      {isActive ? (
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <span className="loader"></span>
            </div>
          }
        >
          <Spline scene={scene} className="h-full w-full" />
        </Suspense>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-black/20">
          <span className="loader" aria-hidden="true"></span>
        </div>
      )}
    </div>
  );
}
