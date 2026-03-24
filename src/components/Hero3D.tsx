import { useEffect, useRef, useState } from 'preact/hooks';
import * as THREE from 'three';

interface Hero3DProps {
  height?: number;
}

// Colors from AI Prompt Vault reference
const COLORS = {
  bg: 0x0a0a0f,
  surface: 0x14141f,
  text: 0xe8e4f0,
  primary: 0x7b2ff2,
  secondary: 0xf22fb0,
  cyan: 0x2ff2d0,
};

export default function Hero3D({ height = 600 }: Hero3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bg);

    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    camera.position.z = 55;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Floating orbs background (like the reference)
    const orbGroup = new THREE.Group();
    
    const createOrb = (size: number, color: number, x: number, y: number, z: number) => {
      const geometry = new THREE.IcosahedronGeometry(size, 4);
      const material = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.15,
        wireframe: false,
        transparent: true,
        opacity: 0.35,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      return mesh;
    };

    const orb1 = createOrb(12, COLORS.primary, -20, 8, -15);
    const orb2 = createOrb(10, COLORS.secondary, 25, -12, -18);
    const orb3 = createOrb(8, COLORS.cyan, 0, 15, -20);
    
    orbGroup.add(orb1, orb2, orb3);
    scene.add(orbGroup);

    // Three thinking minds
    const mindsGroup = new THREE.Group();

    // Helper to create a thinking mind sphere with neural structure
    const createMind = (x: number, color: number, id: number) => {
      const mindGroup = new THREE.Group();

      // Main brain sphere - ENLARGED
      const brainGeometry = new THREE.IcosahedronGeometry(6, 5);
      const brainMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a2e,
        emissive: color,
        emissiveIntensity: 0.4,
        shininess: 120,
        metalness: 0.7,
      });
      const brain = new THREE.Mesh(brainGeometry, brainMaterial);
      brain.position.x = x;
      brain.userData = { originalPosition: { x, y: 0, z: 0 }, floatSpeed: 1.2 + id * 0.3 };
      mindGroup.add(brain);

      // Core glowing center - ENLARGED
      const coreGeometry = new THREE.SphereGeometry(2.5, 32, 32);
      const coreMaterial = new THREE.MeshBasicMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.2,
      });
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      core.position.x = x;
      core.scale.set(0.6, 0.6, 0.6);
      mindGroup.add(core);

      // Neural spikes around brain - MORE SPIKES, LARGER
      for (let i = 0; i < 12; i++) {
        const spikeGeometry = new THREE.ConeGeometry(0.5, 3.5, 8);
        const spikeMaterial = new THREE.MeshPhongMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.8,
        });
        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        
        const angle = (i / 12) * Math.PI * 2;
        spike.position.x = x + Math.cos(angle) * 7;
        spike.position.y = Math.sin(angle) * 7;
        spike.position.z = Math.sin(i / 12 * Math.PI) * 4;
        spike.lookAt(x, 0, 0);
        spike.userData = { angle, distance: 7, index: i, parentId: id };
        
        mindGroup.add(spike);
      }

      // Particle halo around mind - MORE PARTICLES
      const particleCount = 100;
      const particleGeometry = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        const rad = Math.random() * Math.PI * 2;
        const dist = 5 + Math.random() * 5;
        particlePositions[i] = x + Math.cos(rad) * dist;
        particlePositions[i + 1] = Math.sin(rad) * dist;
        particlePositions[i + 2] = Math.random() * 2 - 1;
      }
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      const particleMaterial = new THREE.PointsMaterial({
        color,
        size: 0.2,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8,
      });
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      particles.userData = { parentX: x, particleCount };
      mindGroup.add(particles);

      return { mindGroup, brain, core, particles };
    };

    const mind1 = createMind(-25, COLORS.primary, 1);
    const mind2 = createMind(0, COLORS.secondary, 2);
    const mind3 = createMind(25, COLORS.cyan, 3);

    mindsGroup.add(mind1.mindGroup, mind2.mindGroup, mind3.mindGroup);
    scene.add(mindsGroup);

    // Side magnetic pods/doors
    const podGroup = new THREE.Group();
    const pods: any[] = [];

    const createPod = (x: number, y: number, color: number, side: string) => {
      const podMesh = new THREE.Group();
      
      // Main pod sphere
      const podGeometry = new THREE.SphereGeometry(2, 16, 16);
      const podMaterial = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.6,
        shininess: 150,
        wireframe: false,
        transparent: true,
        opacity: 0.8,
      });
      const pod = new THREE.Mesh(podGeometry, podMaterial);
      pod.position.set(x, y, 0);
      podMesh.add(pod);

      // Inner glow ring
      const ringGeometry = new THREE.TorusGeometry(2.5, 0.2, 8, 32);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.0,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(x, y, 0);
      ring.rotation.x = Math.random() * Math.PI;
      podMesh.add(ring);

      podMesh.userData = {
        originalX: x,
        originalY: y,
        color,
        side,
        pod,
        ring,
      };

      return podMesh;
    };

    // Create 6 side pods
    const pod1 = createPod(-45, 15, COLORS.primary, 'left');
    const pod2 = createPod(-45, -15, COLORS.secondary, 'left');
    const pod3 = createPod(45, 10, COLORS.cyan, 'right');
    const pod4 = createPod(45, -10, COLORS.primary, 'right');
    const pod5 = createPod(-45, 0, COLORS.secondary, 'left');
    const pod6 = createPod(45, 0, COLORS.cyan, 'right');

    [pod1, pod2, pod3, pod4, pod5, pod6].forEach(pod => {
      podGroup.add(pod);
      pods.push(pod);
    });

    scene.add(podGroup);

    // Neural connections between minds (lines showing AI communication)
    const connectionGroup = new THREE.Group();
    const connectionMaterial = new THREE.LineBasicMaterial({
      color: COLORS.primary,
      transparent: true,
      opacity: 0.5,
      linewidth: 1,
    });

    // Connection 1-2
    const geo12 = new THREE.BufferGeometry();
    const pos12 = new Float32Array([
      -25, 0, 0,
      0, 0, 0,
    ]);
    geo12.setAttribute('position', new THREE.BufferAttribute(pos12, 3));
    const line12 = new THREE.Line(geo12, connectionMaterial);
    connectionGroup.add(line12);

    // Connection 2-3
    const geo23 = new THREE.BufferGeometry();
    const pos23 = new Float32Array([
      0, 0, 0,
      25, 0, 0,
    ]);
    geo23.setAttribute('position', new THREE.BufferAttribute(pos23, 3));
    const line23 = new THREE.Line(geo23, connectionMaterial);
    connectionGroup.add(line23);

    // Connection 1-3
    const geo13 = new THREE.BufferGeometry();
    const pos13 = new Float32Array([
      -25, 0, 0,
      25, 0, 0,
    ]);
    geo13.setAttribute('position', new THREE.BufferAttribute(pos13, 3));
    const connectionMaterial2 = new THREE.LineBasicMaterial({
      color: COLORS.secondary,
      transparent: true,
      opacity: 0.3,
      linewidth: 1,
    });
    const line13 = new THREE.Line(geo13, connectionMaterial2);
    connectionGroup.add(line13);

    mindsGroup.add(connectionGroup);

    // Data packets flowing through connections
    const dataPackets: any[] = [];
    for (let i = 0; i < 6; i++) {
      const packetGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      const packetMaterial = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? COLORS.primary : COLORS.secondary,
        emissive: i % 2 === 0 ? COLORS.primary : COLORS.secondary,
        emissiveIntensity: 1.5,
      });
      const packet = new THREE.Mesh(packetGeometry, packetMaterial);
      packet.userData = {
        pathIndex: i % 3,
        progress: (i / 6) % 1.0,
        speed: 0.015 + Math.random() * 0.01,
      };
      connectionGroup.add(packet);
      dataPackets.push(packet);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const primaryLight = new THREE.PointLight(COLORS.primary, 2, 200);
    primaryLight.position.set(30, 20, 30);
    scene.add(primaryLight);

    const secondaryLight = new THREE.PointLight(COLORS.secondary, 1.5, 200);
    secondaryLight.position.set(-30, -20, 30);
    scene.add(secondaryLight);

    // Mouse tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const onMouseMove = (event: MouseEvent) => {
      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', onMouseMove);

    // Animation loop
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.016;

      // Smooth mouse tracking
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      // Animate orbs
      orb1.position.y = 8 + Math.sin(time * 0.8) * 3;
      orb2.position.y = -12 + Math.cos(time * 0.6) * 3;
      orb3.position.y = 15 + Math.sin(time * 0.5) * 2;

      // Rotate minds and float them
      [mind1, mind2, mind3].forEach((mind, idx) => {
        const brain = mind.brain as THREE.Mesh;
        const particles = mind.particles as THREE.Points;
        const originalX = brain.position.x;

        // Floating animation
        brain.position.y = Math.sin(time * (1.2 + idx * 0.3)) * 2;
        particles.position.y = brain.position.y;

        // Rotation
        brain.rotation.x += 0.003;
        brain.rotation.y += 0.005 + idx * 0.002;

        // Pulsing effect
        const pulse = 0.8 + Math.sin(time * 2 + idx * 2) * 0.2;
        brain.scale.set(pulse, pulse, pulse);
        particles.rotation.z += 0.002;

        if (isHovering) {
          // React to mouse
          brain.rotation.z = mouseX * 0.3;
          brain.rotation.x += mouseY * 0.2;
        }
      });

      // Animate data packets flowing
      dataPackets.forEach((packet, idx) => {
        packet.userData.progress += packet.userData.speed;
        if (packet.userData.progress > 1) {
          packet.userData.progress = 0;
          packet.userData.pathIndex = (packet.userData.pathIndex + 1) % 3;
        }

        const p = packet.userData.progress;
        const path = packet.userData.pathIndex;

        if (path === 0) {
          packet.position.set(-25 + p * 25, p * 1.5, 0);
        } else if (path === 1) {
          packet.position.set(p * 25, 1.5 - p * 1.5, 0);
        } else {
          packet.position.set(25 - p * 50, -p * 1.5, 0);
        }

        // Pulsing glow
        const glow = 1.2 + Math.sin(time * 5 + idx) * 0.4;
        packet.material.emissiveIntensity = glow;
      });

      // Animate magnetic pods - attract to mouse
      pods.forEach((pod) => {
        const targetX = pod.userData.originalX + mouseX * (pod.userData.side === 'left' ? -15 : 15);
        const targetY = pod.userData.originalY + mouseY * 10;

        pod.position.x += (targetX - pod.position.x) * 0.08;
        pod.position.y += (targetY - pod.position.y) * 0.08;

        // Pulsing glow effect
        const glow = 0.6 + Math.sin(time * 3) * 0.4;
        pod.userData.pod.material.emissiveIntensity = glow;
        
        // Ring rotation
        pod.userData.ring.rotation.z += 0.01;

        // Distance-based scale
        const distToMouse = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
        const scale = 1 + Math.sin(time + distToMouse) * 0.15;
        pod.scale.set(scale, scale, scale);
      });

      // Update connection opacity based on data flow
      [line12, line23, line13].forEach((line, idx) => {
        const opacity = 0.3 + Math.sin(time * (2 + idx * 0.5)) * 0.3;
        (line.material as THREE.LineBasicMaterial).opacity = opacity;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Handle mouse events
    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      renderer.dispose();
      scene.clear();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [height, isHovering]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: `${height}px`,
        background: '#0a0a0f',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Edge decorative circles - top left */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '2%',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(123, 47, 242, 0.4)',
          boxShadow: '0 0 20px rgba(123, 47, 242, 0.6)',
          pointerEvents: 'none',
        }}
      />
      {/* Edge decorative circles - top right */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          right: '3%',
          width: '35px',
          height: '35px',
          borderRadius: '50%',
          background: 'rgba(242, 47, 176, 0.35)',
          boxShadow: '0 0 15px rgba(242, 47, 176, 0.5)',
          pointerEvents: 'none',
        }}
      />
      {/* Edge decorative circles - middle left */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '1.5%',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: 'rgba(47, 242, 208, 0.3)',
          boxShadow: '0 0 18px rgba(47, 242, 208, 0.4)',
          pointerEvents: 'none',
        }}
      />
      {/* Edge decorative circles - middle right */}
      <div
        style={{
          position: 'absolute',
          top: '45%',
          right: '2%',
          width: '45px',
          height: '45px',
          borderRadius: '50%',
          background: 'rgba(123, 47, 242, 0.35)',
          boxShadow: '0 0 22px rgba(123, 47, 242, 0.5)',
          pointerEvents: 'none',
        }}
      />
      {/* Edge decorative circles - bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: '12%',
          left: '2.5%',
          width: '35px',
          height: '35px',
          borderRadius: '50%',
          background: 'rgba(242, 47, 176, 0.4)',
          boxShadow: '0 0 20px rgba(242, 47, 176, 0.6)',
          pointerEvents: 'none',
        }}
      />
      {/* Edge decorative circles - bottom right */}
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          right: '3.5%',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(47, 242, 208, 0.35)',
          boxShadow: '0 0 18px rgba(47, 242, 208, 0.5)',
          pointerEvents: 'none',
        }}
      />
      {/* Additional accent circles */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          right: '15%',
          width: '25px',
          height: '25px',
          borderRadius: '50%',
          background: 'rgba(123, 47, 242, 0.25)',
          boxShadow: '0 0 12px rgba(123, 47, 242, 0.4)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '12%',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'rgba(242, 47, 176, 0.3)',
          boxShadow: '0 0 14px rgba(242, 47, 176, 0.45)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
