/** @jsxImportSource react */
'use client';

import React from 'react';
import { Boxes } from './background-boxes';
import { cn } from '../../lib/utils';

export function BackgroundBoxesDemo() {
  return (
    <div className="background-boxes-demo-wrap">
      <div className="background-boxes-demo-mask" />
      <Boxes />
      <h1 className={cn('background-boxes-demo-title')}>Velnora Motion Grid</h1>
      <p className="background-boxes-demo-text">Animated structural background for sections and footers.</p>
    </div>
  );
}
