/** @jsxImportSource react */
'use client';

import { SplineScene } from './splite';

export function SplineSceneBasic() {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <SplineScene
        scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
        className="h-full w-full"
      />
    </div>
  );
}
