import { useEffect, useRef, useState } from 'preact/hooks';
import * as THREE from 'three';

interface Hero3DProps {
  height?: number;
}

export default function Hero3D({ height = 600 }: Hero3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const container = containerRef.current;

    // Scene with galaxy background
    const scene = new THREE.Scene();
    
    // Create starfield background
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 200;
      positions[i + 2] = (Math.random() - 0.5) * 200;
      
      const hue = Math.random();
      const color = new THREE.Color().setHSL(hue, 0.6, Math.random() * 0.7 + 0.3);
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
      size: 0.2,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    
    // Space gradient background
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create galaxy gradient
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 512);
    gradient.addColorStop(0, '#0a0510');
    gradient.addColorStop(0.3, '#1a0a2e');
    gradient.addColorStop(0.6, '#0f0a1f');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add some nebula colors
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#6a00ff';
    ctx.fillRect(0, 0, 512, 512);
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#00d9ff';
    ctx.fillRect(0, 0, 512, 512);
    
    const texture = new THREE.CanvasTexture(canvas);
    scene.background = texture;

    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    camera.position.z = 45;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Create sophisticated AI robot
    const aiRobot = new THREE.Group();

    // Core central orb - AI neural core
    const coreGeometry = new THREE.IcosahedronGeometry(2, 4);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x06f8d9,
      emissive: 0x06f8d9,
      emissiveIntensity: 1.2,
      wireframe: false,
      shininess: 200,
      metalness: 0.9,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = 0;
    core.castShadow = true;
    aiRobot.add(core);

    // Orbiting data rings around core
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(4 + i * 2, 0.3, 16, 100);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? 0x06f8d9 : 0xd946ef,
        emissive: i % 2 === 0 ? 0x06f8d9 : 0xd946ef,
        emissiveIntensity: 0.8,
        shininess: 150,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2.5 + i * 0.3;
      ring.userData = { speed: 0.002 + i * 0.001, index: i };
      aiRobot.add(ring);
    }

    // Head module - angular and sleek
    const headGeometry = new THREE.TetrahedronGeometry(3.5, 0);
    const headMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a3e,
      emissive: 0x1a1a3e,
      emissiveIntensity: 0.4,
      shininess: 120,
      metalness: 0.8,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 8;
    head.castShadow = true;
    aiRobot.add(head);

    // Visor - advanced display
    const visorGeometry = new THREE.BoxGeometry(4.5, 2.5, 0.5);
    const visorMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1.5,
      shininess: 200,
      transparent: true,
      opacity: 0.9,
    });
    const visor = new THREE.Mesh(visorGeometry, visorMaterial);
    visor.position.set(0, 8.2, 2.8);
    visor.castShadow = true;
    aiRobot.add(visor);

    // Upper body torso - angular design
    const torsoGeometry = new THREE.OctahedronGeometry(3, 1);
    const torsoMaterial = new THREE.MeshPhongMaterial({
      color: 0x0d1b2a,
      emissive: 0x0d1b2a,
      emissiveIntensity: 0.3,
      shininess: 100,
      metalness: 0.85,
    });
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.y = 2;
    torso.scale.set(1.2, 1.5, 1);
    torso.castShadow = true;
    aiRobot.add(torso);

    // Energy chest panel
    const chestGeometry = new THREE.PlaneGeometry(3.5, 4);
    const chestMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: 0xd946ef,
      emissiveIntensity: 0.9,
      shininess: 180,
      side: THREE.DoubleSide,
    });
    const chest = new THREE.Mesh(chestGeometry, chestMaterial);
    chest.position.set(0, 2, 2.2);
    chest.castShadow = true;
    aiRobot.add(chest);

    // Energy grid pattern on chest
    const gridGeometry = new THREE.BufferGeometry();
    const gridPositions: number[] = [];
    for (let x = -1.5; x <= 1.5; x += 0.3) {
      for (let y = -2; y <= 2; y += 0.3) {
        gridPositions.push(x, y, 2.25);
      }
    }
    gridGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gridPositions), 3));
    const gridMaterial = new THREE.PointsMaterial({
      color: 0x06f8d9,
      size: 0.15,
      sizeAttenuation: true,
    });
    const gridPoints = new THREE.Points(gridGeometry, gridMaterial);
    aiRobot.add(gridPoints);

    // Left arm - sleek and advanced
    const armGeometry = new THREE.ConeGeometry(1, 5, 16);
    const armMaterialLeft = new THREE.MeshPhongMaterial({
      color: 0x0a0a1a,
      emissive: 0x06f8d9,
      emissiveIntensity: 0.5,
      shininess: 130,
      metalness: 0.8,
    });
    const armLeft = new THREE.Mesh(armGeometry, armMaterialLeft);
    armLeft.position.set(-4.8, 3, 0);
    armLeft.rotation.z = Math.PI / 3;
    armLeft.castShadow = true;
    aiRobot.add(armLeft);

    // Right arm
    const armMaterialRight = new THREE.MeshPhongMaterial({
      color: 0x0a0a1a,
      emissive: 0xd946ef,
      emissiveIntensity: 0.5,
      shininess: 130,
      metalness: 0.8,
    });
    const armRight = new THREE.Mesh(armGeometry, armMaterialRight);
    armRight.position.set(4.8, 3, 0);
    armRight.rotation.z = -Math.PI / 3;
    armRight.castShadow = true;
    aiRobot.add(armRight);

    // Lower body stabilizers
    const legGeometry = new THREE.CylinderGeometry(0.7, 1.2, 4, 16);
    const legMaterialLeft = new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: 0x06f8d9,
      emissiveIntensity: 0.4,
      shininess: 110,
      metalness: 0.85,
    });
    const legLeft = new THREE.Mesh(legGeometry, legMaterialLeft);
    legLeft.position.set(-2, -5.5, 0);
    legLeft.castShadow = true;
    aiRobot.add(legLeft);

    const legMaterialRight = new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: 0xd946ef,
      emissiveIntensity: 0.4,
      shininess: 110,
      metalness: 0.85,
    });
    const legRight = new THREE.Mesh(legGeometry, legMaterialRight);
    legRight.position.set(2, -5.5, 0);
    legRight.castShadow = true;
    aiRobot.add(legRight);

    // Data flow particles
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 20;
      particlePositions[i + 1] = (Math.random() - 0.5) * 20;
      particlePositions[i + 2] = (Math.random() - 0.5) * 20;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x06f8d9,
      size: 0.1,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    aiRobot.add(particles);

    aiRobot.position.y = 0;
    scene.add(aiRobot);

    // Advanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const keyLight = new THREE.PointLight(0x06f8d9, 2.5, 200);
    keyLight.position.set(30, 30, 50);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xd946ef, 1.8, 200);
    fillLight.position.set(-30, 20, -40);
    scene.add(fillLight);

    const backlightLight = new THREE.PointLight(0x00ffff, 1, 150);
    backlightLight.position.set(0, -10, -50);
    scene.add(backlightLight);

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

      // Rotate orbiting rings
      aiRobot.children.forEach((child, index) => {
        if (child.userData && child.userData.speed) {
          child.rotation.z += child.userData.speed;
        }
      });

      // Star field gentle rotation
      stars.rotation.z += 0.00003;

      if (isHovering) {
        // Active AI mode
        aiRobot.rotation.x = mouseY * 0.4;
        aiRobot.rotation.y = mouseX * 0.5;
        aiRobot.rotation.z = mouseX * 0.15;
        
        core.scale.set(
          1 + Math.sin(time * 3) * 0.15,
          1 + Math.sin(time * 3) * 0.15,
          1 + Math.sin(time * 3) * 0.15
        );
      } else {
        // Idle AI mode - subtle rotation
        aiRobot.rotation.y = Math.sin(time * 0.5) * 0.15;
        aiRobot.rotation.x = Math.sin(time * 0.3) * 0.1;
        aiRobot.rotation.z = 0;
        
        core.scale.set(
          1 + Math.sin(time * 2) * 0.08,
          1 + Math.sin(time * 2) * 0.08,
          1 + Math.sin(time * 2) * 0.08
        );
      }

      // Data flow animation
      particles.rotation.x += 0.0003;
      particles.rotation.y += 0.0005;

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
        background: '#000000',
        position: 'relative',
      }}
    />
  );
}
