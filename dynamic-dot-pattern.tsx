"use client"

import { useEffect, useRef } from "react"

interface Dot {
  x: number
  y: number
  baseX: number
  baseY: number
  originalX: number
  originalY: number
  size: number
  opacity: number
  phase?: number
  pulseSpeed?: number
  baseSize?: number
  maxGlow?: number
  displaySize?: number
  displayX?: number
  displayY?: number
  displayOpacity?: number
  originalSize?: number
  gradientPosition?: number // Position in the gradient (0-1)
}

// Easing functions for smoother transitions
const easing = {
  // Cubic easing in/out - acceleration until halfway, then deceleration
  easeInOutCubic: (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  },
  // Quadratic easing in/out - acceleration until halfway, then deceleration
  easeInOutQuad: (t: number): number => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  },
  // Sine easing in/out - gentle acceleration and deceleration
  easeInOutSine: (t: number): number => {
    return -(Math.cos(Math.PI * t) - 1) / 2
  },
  // Smooth step function - even smoother transitions
  smoothStep: (t: number): number => {
    return t * t * (3 - 2 * t)
  },
  // Smoother step function - ultra smooth transitions
  smootherStep: (t: number): number => {
    return t * t * t * (t * (t * 6 - 15) + 10)
  },
}

export default function DynamicDotPattern() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const dotsRef = useRef<Dot[]>([])
  const fpsRef = useRef<number[]>([])
  const lastFpsUpdateRef = useRef<number>(0)
  const gradientTimeRef = useRef<number>(0)

  // Function to setup dot animations
  function setupDotAnimations(dots: Dot[]) {
    const basePulseSpeed = 0.002 // Slower base pulse speed
    const pulseSpeedVariation = 0.001 // Reduced variation

    // Initialize animation properties for each dot
    dots.forEach((dot) => {
      dot.phase = Math.random() * Math.PI * 2 // Random starting phase
      dot.pulseSpeed = basePulseSpeed + Math.random() * pulseSpeedVariation // Slightly randomized pulse speed
      dot.maxGlow = 1.5 + Math.random() * 0.5 // Subtle glow variation

      // Assign a gradient position based on position in the canvas
      // This creates a spatial gradient effect
      dot.gradientPosition = (dot.originalY / window.innerHeight) * 0.7 + (dot.originalX / window.innerWidth) * 0.3
    })

    // Function to update animations
    function updateAnimations(timestamp: number) {
      dots.forEach((dot) => {
        if (!dot.phase || !dot.pulseSpeed || !dot.maxGlow) return

        // Calculate pulse
        const pulse = Math.sin(dot.phase + timestamp * dot.pulseSpeed) * 0.5 + 0.5

        // Animate size
        dot.displaySize = dot.baseSize! + pulse * 0.75 // Reduced size variation

        // Animate opacity
        dot.displayOpacity = dot.opacity + pulse * 0.25 // Reduced opacity variation

        // Update display position with subtle movement
        const moveAmplitude = 0.5 // Very subtle movement
        dot.displayX = dot.x + Math.sin(timestamp * 0.0003 + dot.phase!) * moveAmplitude
        dot.displayY = dot.y + Math.cos(timestamp * 0.0002 + dot.phase! * 1.3) * moveAmplitude
      })
    }

    return { updateAnimations }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // DYNAMIC BARREL DISTORTION - IMPLEMENT EXACTLY AS SHOWN
    function setupDynamicDistortion() {
      // Time-based animation parameters
      let time = 0
      const waveSpeed = 0.0005 // Speed of distortion changes

      // Dynamic distortion coefficients
      const baseK1 = 3.8
      const baseK2 = 2.2
      const baseK3 = 1.5

      // Animation amplitude (50% variation)
      const k1Amplitude = baseK1 * 0.5
      const k2Amplitude = baseK2 * 0.5
      const k3Amplitude = baseK3 * 0.5

      // Function to update distortion based on time
      function updateDistortion(deltaTime: number) {
        time += deltaTime

        // Calculate time-based variation for coefficients
        const k1 = baseK1 + Math.sin(time * waveSpeed) * k1Amplitude
        const k2 = baseK2 + Math.sin(time * waveSpeed * 1.3 + 1) * k2Amplitude
        const k3 = baseK3 + Math.sin(time * waveSpeed * 0.7 + 2) * k3Amplitude

        // Calculate normalized distortion intensity (0-1)
        // This represents how "zoomed in" the barrel distortion is
        const k1Normalized = (k1 - (baseK1 - k1Amplitude)) / (2 * k1Amplitude)

        return { k1, k2, k3, time, distortionIntensity: k1Normalized }
      }

      // Function to apply dynamic distortion to a point
      function applyDynamicDistortion(
        x: number,
        y: number,
        centerX: number,
        centerY: number,
        k1: number,
        k2: number,
        k3: number,
      ) {
        // Calculate normalized distance from center
        const dx = (x - centerX) / centerX
        const dy = (y - centerY) / centerY
        const distanceSquared = dx * dx + dy * dy

        // Calculate dynamic distortion factor
        const distortionFactor =
          1 + k1 * distanceSquared + k2 * Math.pow(distanceSquared, 2) + k3 * Math.pow(distanceSquared, 3)

        // Apply distortion
        const newX = centerX + dx * centerX * distortionFactor
        const newY = centerY + dy * centerY * distortionFactor

        return { x: newX, y: newY }
      }

      return { updateDistortion, applyDynamicDistortion }
    }

    // DYNAMIC POSITION UPDATES - IMPLEMENT EXACTLY
    function updateDotPositions(
      dots: Dot[],
      k1: number,
      k2: number,
      k3: number,
      centerX: number,
      centerY: number,
      applyDynamicDistortion: Function,
    ) {
      dots.forEach((dot) => {
        // Start with original grid position
        const x = dot.originalX
        const y = dot.originalY

        // Apply current distortion values
        const distorted = applyDynamicDistortion(x, y, centerX, centerY, k1, k2, k3)

        // Update base positions
        dot.baseX = distorted.x
        dot.baseY = distorted.y

        // Apply to current position
        dot.x = dot.baseX
        dot.y = dot.baseY
      })
    }

    // Create distorted dot pattern with optimized density
    function createDistortedDotPattern() {
      const dots: Dot[] = []
      // Optimize density for performance while maintaining quality
      const gridSpacing = 10 // Balanced spacing for performance and quality

      // Create grid of dots
      for (let x = 0; x < canvas.width; x += gridSpacing) {
        for (let y = 0; y < canvas.height; y += gridSpacing) {
          const size = 1.0 + Math.random() * 0.5 // Base size
          const opacity = 0.7 + Math.random() * 0.3 // Base opacity

          // Store original grid position
          dots.push({
            x: 0, // Will be set by updateDotPositions
            y: 0, // Will be set by updateDotPositions
            baseX: 0, // Will be set by updateDotPositions
            baseY: 0, // Will be set by updateDotPositions
            originalX: x, // Keep track of original grid position
            originalY: y, // Keep track of original grid position
            size: size,
            opacity: opacity,
            originalSize: size, // Store original size
            baseSize: size, // Store base size for animations
            gradientPosition: (y / canvas.height) * 0.7 + (x / canvas.width) * 0.3, // Gradient position based on location
          })
        }
      }

      return dots
    }

    // Get gradient color for a dot based on its position
    function getGradientColor(dot: Dot, timestamp: number): string {
      // Update gradient time
      gradientTimeRef.current += 0.0001

      // Base position in gradient (0-1)
      const basePosition = dot.gradientPosition || 0.5

      // Add time-based variation for subtle movement
      const timeVariation = Math.sin(timestamp * 0.0002 + basePosition * Math.PI * 2) * 0.1

      // Calculate final position with variation
      const position = (basePosition + timeVariation) % 1

      // Colorful gradient - vibrant blue-purple
      const r = Math.round(220 - position * 140) // 220 to 80
      const g = Math.round(220 - position * 180) // 220 to 40
      const b = Math.round(255 - position * 55) // 255 to 200
      const a = dot.displayOpacity || dot.opacity

      return `rgba(${r}, ${g}, ${b}, ${a})`
    }

    // Enhanced glow rendering with improved performance and gradient
    function drawGlowingDots(dots: Dot[], opacity = 1.0, timestamp: number) {
      // Apply global opacity for dots
      ctx.globalAlpha = opacity

      // First pass: Draw subtle glow
      dots.forEach((dot) => {
        // Skip dots with very low opacity
        if (dot.displayOpacity && dot.displayOpacity < 0.05) return

        const glowSize = (dot.displaySize || dot.size) * 2.5 // Larger glow for better visibility
        const glowOpacity = (dot.displayOpacity || dot.opacity) * 0.4 // Stronger glow

        // Get gradient color for this dot
        const dotColor = getGradientColor(dot, timestamp)

        // Extract RGB for glow
        const rgbMatch = dotColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        let glowColor

        if (rgbMatch) {
          const [_, r, g, b] = rgbMatch
          glowColor = `rgba(${r}, ${g}, ${b}, ${glowOpacity})`
        } else {
          glowColor = `rgba(255, 255, 255, ${glowOpacity})`
        }

        // Create radial gradient for glow
        const glow = ctx.createRadialGradient(
          dot.displayX || dot.x,
          dot.displayY || dot.y,
          0,
          dot.displayX || dot.x,
          dot.displayY || dot.y,
          glowSize,
        )
        glow.addColorStop(0, glowColor)
        glow.addColorStop(1, "rgba(0, 0, 0, 0)")

        // Draw glow
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(dot.displayX || dot.x, dot.displayY || dot.y, glowSize, 0, Math.PI * 2)
        ctx.fill()
      })

      // Second pass: Draw main dots
      dots.forEach((dot) => {
        // Skip dots with very low opacity
        if (dot.displayOpacity && dot.displayOpacity < 0.05) return

        ctx.beginPath()
        ctx.arc(dot.displayX || dot.x, dot.displayY || dot.y, dot.displaySize || dot.size, 0, Math.PI * 2)

        // Use gradient color for dots
        const fillColor = getGradientColor(dot, timestamp)
        ctx.fillStyle = fillColor
        ctx.fill()
      })

      // Reset global alpha
      ctx.globalAlpha = 1.0
    }

    // Create dot pattern
    const dots = createDistortedDotPattern()
    dotsRef.current = dots

    // Setup dynamic distortion
    const dynamicDistortion = setupDynamicDistortion()

    // Setup animations
    const animationHandler = setupDotAnimations(dots)

    // ANIMATION LOOP
    let lastTime = 0

    function render(timestamp: number) {
      // Calculate delta time with a cap to prevent large jumps
      const deltaTime = lastTime === 0 ? 0 : Math.min(timestamp - lastTime, 100)
      lastTime = timestamp

      // Track FPS for performance monitoring
      if (timestamp - lastFpsUpdateRef.current > 1000) {
        const fps = fpsRef.current.reduce((sum, value) => sum + value, 0) / fpsRef.current.length
        console.log(`FPS: ${Math.round(fps)}`)
        fpsRef.current = []
        lastFpsUpdateRef.current = timestamp
      } else {
        fpsRef.current.push(1000 / deltaTime)
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#433D81")
      gradient.addColorStop(1, "#000000")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update dynamic distortion coefficients
      const { k1, k2, k3 } = dynamicDistortion.updateDistortion(deltaTime)

      // Update dot positions with current distortion values
      updateDotPositions(
        dots,
        k1,
        k2,
        k3,
        canvas.width / 2,
        canvas.height / 2,
        dynamicDistortion.applyDynamicDistortion,
      )

      // Update dot animations (size, glow)
      animationHandler.updateAnimations(timestamp)

      // Draw the dots
      drawGlowingDots(dots, 1.0, timestamp)

      // Continue animation loop
      animationRef.current = requestAnimationFrame(render)
    }

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Recreate dot pattern on resize
      const newDots = createDistortedDotPattern()
      dotsRef.current = newDots

      // Setup animations for new dots
      const newAnimationHandler = setupDotAnimations(newDots)
      animationHandler.updateAnimations = newAnimationHandler.updateAnimations

      // Reset lastTime to avoid huge delta on resize
      lastTime = 0
    }

    window.addEventListener("resize", handleResize)

    // Start animation
    animationRef.current = requestAnimationFrame(render)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-screen" />
}
