
import React, { useRef, useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from './LaserDiffraction.module.css';

// Material data with particle sizes in micrometers
const materialsData = {
  "lycopodium": 30,
  "silica": 5,
  "custom": null
};

const LaserDiffraction = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenshotCanvasRef = useRef<HTMLCanvasElement>(null);
  const [wavelength, setWavelength] = useState<string>('650');
  const [distance, setDistance] = useState<string>('100');
  const [particleSize, setParticleSize] = useState<string>('10');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('lycopodium');
  const [zoomLevel, setZoomLevel] = useState<number[]>([1]);

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
    
    // Apply zoom factor to the scale
    const baseScaleFactor = 4000; 
    const scaleFactor = baseScaleFactor * zoomLevel[0];
    
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
      // Use zoom level to adjust visibility
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
  };

  // Generate pattern on component mount and when inputs change
  useEffect(() => {
    generatePattern();
  }, [wavelength, distance, particleSize, selectedMaterial, zoomLevel]);

  // Take a screenshot of the canvas with parameters
  const takeScreenshot = () => {
    const mainCanvas = canvasRef.current;
    const screenshotCanvas = screenshotCanvasRef.current;
    
    if (!mainCanvas || !screenshotCanvas) return;
    
    const ctx = screenshotCanvas.getContext('2d');
    if (!ctx) return;
    
    // Set screenshot canvas dimensions
    screenshotCanvas.width = mainCanvas.width;
    screenshotCanvas.height = mainCanvas.height + 100; // Extra space for parameters
    
    // Fill background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, screenshotCanvas.width, screenshotCanvas.height);
    
    // Draw the diffraction pattern
    ctx.drawImage(mainCanvas, 0, 0);
    
    // Add parameters text
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    const padding = 10;
    let yPos = mainCanvas.height + 20;
    
    // Material name with first letter capitalized
    const materialName = selectedMaterial === 'custom' 
      ? 'Custom' 
      : selectedMaterial.charAt(0).toUpperCase() + selectedMaterial.slice(1);
    
    ctx.fillText(`Material: ${materialName}`, padding, yPos);
    ctx.fillText(`Wavelength: ${wavelength} nm`, padding + 180, yPos);
    yPos += 25;
    
    ctx.fillText(`Particle Size: ${particleSize} μm`, padding, yPos);
    ctx.fillText(`Screen Distance: ${distance} cm`, padding + 180, yPos);
    yPos += 25;
    
    ctx.fillText(`Zoom Level: ${zoomLevel[0].toFixed(1)}x`, padding, yPos);
    
    // Draw timestamp
    const date = new Date();
    const timestamp = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    ctx.fillText(`Generated: ${timestamp}`, screenshotCanvas.width - 220, yPos);
    
    // Generate download link
    const dataUrl = screenshotCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `laser-diffraction-${date.getTime()}.png`;
    link.href = dataUrl;
    link.click();
  };

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

      <div className={styles.zoomControls}>
        <label className={styles.zoomLabel}>
          Zoom: {zoomLevel[0].toFixed(1)}x
          <Slider
            value={zoomLevel}
            onValueChange={setZoomLevel}
            min={0.1}
            max={5}
            step={0.1}
            className={styles.zoomSlider}
          />
        </label>
      </div>

      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={800}
          height={400}
        />
      </div>
      
      <div className={styles.screenshotControls}>
        <Button 
          onClick={takeScreenshot} 
          variant="outline" 
          className={styles.screenshotButton}
        >
          <Camera className={styles.icon} />
          Capture Screenshot
        </Button>
        
        {/* Hidden canvas for screenshot */}
        <canvas
          ref={screenshotCanvasRef}
          style={{ display: 'none' }}
          width={800}
          height={500}
        />
      </div>
    </div>
  );
};

export default LaserDiffraction;
