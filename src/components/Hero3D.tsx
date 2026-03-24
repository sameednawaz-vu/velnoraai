import { useEffect, useRef, useState } from 'preact/hooks';
import * as THREE from 'three';

interface Hero3DProps {
  height?: number;
}

export default function Hero3D({ height = 600 }: Hero3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{ camera: THREE.PerspectiveCamera; torus: THREE.Mesh; particles: THREE.Mesh[] } | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [scrollScale, setScrollScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create geometries with magnetic properties
    const particles = [];

    // Central rotating torus (larger and more detailed)
    const torusGeometry = new THREE.TorusGeometry(18, 4, 32, 200);
    const torusMaterial = new THREE.MeshPhongMaterial({
      color: 0x0d7377,
      emissive: 0x14ffec,
      emissiveIntensity: 0.5,
      wireframe: false,
      shininess: 100,
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    scene.add(torus);

    // Add inner torus
    const innerTorusGeometry = new THREE.TorusGeometry(10, 2, 16, 100);
    const innerTorusMaterial = new THREE.MeshPhongMaterial({
      color: 0xd946ef,
      emissive: 0xd946ef,
      emissiveIntensity: 0.3,
      wireframe: false,
    });
    const innerTorus = new THREE.Mesh(innerTorusGeometry, innerTorusMaterial);
    innerTorus.rotation.x = Math.PI / 2.5;
    scene.add(innerTorus);

    // Orbiting spheres with more particles
    for (let i = 0; i < 8; i++) {
      const sphereGeometry = new THREE.SphereGeometry(2.5, 32, 32);
      const sphereMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL((i / 8) * 0.4 + 0.05, 0.9, 0.5),
        emissive: new THREE.Color().setHSL((i / 8) * 0.4 + 0.05, 0.9, 0.4),
        emissiveIntensity: 0.3,
        shininess: 100,
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.userData = {
        angle: (i / 8) * Math.PI * 2,
        distance: 40,
        speed: 0.002 + i * 0.0003,
        baseDistance: 40,
      };
      scene.add(sphere);
      particles.push(sphere);
    }

    // Add floating cubes
    for (let i = 0; i < 5; i++) {
      const cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      const cubeMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL((i / 5) * 0.5 + 0.5, 0.8, 0.6),
        emissive: 0x06f8d9,
        emissiveIntensity: 0.2,
      });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.userData = {
        angle: (i / 5) * Math.PI * 2,
        distance: 55,
        speed: 0.0015 + i * 0.0002,
        baseDistance: 55,
      };
      scene.add(cube);
      particles.push(cube);
    }

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x14ffec, 1.5, 150);
    pointLight1.position.set(30, 30, 30);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xd946ef, 1, 150);
    pointLight2.position.set(-30, -30, 30);
    scene.add(pointLight2);

    // Mouse tracking for magnetic effect
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const onMouseMove = (event: MouseEvent) => {
      targetMouseX = ((event.clientX / window.innerWidth) * 2 - 1) * width;
      targetMouseY = (-(event.clientY / window.innerHeight) * 2 + 1) * height;
    };

    window.addEventListener('mousemove', onMouseMove);

    // Scroll listener for zoom effect
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const maxZoom = 2.5;
      const newScale = Math.min(1 + scrollY * 0.003, maxZoom);
      setScrollScale(newScale);
      camera.position.z = 50 / newScale;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('scroll', handleScroll);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Smooth mouse tracking
      mouseX += (targetMouseX - mouseX) * 0.1;
      mouseY += (targetMouseY - mouseY) * 0.1;

      // Rotate inner torus
      innerTorus.rotation.x += 0.0005;
      innerTorus.rotation.z += 0.001;

      if (isHovering) {
        // When hovering: strong magnetic effect
        torus.rotation.x += 0.002;
        torus.rotation.y += 0.003;
        
        particles.forEach((particle, index) => {
          particle.userData.angle += particle.userData.speed;
          
          let x = Math.cos(particle.userData.angle) * particle.userData.distance;
          let y = Math.sin(particle.userData.angle) * particle.userData.distance * 0.5;
          let z = Math.sin(particle.userData.angle * 0.5) * 15;
          
          // Strong magnetic attraction to mouse when hovering
          const magnetStrength = 0.15;
          x += (mouseX / width) * 50 * magnetStrength;
          y += (mouseY / height) * 50 * magnetStrength;
          z += Math.sin(Date.now() * 0.001 + index) * 5;
          
          particle.position.set(x, y, z);
          particle.rotation.x += 0.008;
          particle.rotation.y += 0.008;
          particle.rotation.z += 0.004;
        });
      } else {
        // Gentle rotation when not hovering
        torus.rotation.x += 0.0005;
        torus.rotation.y += 0.001;
        
        particles.forEach((particle, index) => {
          particle.userData.angle += particle.userData.speed * 0.5;
          
          let x = Math.cos(particle.userData.angle) * particle.userData.distance;
          let y = Math.sin(particle.userData.angle) * particle.userData.distance * 0.5;
          let z = Math.sin(particle.userData.angle * 0.5) * 10;
          
          // Very subtle magnetic effect
          const magnetStrength = 0.02;
          x += (mouseX / width) * 20 * magnetStrength;
          y += (mouseY / height) * 20 * magnetStrength;
          
          particle.position.set(x, y, z);
          particle.rotation.x += 0.002;
          particle.rotation.y += 0.002;
        });
      }

      renderer.render(scene, camera);
    };

    animate();
    sceneRef.current = { camera, torus, particles };

    // Handle mouse enter/leave for hover animation
    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

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
      window.removeEventListener('scroll', handleScroll);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      renderer.dispose();
      torusGeometry.dispose();
      torusMaterial.dispose();
      innerTorusGeometry.dispose();
      innerTorusMaterial.dispose();
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
