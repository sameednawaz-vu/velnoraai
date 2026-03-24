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
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create geometries with magnetic properties
    const particles = [];

    // Central rotating torus
    const torusGeometry = new THREE.TorusGeometry(15, 3, 16, 100);
    const torusMaterial = new THREE.MeshPhongMaterial({
      color: 0x0d7377,
      emissive: 0x14ffec,
      emissiveIntensity: 0.3,
      wireframe: false,
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    scene.add(torus);

    // Orbiting spheres
    for (let i = 0; i < 5; i++) {
      const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
      const sphereMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL((i / 5) * 0.3 + 0.1, 0.8, 0.5),
        emissive: new THREE.Color().setHSL((i / 5) * 0.3 + 0.1, 0.8, 0.3),
        emissiveIntensity: 0.2,
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.userData = {
        angle: (i / 5) * Math.PI * 2,
        distance: 35,
        speed: 0.003 + i * 0.0005,
      };
      scene.add(sphere);
      particles.push(sphere);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x14ffec, 1, 100);
    pointLight.position.set(20, 20, 20);
    scene.add(pointLight);

    // Mouse tracking for magnetic effect
    let mouseX = 0;
    let mouseY = 0;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      mouseX = event.clientX - width / 2;
      mouseY = event.clientY - height / 2;
    };

    window.addEventListener('mousemove', onMouseMove);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Only animate when mouse is hovering over the hero
      if (isHovering) {
        // Rotate central torus
        torus.rotation.x += 0.001;
        torus.rotation.y += 0.002;

        // Animate orbiting particles with magnetic effect
        particles.forEach((particle) => {
          particle.userData.angle += particle.userData.speed;
          
          let x = Math.cos(particle.userData.angle) * particle.userData.distance;
          let y = Math.sin(particle.userData.angle) * particle.userData.distance * 0.5;
          
          // Magnetic attraction to mouse
          const magnetStrength = 0.05;
          x += (mouseX / width) * 30 * magnetStrength;
          y += (mouseY / height) * 30 * magnetStrength;
          
          particle.position.x = x;
          particle.position.y = y;
          particle.rotation.x += 0.005;
          particle.rotation.y += 0.005;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

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
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      renderer.dispose();
      torusGeometry.dispose();
      torusMaterial.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [height, isHovering]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: `${height}px`,
        background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
      }}
    />
  );
}
