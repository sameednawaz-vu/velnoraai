import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, WandSparkles } from 'lucide-react';
import './aether-flow-hero.css';

type AetherFlowHeroProps = {
  title?: string;
  subtitle?: string;
  description?: string;
  primaryHref?: string;
  secondaryHref?: string;
  tertiaryHref?: string;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
};

const MIN_PARTICLES = 70;
const MAX_PARTICLES = 170;
const CONNECT_DISTANCE = 150;
const MOUSE_RADIUS = 180;

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.2 + index * 0.16,
      duration: 0.8,
      ease: [0.21, 1.11, 0.81, 0.99],
    },
  }),
};

export default function AetherFlowHero({
  title = 'Velnora',
  subtitle = 'Client-side tools that ship outcomes',
  description = 'Run 120 deterministic tools with no private API keys required. Search by category, execute instantly, and ship cleaner work faster.',
  primaryHref = '/tools',
  secondaryHref = '/tools/writing-messaging',
  tertiaryHref = '/learning-hub',
}: AetherFlowHeroProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const heroRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const heroElement = heroRef.current;
    if (!canvas || !heroElement) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const mouse = {
      x: Number.NaN,
      y: Number.NaN,
      active: false,
    };

    let width = 0;
    let height = 0;
    let frameId = 0;
    let particles: Particle[] = [];

    const setSize = () => {
      width = heroElement.clientWidth;
      height = heroElement.clientHeight;
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      initParticles();
    };

    const initParticles = () => {
      const total = clamp(Math.round((width * height) / 9800), MIN_PARTICLES, MAX_PARTICLES);
      particles = Array.from({ length: total }, () => {
        const direction = Math.random() * Math.PI * 2;
        const speed = 0.18 + Math.random() * 0.5;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(direction) * speed,
          vy: Math.sin(direction) * speed,
          size: 1 + Math.random() * 2.6,
          hue: 180 + Math.random() * 80,
        };
      });
    };

    const drawBackdrop = () => {
      const background = context.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, '#09101f');
      background.addColorStop(0.5, '#0f1c32');
      background.addColorStop(1, '#10273b');
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
    };

    const updateParticles = () => {
      for (const particle of particles) {
        if (mouse.active) {
          const dx = mouse.x - particle.x;
          const dy = mouse.y - particle.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < MOUSE_RADIUS) {
            const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
            particle.x -= (dx / distance) * force * 2.3;
            particle.y -= (dy / distance) * force * 2.3;
          }
        }

        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x <= 0 || particle.x >= width) {
          particle.vx *= -1;
          particle.x = clamp(particle.x, 0, width);
        }

        if (particle.y <= 0 || particle.y >= height) {
          particle.vy *= -1;
          particle.y = clamp(particle.y, 0, height);
        }

        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fillStyle = `hsla(${particle.hue}, 95%, 72%, 0.72)`;
        context.fill();
      }
    };

    const drawConnections = () => {
      for (let a = 0; a < particles.length; a += 1) {
        for (let b = a + 1; b < particles.length; b += 1) {
          const first = particles[a];
          const second = particles[b];
          const dx = first.x - second.x;
          const dy = first.y - second.y;
          const distance = Math.hypot(dx, dy);

          if (distance > CONNECT_DISTANCE) {
            continue;
          }

          const opacity = 1 - distance / CONNECT_DISTANCE;
          const nearMouse =
            mouse.active &&
            (Math.hypot(first.x - mouse.x, first.y - mouse.y) < MOUSE_RADIUS * 0.9 ||
              Math.hypot(second.x - mouse.x, second.y - mouse.y) < MOUSE_RADIUS * 0.9);

          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.strokeStyle = nearMouse
            ? `rgba(255, 251, 240, ${0.2 + opacity * 0.56})`
            : `rgba(104, 211, 239, ${0.05 + opacity * 0.35})`;
          context.lineWidth = nearMouse ? 1.12 : 0.85;
          context.stroke();
        }
      }
    };

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      drawBackdrop();
      updateParticles();
      drawConnections();
    };

    const pointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      mouse.x = event.clientX - bounds.left;
      mouse.y = event.clientY - bounds.top;
      mouse.active = true;
    };

    const pointerLeave = () => {
      mouse.active = false;
      mouse.x = Number.NaN;
      mouse.y = Number.NaN;
    };

    setSize();
    animate();

    window.addEventListener('resize', setSize);
    heroElement.addEventListener('pointermove', pointerMove);
    heroElement.addEventListener('pointerleave', pointerLeave);

    return () => {
      window.removeEventListener('resize', setSize);
      heroElement.removeEventListener('pointermove', pointerMove);
      heroElement.removeEventListener('pointerleave', pointerLeave);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <section ref={heroRef} className="aether-hero" aria-label="Velnora animated hero">
      <canvas ref={canvasRef} className="aether-canvas" aria-hidden="true" />

      <div className="aether-vignette" aria-hidden="true" />
      <div className="aether-grid" aria-hidden="true" />

      <div className="aether-content">
        <motion.div
          custom={0}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="aether-pill"
        >
          <Sparkles size={15} />
          <span>Dynamic Rendering Engine</span>
        </motion.div>

        <motion.h1 custom={1} variants={fadeUpVariants} initial="hidden" animate="visible" className="aether-title">
          {title}
        </motion.h1>

        <motion.p custom={2} variants={fadeUpVariants} initial="hidden" animate="visible" className="aether-subtitle">
          {subtitle}
        </motion.p>

        <motion.p
          custom={3}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          className="aether-description"
        >
          {description}
        </motion.p>

        <motion.div custom={4} variants={fadeUpVariants} initial="hidden" animate="visible" className="aether-actions">
          <a href={primaryHref} className="aether-btn aether-btn-primary">
            Browse Tools
            <ArrowRight size={18} />
          </a>
          <a href={secondaryHref} className="aether-btn aether-btn-primary">
            Open Writing Tools
          </a>
          <a href={tertiaryHref} className="aether-btn aether-btn-ghost">
            <WandSparkles size={16} />
            Start Learning
          </a>
        </motion.div>
      </div>
    </section>
  );
}
