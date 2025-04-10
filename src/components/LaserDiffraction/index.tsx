
import React, { useRef, useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import styles from './LaserDiffraction.module.css';

// Material data with particle sizes in micrometers
const materialsData = {
  "lycopodium": 30,
  "silica": 5,
  "custom": null
};

const LaserDiffraction = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wavelength, setWavelength] = useState<string>('650');
  const [distance, setDistance] = useState<string>('100');
  const [particleSize, setParticleSize] = useState<string>('10');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('lycopodium');

  // Update particle size when material changes
  useEffect(() => {
    if (selectedMaterial !== 'custom' && materialsData[selectedMaterial as keyof typeof materialsData]) {
      setParticleSize(materialsData[selectedMaterial as keyof typeof materialsData]?.toString() || '10');
    }
  }, [selectedMaterial]);

  // Generate the diffraction pattern
  const generatePattern = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Convert inputs to SI units
    const wavelengthSI = parseFloat(wavelength) * 1e-9; // nm to m
    const distanceSI = parseFloat(distance) * 1e-2; // cm to m
    const particleSizeSI = parseFloat(particleSize) * 1e-6; // µm to m
    
    // Clear the canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    
    // Draw coordinate lines for reference
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    // Calculate the locations of the diffraction rings
    // Using the formula: sin(θ) = mλ/d
    // Where θ is the angle, m is the order, λ is wavelength, d is particle size
    const maxOrder = 10; // Increased number of rings to display
    
    // Draw the central bright spot first
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    for (let m = 1; m <= maxOrder; m++) {
      // Calculate angle for this order
      const sinTheta = m * wavelengthSI / particleSizeSI;
      
      // If the angle would be > 1 (beyond 90 degrees), skip this ring
      if (Math.abs(sinTheta) >= 1) continue;
      
      const theta = Math.asin(sinTheta);
      
      // Calculate radius on the screen based on distance and angle
      // Using R = D * tan(θ) where D is distance to screen
      const radius = distanceSI * Math.tan(theta);
      
      // Convert to screen coordinates (pixels)
      // Higher scale factor to make rings more visible
      // Adjust this value to make rings more visible
      const scaleFactor = 4000; // Increased from previous value for better visibility
      const pixelRadius = radius * scaleFactor;
      
      // Only draw if the ring fits on the canvas
      if (pixelRadius <= Math.min(width, height) / 2) {
        // Draw the ring with increased thickness and opacity
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 0, 0, 0.9)`;
        ctx.lineWidth = 3; // Thicker lines for better visibility
        ctx.arc(centerX, centerY, pixelRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Add ring number for reference
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px Arial';
        ctx.fillText(`m=${m}`, centerX + pixelRadius + 5, centerY);
      }
    }
    
    // Add a note about the visualization scale
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '14px Arial';
    ctx.fillText('Note: Diffraction pattern scale has been enhanced for visibility', 20, height - 20);
  };

  // Generate pattern on component mount and when inputs change
  useEffect(() => {
    generatePattern();
  }, [wavelength, distance, particleSize, selectedMaterial]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Laser Particle Size VLab</h1>
      
      <div className={styles.controls}>
        <label className={styles.label}>
          Wavelength (nm):
          <input
            type="number"
            value={wavelength}
            onChange={(e) => setWavelength(e.target.value)}
            className={styles.input}
            min="400"
            max="700"
          />
        </label>
        
        <label className={styles.label}>
          Screen Distance (cm):
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className={styles.input}
            min="10"
            max="500"
          />
        </label>
        
        <label className={styles.label}>
          Particle Size (µm):
          <input
            type="number"
            value={particleSize}
            onChange={(e) => setParticleSize(e.target.value)}
            className={styles.input}
            disabled={selectedMaterial !== 'custom'}
            min="1"
            max="100"
          />
        </label>
        
        <label className={styles.label}>
          Material:
          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className={styles.select}
          >
            <option value="lycopodium">Lycopodium Powder</option>
            <option value="silica">Silica Particles</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        
        <button onClick={generatePattern} className={styles.button}>
          Generate Diffraction Pattern
        </button>
      </div>

      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={800}
          height={400}
        />
      </div>
    </div>
  );
};

export default LaserDiffraction;
