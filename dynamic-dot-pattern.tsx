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
  targetSize?: number
  dissolveDelay?: number
  gradientPosition?: number // Position in the gradient (0-1)
  targetSize2?: number
  targetSize3?: number
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
  // Ultra smooth transition - combines multiple easing functions
  ultraSmooth: (t: number): number => {
    // Apply multiple layers of easing for ultra-smooth transitions
    const t1 = easing.smootherStep(t)
    return easing.easeInOutSine(t1)
  },
}

export default function DynamicDotPattern() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const dotsRef = useRef<Dot[]>([])
  const imageRef = useRef<HTMLImageElement | null>(null)
  const image2Ref = useRef<HTMLImageElement | null>(null)
  const image3Ref = useRef<HTMLImageElement | null>(null)
  const imageDataRef = useRef<ImageData | null>(null)
  const image2DataRef = useRef<ImageData | null>(null)
  const image3DataRef = useRef<ImageData | null>(null)
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const offscreenCanvas2Ref = useRef<HTMLCanvasElement | null>(null)
  const offscreenCanvas3Ref = useRef<HTMLCanvasElement | null>(null)
  const fpsRef = useRef<number[]>([])
  const lastFpsUpdateRef = useRef<number>(0)
  const imageLoadedRef = useRef<boolean>(false)
  const image2LoadedRef = useRef<boolean>(false)
  const image3LoadedRef = useRef<boolean>(false)
  const gradientTimeRef = useRef<number>(0)
  const cycleCountRef = useRef<number>(0)
  const transitionTimeRef = useRef<number>(0)

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

    // Create offscreen canvas for image processing
    const offscreenCanvas = document.createElement("canvas")
    offscreenCanvasRef.current = offscreenCanvas
    const offscreenCtx = offscreenCanvas.getContext("2d", { willReadFrequently: true })
    if (!offscreenCtx) return

    // Create second offscreen canvas for second image
    const offscreenCanvas2 = document.createElement("canvas")
    offscreenCanvas2Ref.current = offscreenCanvas2
    const offscreenCtx2 = offscreenCanvas2.getContext("2d", { willReadFrequently: true })
    if (!offscreenCtx2) return

    // Create third offscreen canvas for third image
    const offscreenCanvas3 = document.createElement("canvas")
    offscreenCanvas3Ref.current = offscreenCanvas3
    const offscreenCtx3 = offscreenCanvas3.getContext("2d", { willReadFrequently: true })
    if (!offscreenCtx3) return

    // Load the first image - Halftone face pattern
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.src =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Halftone%20Editor-B7FAZ81zy4ngkQrKfpO3Vk01IZcryn.png" // New halftone image URL
    imageRef.current = image

    // Load the second image - Abstract Circles
    const image2 = new Image()
    image2.crossOrigin = "anonymous"
    image2.src =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Halftone%20Editor%20%281%29-UDPnx4BZ3b50SYQRcMk6fBIuUjGLJf.png" // New halftone image URL
    image2Ref.current = image2

    // Load the third image - Butterfly/Moth Halftone Pattern
    const image3 = new Image()
    image3.crossOrigin = "anonymous"
    image3.src =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Halftone%20Editor%20%282%29-n8tDz3NOBpWsXQxY5amWLiatDrvSLA.png" // New butterfly/moth halftone pattern URL
    image3Ref.current = image3

    // Add error handling for image loading
    image.onerror = (err) => {
      console.error("Error loading first image:", err)
    }

    image2.onerror = (err) => {
      console.error("Error loading second image:", err)
    }

    // Add error handling for third image loading
    image3.onerror = (err) => {
      console.error("Error loading third image:", err)
    }

    // Process first image when loaded
    image.onload = () => {
      console.log("First image loaded successfully", image.width, image.height)
      imageLoadedRef.current = true

      // Set offscreen canvas dimensions to match image
      offscreenCanvas.width = image.width
      offscreenCanvas.height = image.height

      // Draw image to offscreen canvas
      offscreenCtx.drawImage(image, 0, 0)

      // Get image data for sampling
      imageDataRef.current = offscreenCtx.getImageData(0, 0, image.width, image.height)

      // Precalculate brightness values for all dots if dots are already created
      if (dotsRef.current.length > 0) {
        precalculateBrightness(dotsRef.current, "first")
      }
    }

    // Process second image when loaded
    image2.onload = () => {
      console.log("Second image loaded successfully", image2.width, image2.height)
      image2LoadedRef.current = true

      // Set second offscreen canvas dimensions to match image
      offscreenCanvas2.width = image2.width
      offscreenCanvas2.height = image2.height

      // Draw image to offscreen canvas
      offscreenCtx2.drawImage(image2, 0, 0)

      // Get image data for sampling
      image2DataRef.current = offscreenCtx2.getImageData(0, 0, image2.width, image2.height)

      // Precalculate brightness values for all dots if dots are already created
      if (dotsRef.current.length > 0) {
        precalculateBrightness(dotsRef.current, "second")
      }
    }

    // Process third image when loaded
    image3.onload = () => {
      console.log("Third image loaded successfully", image3.width, image3.height)
      image3LoadedRef.current = true

      // Set third offscreen canvas dimensions to match image
      offscreenCanvas3.width = image3.width
      offscreenCanvas3.height = image3.height

      // Draw image to offscreen canvas
      offscreenCtx3.drawImage(image3, 0, 0)

      // Get image data for sampling
      image3DataRef.current = offscreenCtx3.getImageData(0, 0, image3.width, image3.height)

      // Precalculate brightness values for all dots if dots are already created
      if (dotsRef.current.length > 0) {
        precalculateBrightness(dotsRef.current, "third")
      }
    }

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

    // Sample pixel brightness from image at a specific position
    function sampleImageBrightness(x: number, y: number, imageType: "first" | "second" | "third"): number {
      const currentImageRef = imageType === "first" ? imageRef : imageType === "second" ? image2Ref : image3Ref
      const currentImageDataRef =
        imageType === "first" ? imageDataRef : imageType === "second" ? image2DataRef : image3DataRef
      const currentOffscreenCanvasRef =
        imageType === "first" ? offscreenCanvasRef : imageType === "second" ? offscreenCanvas2Ref : offscreenCanvas3Ref
      const currentImageLoadedRef =
        imageType === "first" ? imageLoadedRef : imageType === "second" ? image2LoadedRef : image3LoadedRef

      if (
        !currentImageDataRef.current ||
        !currentOffscreenCanvasRef.current ||
        !currentImageRef.current ||
        !currentImageLoadedRef.current
      ) {
        return 0.5 // Default mid brightness
      }

      const imageData = currentImageDataRef.current
      const offscreenCanvas = currentOffscreenCanvasRef.current

      // Calculate image dimensions and position on canvas
      const imgAspect = currentImageRef.current.width / currentImageRef.current.height
      const canvasAspect = canvas.width / canvas.height

      let drawWidth, drawHeight, drawX, drawY

      if (imgAspect > canvasAspect) {
        // Image is wider than canvas (relative to height)
        drawHeight = canvas.height
        drawWidth = drawHeight * imgAspect
        drawX = (canvas.width - drawWidth) / 2
        drawY = 0
      } else {
        // Image is taller than canvas (relative to width)
        drawWidth = canvas.width
        drawHeight = drawWidth / imgAspect
        drawX = 0
        drawY = (canvas.height - drawHeight) / 2
      }

      // Convert canvas coordinates to image coordinates
      const normalizedX = (x - drawX) / drawWidth
      const normalizedY = (y - drawY) / drawHeight

      // Check if point is within image bounds
      if (normalizedX < 0 || normalizedX > 1 || normalizedY < 0 || normalizedY > 1) {
        return 0.5 // Default mid brightness for points outside image
      }

      // Map to image pixel coordinates
      const imgX = Math.floor(normalizedX * offscreenCanvas.width)
      const imgY = Math.floor(normalizedY * offscreenCanvas.height)

      // Ensure coordinates are within bounds
      const safeX = Math.max(0, Math.min(imgX, offscreenCanvas.width - 1))
      const safeY = Math.max(0, Math.min(imgY, offscreenCanvas.height - 1))

      // Get pixel data (RGBA)
      const index = (safeY * offscreenCanvas.width + safeX) * 4
      const r = imageData.data[index]
      const g = imageData.data[index + 1]
      const b = imageData.data[index + 2]

      // Calculate brightness (0-1)
      return (r + g + b) / (3 * 255)
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
      // Optimize density for performance while maintaining image quality
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
            targetSize: size, // Will be updated based on image brightness
            dissolveDelay: Math.random() * 0.5, // Random delay for staggered effect
            gradientPosition: (y / canvas.height) * 0.7 + (x / canvas.width) * 0.3, // Gradient position based on location
          })
        }
      }

      return dots
    }

    // Precalculate brightness values for all dots
    function precalculateBrightness(dots: Dot[], imageType: "first" | "second" | "third") {
      const currentImageLoadedRef =
        imageType === "first" ? imageLoadedRef : imageType === "second" ? image2LoadedRef : image3LoadedRef

      if (!currentImageLoadedRef.current) {
        console.log(`${imageType} image not loaded yet, skipping precalculation`)
        return
      }

      // Store target sizes in a property specific to the image type
      const targetSizeProperty =
        imageType === "first" ? "targetSize" : imageType === "second" ? "targetSize2" : "targetSize3"

      dots.forEach((dot) => {
        // Sample brightness at dot position
        const brightness = sampleImageBrightness(dot.x, dot.y, imageType)

        // Calculate target size based on brightness
        // Darker areas get larger dots for better visibility
        const targetSize =
          brightness < 0.3
            ? 2.0 // Larger dots in dark areas
            : brightness < 0.7
              ? 1.5 // Medium dots in mid-tone areas
              : 1.0 // Smaller dots in light areas

        // Store the target size for this specific image
        dot[targetSizeProperty as keyof Dot] = targetSize
      })
    }

    // Update dots for ultra-smooth dissolve effect
    function updateDissolveEffect(
      dots: Dot[],
      progress: number,
      phase: "toImage" | "toBarrel",
      imageType: "first" | "second" | "third",
      timestamp: number,
    ) {
      const currentImageLoadedRef =
        imageType === "first" ? imageLoadedRef : imageType === "second" ? image2LoadedRef : image3LoadedRef
      const targetSizeProperty =
        imageType === "first"
          ? "targetSize"
          : imageType === "second"
            ? "targetSize2"
            : imageType === "third"
              ? "targetSize3"
              : undefined

      if (!currentImageLoadedRef.current && phase === "toImage") return

      const canvas = canvasRef.current
      if (!canvas) return

      // Update transition time for animated patterns
      transitionTimeRef.current += 0.001

      dots.forEach((dot) => {
        // Create a more complex pattern for smoother transitions
        // Use multiple waves and noise patterns for a more organic feel
        const xPosition = dot.originalX / canvas.width
        const yPosition = dot.originalY / canvas.height

        // Create a flowing wave pattern that moves during the transition
        const waveSpeed = 0.2
        const wavePhase = transitionTimeRef.current * waveSpeed

        // Combine multiple wave patterns for a more organic feel
        const wave1 = Math.sin((xPosition * 3 + yPosition * 2) * Math.PI * 2 + wavePhase) * 0.5 + 0.5
        const wave2 = Math.sin((xPosition * 2 - yPosition * 3) * Math.PI * 2 - wavePhase * 0.7) * 0.5 + 0.5
        const wave3 = Math.sin((xPosition + yPosition * 4) * Math.PI * 2 + wavePhase * 1.3) * 0.5 + 0.5

        // Combine waves with different weights
        const patternValue = wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2

        // Apply distance from center for a radial component
        const centerX = 0.5
        const centerY = 0.5
        const distFromCenter = Math.sqrt(Math.pow(xPosition - centerX, 2) + Math.pow(yPosition - centerY, 2)) * 2

        // Combine pattern with distance from center
        const finalPattern = patternValue * 0.7 + (1 - distFromCenter) * 0.3

        // Calculate threshold based on progress with ultra-smooth easing
        const threshold = phase === "toImage" ? easing.ultraSmooth(progress) : 1 - easing.ultraSmooth(progress)

        // Very wide transition range for ultra-smooth effect
        const transitionRange = 0.6

        // Calculate distance from threshold with wrapping for smooth transitions
        let distanceFromThreshold = Math.abs(finalPattern - threshold)
        // Handle wrapping for continuous pattern
        distanceFromThreshold = Math.min(distanceFromThreshold, 1 - distanceFromThreshold)

        // Calculate transition factor with ultra-smooth falloff
        let transitionFactor = 0

        if (distanceFromThreshold < transitionRange) {
          // Smooth transition within the range
          transitionFactor = 1 - distanceFromThreshold / transitionRange
          // Apply multiple layers of easing for ultra-smooth transition
          transitionFactor = easing.ultraSmooth(transitionFactor)
        } else if (
          (phase === "toImage" && finalPattern < threshold) ||
          (phase === "toBarrel" && finalPattern > threshold)
        ) {
          transitionFactor = 1
        }

        if (phase === "toImage") {
          // Transition size based on image brightness with ultra-smooth interpolation
          const targetSize = dot[targetSizeProperty as keyof Dot] as number | undefined
          if (targetSize) {
            dot.baseSize = dot.originalSize! * (1 - transitionFactor) + targetSize * transitionFactor
          }

          // Ultra-smooth opacity transition
          dot.opacity = 0.7 * (1 - transitionFactor * 0.5) + transitionFactor * 0.2
        } else {
          // Transition size back to original with ultra-smooth interpolation
          const targetSize = dot[targetSizeProperty as keyof Dot] as number | undefined
          if (targetSize) {
            dot.baseSize = targetSize * (1 - transitionFactor) + dot.originalSize! * transitionFactor
          }

          // Ultra-smooth opacity transition
          dot.opacity = 0.7 * transitionFactor + 0.2 * (1 - transitionFactor)
        }
      })
    }

    // Draw the image with proper sizing
    function drawImage(opacity = 1.0, imageType: "first" | "second" | "third") {
      const currentImageRef = imageType === "first" ? imageRef : imageType === "second" ? image2Ref : image3Ref
      const currentImageLoadedRef =
        imageType === "first" ? imageLoadedRef : imageType === "second" ? image2LoadedRef : image3LoadedRef

      if (!currentImageLoadedRef.current || !currentImageRef.current) {
        console.log(`${imageType} image not loaded yet, cannot draw`)
        return
      }

      // Calculate image dimensions and position on canvas
      const imgAspect = currentImageRef.current.width / currentImageRef.current.height
      const canvasAspect = canvas.width / canvas.height

      let drawWidth, drawHeight, drawX, drawY

      if (imgAspect > canvasAspect) {
        // Image is wider than canvas (relative to height)
        drawHeight = canvas.height
        drawWidth = drawHeight * imgAspect
        drawX = (canvas.width - drawWidth) / 2
        drawY = 0
      } else {
        // Image is taller than canvas (relative to width)
        drawWidth = canvas.width
        drawHeight = drawWidth / imgAspect
        drawX = 0
        drawY = (canvas.height - drawHeight) / 2
      }

      // Save context state
      ctx.save()

      // Set opacity
      ctx.globalAlpha = opacity

      // Draw image
      try {
        ctx.drawImage(currentImageRef.current, drawX, drawY, drawWidth, drawHeight)
        console.log(`${imageType} image drawn successfully at`, drawX, drawY, drawWidth, drawHeight)
      } catch (error) {
        console.error(`Error drawing ${imageType} image:`, error)
      }

      // Restore context state
      ctx.restore()
    }

    // Get gradient color for a dot based on its position and animation phase
    function getGradientColor(dot: Dot, animationPhase: string, phaseProgress: number, timestamp: number): string {
      // Update gradient time
      gradientTimeRef.current += 0.0001

      // Base position in gradient (0-1)
      const basePosition = dot.gradientPosition || 0.5

      // Add time-based variation for subtle movement
      const timeVariation = Math.sin(timestamp * 0.0002 + basePosition * Math.PI * 2) * 0.1

      // Calculate final position with variation
      const position = (basePosition + timeVariation) % 1

      // Define gradient colors based on animation phase
      let r, g, b, a

      if (animationPhase === "distorting") {
        // Colorful gradient for distortion phase - vibrant blue-purple
        r = Math.round(220 - position * 140) // 220 to 80
        g = Math.round(220 - position * 180) // 220 to 40
        b = Math.round(255 - position * 55) // 255 to 200
        a = dot.displayOpacity || dot.opacity
      } else if (animationPhase === "toImage") {
        // Transition from colorful to black during dissolve
        const colorR = Math.round(220 - position * 140)
        const colorG = Math.round(220 - position * 180)
        const colorB = Math.round(255 - position * 55)

        const blackR = 0
        const blackG = 0
        const blackB = 0

        // Interpolate between colorful and black based on progress
        r = Math.round(colorR * (1 - phaseProgress) + blackR * phaseProgress)
        g = Math.round(colorG * (1 - phaseProgress) + blackG * phaseProgress)
        b = Math.round(colorB * (1 - phaseProgress) + blackB * phaseProgress)
        a = dot.displayOpacity || dot.opacity
      } else if (animationPhase === "showingImage") {
        // Pure black dots when showing image
        r = 0
        g = 0
        b = 0
        a = dot.displayOpacity || dot.opacity
      } else if (animationPhase === "toBarrel") {
        // Transition from black to colorful
        const blackR = 0
        const blackG = 0
        const blackB = 0

        const colorR = Math.round(220 - position * 140)
        const colorG = Math.round(220 - position * 180)
        const colorB = Math.round(255 - position * 55)

        // Interpolate between black and colorful based on progress
        r = Math.round(blackR * (1 - phaseProgress) + colorR * phaseProgress)
        g = Math.round(blackG * (1 - phaseProgress) + colorG * phaseProgress)
        b = Math.round(blackB * (1 - phaseProgress) + colorB * phaseProgress)
        a = dot.displayOpacity || dot.opacity
      } else {
        // Default white
        r = 255
        g = 255
        b = 255
        a = dot.displayOpacity || dot.opacity
      }

      return `rgba(${r}, ${g}, ${b}, ${a})`
    }

    // Enhanced glow rendering with improved performance and gradient
    function drawGlowingDots(
      dots: Dot[],
      opacity = 1.0,
      animationPhase: string,
      phaseProgress: number,
      timestamp: number,
    ) {
      // Apply global opacity for dots
      ctx.globalAlpha = opacity

      // First pass: Draw subtle glow
      dots.forEach((dot) => {
        // Skip dots with very low opacity
        if (dot.displayOpacity && dot.displayOpacity < 0.05) return

        const glowSize = (dot.displaySize || dot.size) * 2.5 // Larger glow for better visibility
        const glowOpacity = (dot.displayOpacity || dot.opacity) * 0.4 // Stronger glow

        // Get gradient color for this dot
        const dotColor = getGradientColor(dot, animationPhase, phaseProgress, timestamp)

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
        const fillColor = getGradientColor(dot, animationPhase, phaseProgress, timestamp)
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

    // ANIMATION LOOP WITH SMOOTH DISSOLVE
    let lastTime = 0
    let animationPhase = "distorting" // "distorting", "toImage", "showingImage", "toBarrel"
    let phaseStartTime = 0
    let phaseProgress = 0

    const DISSOLVE_DURATION = 3000 // 3 seconds for transitions
    const SHOW_IMAGE_DURATION = 4000 // 4 seconds to show the image

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
      const { k1, k2, k3, distortionIntensity } = dynamicDistortion.updateDistortion(deltaTime)

      // Animation phase management
      const dissolveThreshold = 0.9

      // Calculate phase progress
      if (animationPhase !== "distorting") {
        const phaseDuration =
          animationPhase === "toImage"
            ? DISSOLVE_DURATION
            : animationPhase === "showingImage"
              ? SHOW_IMAGE_DURATION
              : DISSOLVE_DURATION

        phaseProgress = Math.min(1, (timestamp - phaseStartTime) / phaseDuration)
      }

      // Phase transitions
      if (animationPhase === "distorting" && distortionIntensity > dissolveThreshold) {
        // Transition to dissolving to image phase
        animationPhase = "toImage"
        phaseStartTime = timestamp
        phaseProgress = 0
        // Reset transition time for new animation
        transitionTimeRef.current = 0

        // Make sure we have brightness values calculated
        // Determine which image to use based on cycle count
        const imageType =
          cycleCountRef.current % 3 === 0 ? "first" : cycleCountRef.current % 3 === 1 ? "second" : "third"

        if (imageType === "first" && imageLoadedRef.current) {
          precalculateBrightness(dots, "first")
        } else if (imageType === "second" && image2LoadedRef.current) {
          precalculateBrightness(dots, "second")
        } else if (imageType === "third" && image3LoadedRef.current) {
          precalculateBrightness(dots, "third")
        }
      } else if (animationPhase === "toImage" && phaseProgress >= 1) {
        // Transition to showing image phase
        animationPhase = "showingImage"
        phaseStartTime = timestamp
        phaseProgress = 0
      } else if (animationPhase === "showingImage" && phaseProgress >= 1) {
        // Transition to dissolving back to barrel phase
        animationPhase = "toBarrel"
        phaseStartTime = timestamp
        phaseProgress = 0
        // Reset transition time for new animation
        transitionTimeRef.current = 0
      } else if (animationPhase === "toBarrel" && phaseProgress >= 1) {
        // Transition back to distorting phase
        animationPhase = "distorting"
        // Increment cycle count to alternate between images
        cycleCountRef.current += 1
      }

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

      // Determine which image to use based on cycle count
      const imageType = cycleCountRef.current % 3 === 0 ? "first" : cycleCountRef.current % 3 === 1 ? "second" : "third"

      // Handle different animation phases with smooth dissolve
      if (animationPhase === "distorting") {
        // Just draw the dots
        drawGlowingDots(dots, 1.0, animationPhase, phaseProgress, timestamp)
      } else if (animationPhase === "toImage") {
        // Update dissolve effect
        updateDissolveEffect(dots, phaseProgress, "toImage", imageType, timestamp)

        // Draw image with increasing opacity
        if (
          (imageType === "first" && imageLoadedRef.current) ||
          (imageType === "second" && image2LoadedRef.current) ||
          (imageType === "third" && image3LoadedRef.current)
        ) {
          // Use ultra-smooth easing for image fade-in
          const imageOpacity = easing.ultraSmooth(phaseProgress)
          drawImage(imageOpacity, imageType)
        }

        // Draw dots on top of image
        drawGlowingDots(dots, 1.0, animationPhase, phaseProgress, timestamp)
      } else if (animationPhase === "showingImage") {
        // Show the image with full opacity
        if (
          (imageType === "first" && imageLoadedRef.current) ||
          (imageType === "second" && image2LoadedRef.current) ||
          (imageType === "third" && image3LoadedRef.current)
        ) {
          drawImage(1.0, imageType)
        }

        // Draw dots with reduced opacity on top
        drawGlowingDots(dots, 0.7, animationPhase, phaseProgress, timestamp)
      } else if (animationPhase === "toBarrel") {
        // Update dissolve effect back to original
        updateDissolveEffect(dots, phaseProgress, "toBarrel", imageType, timestamp)

        // Fade out the image
        if (
          (imageType === "first" && imageLoadedRef.current) ||
          (imageType === "second" && image2LoadedRef.current) ||
          (imageType === "third" && image3LoadedRef.current)
        ) {
          const imageOpacity = 1.0 * (1 - easing.ultraSmooth(phaseProgress))
          drawImage(imageOpacity, imageType)
        }

        // Draw dots with increasing opacity
        drawGlowingDots(dots, 1.0, animationPhase, phaseProgress, timestamp)
      }

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

      // Precalculate brightness if images are loaded
      if (imageLoadedRef.current) {
        precalculateBrightness(newDots, "first")
      }
      if (image2LoadedRef.current) {
        precalculateBrightness(newDots, "second")
      }
      if (image3LoadedRef.current) {
        precalculateBrightness(newDots, "third")
      }

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
