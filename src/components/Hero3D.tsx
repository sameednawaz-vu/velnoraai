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

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 35;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Create lightweight robot character
    const robot = new THREE.Group();

    // Head - simple box with rounded corners effect
    const headGeometry = new THREE.BoxGeometry(3, 3.5, 2.8);
    const headMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      emissive: 0x06f8d9,
      emissiveIntensity: 0.2,
      shininess: 100,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2;
    head.castShadow = true;
    robot.add(head);

    // Eyes - glowing orbs
    const eyeGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const eyeMaterialLeft = new THREE.MeshBasicMaterial({ color: 0x06f8d9 });
    const eyeMaterialRight = new THREE.MeshBasicMaterial({ color: 0xd946ef });
    
    const eyeLeft = new THREE.Mesh(eyeGeometry, eyeMaterialLeft);
    eyeLeft.position.set(-0.8, 2.3, 1.5);
    robot.add(eyeLeft);

    const eyeRight = new THREE.Mesh(eyeGeometry, eyeMaterialRight);
    eyeRight.position.set(0.8, 2.3, 1.5);
    robot.add(eyeRight);

    // Body - rectangle
    const bodyGeometry = new THREE.BoxGeometry(2.8, 4, 2.5);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x0f0f1a,
      emissive: 0xd946ef,
      emissiveIntensity: 0.15,
      shininess: 80,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = -1.5;
    body.castShadow = true;
    robot.add(body);

    // Chest accent - glowing panel
    const chestGeometry = new THREE.BoxGeometry(2.5, 2, 0.3);
    const chestMaterial = new THREE.MeshPhongMaterial({
      color: 0x06b6d4,
      emissive: 0x06f8d9,
      emissiveIntensity: 0.4,
    });
    const chest = new THREE.Mesh(chestGeometry, chestMaterial);
    chest.position.set(0, -1.5, 1.4);
    chest.castShadow = true;
    robot.add(chest);

    // Left arm
    const armGeometry = new THREE.BoxGeometry(0.8, 3, 0.8);
    const armMaterialLeft = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      emissive: 0xd946ef,
      emissiveIntensity: 0.2,
    });
    const armLeft = new THREE.Mesh(armGeometry, armMaterialLeft);
    armLeft.position.set(-2, -1, 0);
    armLeft.castShadow = true;
    robot.add(armLeft);

    // Right arm
    const armMaterialRight = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.2,
    });
    const armRight = new THREE.Mesh(armGeometry, armMaterialRight);
    armRight.position.set(2, -1, 0);
    armRight.castShadow = true;
    robot.add(armRight);

    // Left leg
    const legGeometry = new THREE.BoxGeometry(0.9, 2.5, 0.9);
    const legMaterialLeft = new THREE.MeshPhongMaterial({
      color: 0x0a0a0a,
      emissive: 0xd946ef,
      emissiveIntensity: 0.15,
    });
    const legLeft = new THREE.Mesh(legGeometry, legMaterialLeft);
    legLeft.position.set(-1, -4.5, 0);
    legLeft.castShadow = true;
    robot.add(legLeft);

    // Right leg
    const legMaterialRight = new THREE.MeshPhongMaterial({
      color: 0x0a0a0a,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.15,
    });
    const legRight = new THREE.Mesh(legGeometry, legMaterialRight);
    legRight.position.set(1, -4.5, 0);
    legRight.castShadow = true;
    robot.add(legRight);

    // Add robot to scene
    scene.add(robot);

    // Lighting - optimized for performance
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x06f8d9, 1.2, 100);
    pointLight.position.set(15, 20, 20);
    pointLight.castShadow = true;
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xd946ef, 0.8, 100);
    pointLight2.position.set(-15, 15, 15);
    pointLight2.castShadow = true;
    scene.add(pointLight2);

    // Mouse tracking
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', onMouseMove);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Smooth rotation
      if (isHovering) {
        // Active rotation when hovering
        robot.rotation.x += 0.001;
        robot.rotation.y += 0.005;
        
        // Magnetic effect - subtle movement towards mouse
        robot.position.x += (mouseX * 0.5 - robot.position.x) * 0.05;
        robot.position.y += (mouseY * 0.3 - robot.position.y) * 0.05;
      } else {
        // Gentle idle rotation
        robot.rotation.y += 0.002;
        robot.rotation.x = Math.sin(Date.now() * 0.0003) * 0.15;
        
        // Return to center
        robot.position.x += (0 - robot.position.x) * 0.02;
        robot.position.y += (0 - robot.position.y) * 0.02;
      }

      // Eye materials animate
      if (Math.sin(Date.now() * 0.005) > 0) {
        eyeLeft.material.color.setHex(0x06f8d9);
        eyeRight.material.color.setHex(0xd946ef);
      } else {
        eyeLeft.material.color.setHex(0xd946ef);
        eyeRight.material.color.setHex(0x06f8d9);
      }

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
        background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
        position: 'relative',
      }}
    />
  );
}
