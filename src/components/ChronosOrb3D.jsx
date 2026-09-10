import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { COURSE_COLORS } from '../data/rosterData';
import { Sparkles, Compass, Eye, RotateCw, MapPin, Clock } from 'lucide-react';
import { playTactileClick } from '../services/soundEngine';

export default function ChronosOrb3D({ schedule = [], courses = [], onSelectSession }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [isAutoRotate, setIsAutoRotate] = useState(!prefersReducedMotion);
  const isAutoRotateRef = useRef(!prefersReducedMotion);

  useEffect(() => {
    isAutoRotateRef.current = isAutoRotate;
  }, [isAutoRotate]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. Scene, Camera, Renderer with Dynamic Flex Dimensions
    const getTargetDimensions = () => {
      const w = container.clientWidth || 360;
      const h = canvas.parentElement?.clientHeight || (container.clientHeight ? Math.max(220, container.clientHeight - 80) : 320);
      return { width: w, height: h };
    };

    const { width, height } = getTargetDimensions();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4, 13);
    camera.lookAt(0, 0, 0);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (err) {
      console.warn('WebGL initialization failed:', err);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const handleContextLost = (e) => {
      e.preventDefault();
      console.warn('WebGL context lost in ChronosOrb3D.');
    };
    canvas.addEventListener('webglcontextlost', handleContextLost, false);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00A9B8, 2.5, 30);
    pointLight.position.set(5, 8, 8);
    scene.add(pointLight);

    const rimLight = new THREE.PointLight(0xC2913A, 1.8, 30);
    rimLight.position.set(-8, -4, -6);
    scene.add(rimLight);

    // 3. Central Student Nucleus (Energy Orb)
    const nucleusGroup = new THREE.Group();
    scene.add(nucleusGroup);

    const coreGeo = new THREE.IcosahedronGeometry(1.3, 3);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00A9B8,
      emissive: 0x00454D,
      roughness: 0.3,
      metalness: 0.4,
      wireframe: false
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    nucleusGroup.add(coreMesh);

    // Inner wireframe lattice
    const wireGeo = new THREE.IcosahedronGeometry(1.45, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xE9E5DC,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    nucleusGroup.add(wireMesh);

    // 4. Orbital Rings for Enrolled Courses
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const orbitalData = [
      { code: 'OMCR', radius: 2.6, color: 0x00A9B8, tiltX: 0.25, tiltZ: 0.15 },
      { code: 'BDM', radius: 3.7, color: 0x8A6690, tiltX: -0.35, tiltZ: 0.3 },
      { code: 'B2B', radius: 4.8, color: 0x4E6E9C, tiltX: 0.45, tiltZ: -0.25 },
      { code: 'IMCE', radius: 5.9, color: 0x6E8C63, tiltX: -0.2, tiltZ: -0.35 }
    ];

    const interactiveMeshes = [];

    orbitalData.forEach((orbit, oIdx) => {
      const ringGeo = new THREE.TorusGeometry(orbit.radius, 0.025, 16, 120);
      const ringMat = new THREE.MeshStandardMaterial({
        color: orbit.color,
        emissive: orbit.color,
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.6
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2 + orbit.tiltX;
      ringMesh.rotation.z = orbit.tiltZ;
      ringGroup.add(ringMesh);

      // Distribute session nodes along this course orbit
      const courseSessions = schedule.filter(s => s.courseCode === orbit.code);
      const nodeCount = Math.min(courseSessions.length || 6, 8);

      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        const sessionData = courseSessions[i] || {
          courseCode: orbit.code,
          courseName: courses.find(c => c.code === orbit.code)?.name || orbit.code,
          venue: 'MCR 07',
          startTime: '10:20',
          endTime: '11:50',
          classDate: '2026-09-11'
        };

        const nodeGeo = new THREE.SphereGeometry(0.18, 16, 16);
        const nodeMat = new THREE.MeshStandardMaterial({
          color: orbit.color,
          emissive: orbit.color,
          emissiveIntensity: 0.6,
          roughness: 0.2
        });
        const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);

        // Position on inclined orbital plane
        const px = Math.cos(angle) * orbit.radius;
        const py = Math.sin(angle) * orbit.radius;
        const pos = new THREE.Vector3(px, 0, py);
        pos.applyEuler(new THREE.Euler(Math.PI / 2 + orbit.tiltX, 0, orbit.tiltZ));

        nodeMesh.position.copy(pos);
        nodeMesh.userData = {
          session: sessionData,
          baseScale: 1,
          orbitRadius: orbit.radius,
          angle,
          color: orbit.color
        };

        ringGroup.add(nodeMesh);
        interactiveMeshes.push(nodeMesh);
      }
    });

    // 5. Stardust Particle Cloud
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 22;
      positions[i + 1] = (Math.random() - 0.5) * 16;
      positions[i + 2] = (Math.random() - 0.5) * 20;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xDCD4C7,
      size: 0.08,
      transparent: true,
      opacity: 0.6
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Pointer & Raycasting Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let isDragging = false;
    let previousPointerPos = { x: 0, y: 0 };
    let rotVelocity = { x: 0, y: 0 };

    const onPointerDown = (e) => {
      isDragging = true;
      const rect = canvas.getBoundingClientRect();
      previousPointerPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.x = x;
      mouse.y = y;

      if (isDragging) {
        const deltaX = e.clientX - previousPointerPos.x;
        const deltaY = e.clientY - previousPointerPos.y;
        rotVelocity.x = deltaX * 0.005;
        rotVelocity.y = deltaY * 0.005;
        ringGroup.rotation.y += rotVelocity.x;
        ringGroup.rotation.x += rotVelocity.y;
        previousPointerPos = { x: e.clientX, y: e.clientY };
      }

      // Check raycast for node hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        canvas.style.cursor = 'pointer';
        setHoveredNode(hit.userData.session);
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10 });
        hit.scale.set(1.4, 1.4, 1.4);
      } else {
        canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
        setHoveredNode(null);
        interactiveMeshes.forEach(m => m.scale.set(1, 1, 1));
      }
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;

      // Click detection if movement was tiny
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        playTactileClick(950);
        if (onSelectSession) {
          onSelectSession(hit.userData.session);
        }
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 7. Animation Loop & Visibility Observer
    let animId;
    let clock = new THREE.Clock();
    let isVisible = true;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let observer;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting && !document.hidden;
      }, { threshold: 0.05 });
      observer.observe(container);
    }

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return; // Battery and GPU optimization when off-screen

      const elapsed = clock.getElapsedTime();

      // Nucleus respiration
      const pulse = Math.sin(elapsed * 1.8) * 0.06;
      nucleusGroup.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
      nucleusGroup.rotation.y = elapsed * 0.3;
      wireMesh.rotation.x = -elapsed * 0.2;

      // Gentle auto-rotation of orbits
      if (isAutoRotateRef.current && !isDragging) {
        ringGroup.rotation.y += 0.003;
      }

      // Natural damping after drag
      if (!isDragging) {
        ringGroup.rotation.y += rotVelocity.x;
        ringGroup.rotation.x += rotVelocity.y;
        rotVelocity.x *= 0.94;
        rotVelocity.y *= 0.94;
      }

      // Particle gentle sway
      particles.rotation.y = elapsed * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Responsive Dynamic Resize via ResizeObserver & Window Resize
    const handleResize = () => {
      if (!container || !canvas || !renderer) return;
      const { width: newW, height: newH } = getTargetDimensions();
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    };
    window.addEventListener('resize', handleResize);

    let resizeObs = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObs = new ResizeObserver(() => {
        handleResize();
      });
      if (container) resizeObs.observe(container);
      if (canvas.parentElement) resizeObs.observe(canvas.parentElement);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (resizeObs) resizeObs.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (observer && container) observer.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('webglcontextlost', handleContextLost);

      // Deep GPU resource disposal to avoid memory leaks
      scene.traverse((child) => {
        if (child.isMesh || child.isPoints) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      renderer.dispose();
    };
  }, [schedule, courses, onSelectSession]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '12px 16px',
        position: 'relative',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}
    >
      {/* 3D Canvas Header Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 10,
        marginBottom: '6px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            backgroundColor: 'var(--wash-mizu)',
            color: 'var(--mizu)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Compass size={16} />
          </div>
          <div>
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: 0
            }}>
              Chronos Continuum
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--ink-soft)', margin: 0 }}>
              Spatial orbital view of Term-5 commitments
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            playTactileClick();
            setIsAutoRotate(prev => !prev);
          }}
          aria-label={isAutoRotate ? "Pause 3D orbital rotation" : "Resume 3D orbital rotation"}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 9px',
            borderRadius: '9999px',
            border: '1px solid var(--border)',
            backgroundColor: isAutoRotate ? 'var(--wash-moss)' : 'var(--paper)',
            color: isAutoRotate ? 'var(--moss-text)' : 'var(--ink-soft)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <RotateCw size={11} style={{ animation: isAutoRotate ? 'spin 6s linear infinite' : 'none' }} />
          <span>{isAutoRotate ? 'Orbiting' : 'Paused'}</span>
        </button>
      </div>

      {/* WebGL Canvas Wrapper - Flex Fill */}
      <div style={{
        position: 'relative',
        width: '100%',
        flex: 1,
        minHeight: '200px',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: 'grab',
            touchAction: 'none'
          }}
        />

        {/* Hovered In-World Tooltip */}
        {hoveredNode && (
          <div
            style={{
              position: 'absolute',
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              transform: 'translate(-50%, -100%)',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '8px 12px',
              boxShadow: 'var(--shadow-lg)',
              pointerEvents: 'none',
              zIndex: 30,
              whiteSpace: 'nowrap',
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mizu)' }}>
              {hoveredNode.courseCode} • {hoveredNode.courseName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '10px', color: 'var(--ink-soft)' }}>
              <span><Clock size={10} style={{ verticalAlign: 'middle' }} /> {hoveredNode.startTime}-{hoveredNode.endTime}</span>
              <span><MapPin size={10} style={{ verticalAlign: 'middle' }} /> {hoveredNode.venue}</span>
            </div>
            <div style={{ fontSize: '9px', color: 'var(--ink-soft)', marginTop: '2px', fontStyle: 'italic' }}>
              Tap to inspect lecture
            </div>
          </div>
        )}
      </div>

      {/* Course Ring Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        marginTop: '6px',
        paddingTop: '6px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0
      }}>
        {orbitalDataTokens.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              color: 'var(--ink)',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '6px',
              backgroundColor: item.wash,
              border: `1px solid ${item.border}`
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: item.color }} />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const orbitalDataTokens = [
  { name: 'OMCR', color: '#00A9B8', wash: 'var(--wash-mizu)', border: 'rgba(0,169,184,0.3)' },
  { name: 'BDM', color: '#8A6690', wash: 'var(--wash-plum)', border: 'rgba(138,102,144,0.3)' },
  { name: 'B2B', color: '#4E6E9C', wash: 'var(--wash-indigo)', border: 'rgba(78,110,156,0.3)' },
  { name: 'IMCE', color: '#6E8C63', wash: 'var(--wash-moss)', border: 'rgba(110,140,99,0.3)' }
];
