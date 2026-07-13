import { useEffect, useRef } from "react";

interface TrailDot {
  x: number;
  y: number;
  alpha: number;
  scale: number;
  hue: number;
}

const TRAIL_LENGTH = 28;
const FADE_SPEED = 0.035;

export function CursorLight() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const trailRef = useRef<TrailDot[]>([]);
  const rafRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const animate = (time: number) => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new trail dots at ~60fps intervals
      if (time - lastSpawnRef.current > 16) {
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        if (mx > 0 && my > 0) {
          trailRef.current.push({
            x: mx,
            y: my,
            alpha: 1,
            scale: 1,
            hue: (time * 0.05) % 360,
          });
        }
        // Keep trail at max length
        while (trailRef.current.length > TRAIL_LENGTH) {
          trailRef.current.shift();
        }
        lastSpawnRef.current = time;
      }

      // Draw the ambient glow under cursor
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      if (mx > 0 && my > 0) {
        const ambientGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 180);
        ambientGrad.addColorStop(0, "rgba(0, 210, 255, 0.08)");
        ambientGrad.addColorStop(0.5, "rgba(168, 0, 255, 0.04)");
        ambientGrad.addColorStop(1, "transparent");
        ctx.fillStyle = ambientGrad;
        ctx.fillRect(mx - 200, my - 200, 400, 400);
      }

      // Draw trail dots (oldest to newest)
      const trail = trailRef.current;
      for (let i = 0; i < trail.length; i++) {
        const dot = trail[i];

        // Fade and shrink
        dot.alpha -= FADE_SPEED;
        dot.scale *= 0.97;

        if (dot.alpha <= 0) continue;

        const progress = i / trail.length; // 0 = oldest, 1 = newest
        const size = Math.max(2, 10 * dot.scale * progress);

        // Core dot
        ctx.save();
        ctx.globalAlpha = dot.alpha * 0.9;

        // Outer glow
        const glowGrad = ctx.createRadialGradient(
          dot.x, dot.y, 0,
          dot.x, dot.y, size * 4
        );
        const cyanAlpha = (dot.alpha * 0.25 * progress).toFixed(3);
        const purpleAlpha = (dot.alpha * 0.12 * progress).toFixed(3);
        glowGrad.addColorStop(0, `rgba(0, 210, 255, ${cyanAlpha})`);
        glowGrad.addColorStop(0.5, `rgba(168, 0, 255, ${purpleAlpha})`);
        glowGrad.addColorStop(1, "transparent");
        ctx.fillStyle = glowGrad;
        ctx.fillRect(dot.x - size * 4, dot.y - size * 4, size * 8, size * 8);

        // Core bright dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
        const coreGrad = ctx.createRadialGradient(
          dot.x, dot.y, 0,
          dot.x, dot.y, size
        );
        coreGrad.addColorStop(0, `rgba(255, 255, 255, ${(dot.alpha * 0.8 * progress).toFixed(3)})`);
        coreGrad.addColorStop(0.4, `rgba(0, 210, 255, ${(dot.alpha * 0.6 * progress).toFixed(3)})`);
        coreGrad.addColorStop(1, `rgba(168, 0, 255, ${(dot.alpha * 0.2 * progress).toFixed(3)})`);
        ctx.fillStyle = coreGrad;
        ctx.fill();

        ctx.restore();
      }

      // Remove dead dots
      trailRef.current = trail.filter((d) => d.alpha > 0);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="cursor-trail-canvas"
    />
  );
}
