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

    // Scene setup - Dark background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    // Create massive detailed robot
    const robot = new THREE.Group();

    // Head base - large and prominent
    const headGeometry = new THREE.BoxGeometry(6, 7, 5);
    const headMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      emissive: 0x1a1a2e,
      emissiveIntensity: 0.3,
      shininess: 120,
      metalness: 0.8,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 6;
    head.castShadow = true;
    head.receiveShadow = true;
    robot.add(head);

    // Head left side panel - black metallic with glow
    const headLeftPanelGeometry = new THREE.BoxGeometry(3, 7, 0.5);
    const headLeftPanelMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a0a0a,
      emissive: 0x06f8d9,
      emissiveIntensity: 0.8,
      shininess: 150,
    });
    const headLeftPanel = new THREE.Mesh(headLeftPanelGeometry, headLeftPanelMaterial);
    headLeftPanel.position.set(-2.5, 6, 2.5);
    headLeftPanel.castShadow = true;
    robot.add(headLeftPanel);

    // Head right side panel - black metallic with glow
    const headRightPanelGeometry = new THREE.BoxGeometry(3, 7, 0.5);
    const headRightPanelMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a0a0a,
      emissive: 0xd946ef,
      emissiveIntensity: 0.8,
      shininess: 150,
    });
    const headRightPanel = new THREE.Mesh(headRightPanelGeometry, headRightPanelMaterial);
    headRightPanel.position.set(2.5, 6, 2.5);
    headRightPanel.castShadow = true;
    robot.add(headRightPanel);

    // Main display screen - rainbow gradient effect
    const screenGeometry = new THREE.BoxGeometry(5.5, 5.5, 0.4);
    const screenMaterial = new THREE.MeshPhongMaterial({
      color: 0x0f0f1a,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.0,
      shininess: 200,
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 6.2, 2.6);
    screen.castShadow = true;
    robot.add(screen);

    // Eyes - large glowing orbs
    const eyeGeometry = new THREE.SphereGeometry(1, 32, 32);
    const eyeMaterialLeft = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      emissive: 0x06f8d9,
      emissiveIntensity: 2.0,
    });
    const eyeLeft = new THREE.Mesh(eyeGeometry, eyeMaterialLeft);
    eyeLeft.position.set(-1.2, 7, 3.5);
    eyeLeft.castShadow = true;
    robot.add(eyeLeft);

    const eyeMaterialRight = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      emissive: 0xd946ef,
      emissiveIntensity: 2.0,
    });
    const eyeRight = new THREE.Mesh(eyeGeometry, eyeMaterialRight);
    eyeRight.position.set(1.2, 7, 3.5);
    eyeRight.castShadow = true;
    robot.add(eyeRight);

    // Body - large and bulky
    const bodyGeometry = new THREE.BoxGeometry(5.5, 8, 4.5);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x0f0f1a,
      emissive: 0x0f0f1a,
      emissiveIntensity: 0.2,
      shininess: 100,
      metalness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = -2;
    body.castShadow = true;
    body.receiveShadow = true;
    robot.add(body);

    // Chest armor - black with colorful glows
    const chestGeometry = new THREE.BoxGeometry(4.8, 5, 0.4);
    const chestMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: 0x06f8d9,
      emissiveIntensity: 0.9,
      shininess: 180,
    });
    const chest = new THREE.Mesh(chestGeometry, chestMaterial);
    chest.position.set(0, -1, 2.3);
    chest.castShadow = true;
    robot.add(chest);

    // Chest accent lights
    const chestAccent1Geometry = new THREE.BoxGeometry(1.2, 1.2, 0.5);
    const chestAccent1Material = new THREE.MeshPhongMaterial({
      color: 0xffe000,
      emissive: 0xffe000,
      emissiveIntensity: 1.5,
    });
    const chestAccent1 = new THREE.Mesh(chestAccent1Geometry, chestAccent1Material);
    chestAccent1.position.set(-1.5, -2, 2.5);
    chestAccent1.castShadow = true;
    robot.add(chestAccent1);

    const chestAccent2Geometry = new THREE.BoxGeometry(1.2, 1.2, 0.5);
    const chestAccent2Material = new THREE.MeshPhongMaterial({
      color: 0xff2080,
      emissive: 0xff2080,
      emissiveIntensity: 1.5,
    });
    const chestAccent2 = new THREE.Mesh(chestAccent2Geometry, chestAccent2Material);
    chestAccent2.position.set(1.5, -2, 2.5);
    chestAccent2.castShadow = true;
    robot.add(chestAccent2);

    // Left arm - thick and aggressive
    const armGeometry = new THREE.BoxGeometry(1.5, 6, 1.5);
    const armMaterialLeft = new THREE.MeshPhongMaterial({
      color: 0x0a0a0a,
      emissive: 0x06f8d9,
      emissiveIntensity: 0.4,
      shininess: 100,
    });
    const armLeft = new THREE.Mesh(armGeometry, armMaterialLeft);
    armLeft.position.set(-4.5, -1.5, 0);
    armLeft.castShadow = true;
    armLeft.receiveShadow = true;
    robot.add(armLeft);

    // Right arm - thick and aggressive
    const armMaterialRight = new THREE.MeshPhongMaterial({
      color: 0x0a0a0a,
      emissive: 0xd946ef,
      emissiveIntensity: 0.4,
      shininess: 100,
    });
    const armRight = new THREE.Mesh(armGeometry, armMaterialRight);
    armRight.position.set(4.5, -1.5, 0);
    armRight.castShadow = true;
    armRight.receiveShadow = true;
    robot.add(armRight);

    // Shoulder armor left
    const shoulderGeometry = new THREE.BoxGeometry(2, 2.5, 2);
    const shoulderMaterialLeft = new THREE.MeshPhongMaterial({
      color: 0x0f0f1a,
      emissive: 0x06f8d9,
      emissiveIntensity: 0.5,
      shininess: 110,
    });
    const shoulderLeft = new THREE.Mesh(shoulderGeometry, shoulderMaterialLeft);
    shoulderLeft.position.set(-4, 2.5, 0);
    shoulderLeft.castShadow = true;
    robot.add(shoulderLeft);

    // Shoulder armor right
    const shoulderMaterialRight = new THREE.MeshPhongMaterial({
      color: 0x0f0f1a,
      emissive: 0xd946ef,
      emissiveIntensity: 0.5,
      shininess: 110,
    });
    const shoulderRight = new THREE.Mesh(shoulderGeometry, shoulderMaterialRight);
    shoulderRight.position.set(4, 2.5, 0);
    shoulderRight.castShadow = true;
    robot.add(shoulderRight);

    // Left leg - sturdy base
    const legGeometry = new THREE.BoxGeometry(1.8, 5, 1.8);
    const legMaterialLeft = new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: 0x06f8d9,
      emissiveIntensity: 0.3,
      shininess: 90,
    });
    const legLeft = new THREE.Mesh(legGeometry, legMaterialLeft);
    legLeft.position.set(-2.2, -7, 0);
    legLeft.castShadow = true;
    legLeft.receiveShadow = true;
    robot.add(legLeft);

    // Right leg - sturdy base
    const legMaterialRight = new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: 0xd946ef,
      emissiveIntensity: 0.3,
      shininess: 90,
    });
    const legRight = new THREE.Mesh(legGeometry, legMaterialRight);
    legRight.position.set(2.2, -7, 0);
    legRight.castShadow = true;
    legRight.receiveShadow = true;
    robot.add(legRight);

    // Center robot slightly lower
    robot.position.y = 0;
    scene.add(robot);

    // Dramatic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Main cyan light
    const pointLight1 = new THREE.PointLight(0x06f8d9, 2, 200);
    pointLight1.position.set(40, 40, 40);
    pointLight1.castShadow = true;
    pointLight1.shadow.mapSize.width = 2048;
    pointLight1.shadow.mapSize.height = 2048;
    scene.add(pointLight1);

    // Magenta light
    const pointLight2 = new THREE.PointLight(0xd946ef, 1.8, 200);
    pointLight2.position.set(-40, 30, -40);
    pointLight2.castShadow = true;
    scene.add(pointLight2);

    // Yellow accent light
    const pointLight3 = new THREE.PointLight(0xffe000, 1, 150);
    pointLight3.position.set(0, -20, 30);
    scene.add(pointLight3);

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
    const animate = () => {
      requestAnimationFrame(animate);

      // Smooth mouse tracking
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      if (isHovering) {
        // Aggressive stance when hovering
        robot.rotation.y = mouseX * 0.3;
        robot.rotation.x = mouseY * 0.2;
        robot.rotation.z = mouseX * 0.1;
        
        // Leaning towards cursor
        robot.position.x = mouseX * 2;
        robot.position.y = mouseY * 1.5;
      } else {
        // Idle stance - gentle swaying
        robot.rotation.y = Math.sin(Date.now() * 0.0005) * 0.2;
        robot.rotation.x = Math.sin(Date.now() * 0.0003) * 0.1;
        robot.rotation.z = 0;
        
        // Return to center
        robot.position.x += (0 - robot.position.x) * 0.02;
        robot.position.y += (0 - robot.position.y) * 0.02;
      }

      // Eye pulsing glow
      const pulseStrength = Math.sin(Date.now() * 0.008) * 0.5 + 1;
      eyeMaterialLeft.emissiveIntensity = pulseStrength * 2;
      eyeMaterialRight.emissiveIntensity = pulseStrength * 2;

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
        background: '#0a0a0a',
        position: 'relative',
      }}
    />
  );
}
