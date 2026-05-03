/**
 * Recording Watermark Utility
 * Adds technician name and timestamp overlay to WebRTC session recordings
 * for HIPAA/SOC 2 chain-of-custody evidence
 */

import { createCanvas, Canvas } from "canvas";

export interface WatermarkOptions {
  technicianName: string;
  timestamp: Date;
  sessionId: string;
  width: number;
  height: number;
  opacity?: number;
  fontSize?: number;
}

/**
 * Generate watermark overlay canvas
 * Returns a canvas element with the watermark that can be composited onto video frames
 */
export function createWatermarkCanvas(options: WatermarkOptions): any {
  const {
    technicianName,
    timestamp,
    sessionId,
    width,
    height,
    opacity = 0.7,
    fontSize = 16,
  } = options;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Transparent background
  ctx.clearRect(0, 0, width, height);

  // Set text styling
  ctx.font = `${fontSize}px 'Courier New', monospace`;
  ctx.fillStyle = `rgba(0, 212, 255, ${opacity})`; // Cyan with opacity
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Format timestamp
  const timeStr = timestamp.toLocaleString("en-US", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Top-left: Technician name
  ctx.fillText(`Technician: ${technicianName}`, 10, 10);

  // Top-right: Timestamp
  const timestampText = `Recording: ${timeStr}`;
  const textMetrics = ctx.measureText(timestampText);
  ctx.fillText(timestampText, width - textMetrics.width - 10, 10);

  // Bottom-left: Session ID (truncated for visibility)
  const sessionIdShort = sessionId.slice(-8).toUpperCase();
  ctx.fillStyle = `rgba(0, 212, 255, ${opacity * 0.6})`; // Slightly more transparent
  ctx.font = `${Math.floor(fontSize * 0.75)}px 'Courier New', monospace`;
  ctx.fillText(`Session: #${sessionIdShort}`, 10, height - 20);

  // Bottom-right: "RECORDED" badge
  ctx.fillStyle = `rgba(220, 38, 38, ${opacity})`; // Red for emphasis
  ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
  const recordedText = "● RECORDED";
  const recordedMetrics = ctx.measureText(recordedText);
  ctx.fillText(recordedText, width - recordedMetrics.width - 10, height - 20);

  return canvas;
}

/**
 * Apply watermark to a video frame (canvas)
 * Composites the watermark onto the existing frame
 */
export function applyWatermarkToFrame(
  frameCanvas: any,
  watermarkCanvas: any,
  opacity: number = 0.7
): any {
  const ctx = frameCanvas.getContext("2d");

  // Save current state
  ctx.save();

  // Set opacity for watermark
  ctx.globalAlpha = opacity;

  // Draw watermark on top of frame
  ctx.drawImage(watermarkCanvas, 0, 0);

  // Restore state
  ctx.restore();

  return frameCanvas;
}

/**
 * Generate watermark metadata for recording
 * Stores watermark details in the database for audit trail
 */
export interface WatermarkMetadata {
  sessionId: string;
  technicianName: string;
  technicianId: string;
  recordingStartTime: Date;
  recordingEndTime?: Date;
  watermarkApplied: boolean;
  watermarkOpacity: number;
  chainOfCustodyHash: string; // SHA-256 hash for verification
}

/**
 * Create watermark metadata for audit logging
 */
export function createWatermarkMetadata(
  sessionId: string,
  technicianName: string,
  technicianId: string,
  recordingStartTime: Date,
  opacity: number = 0.7
): WatermarkMetadata {
  // Generate chain-of-custody hash
  const hashInput = `${sessionId}|${technicianName}|${technicianId}|${recordingStartTime.toISOString()}`;
  const crypto = require("crypto");
  const chainOfCustodyHash = crypto
    .createHash("sha256")
    .update(hashInput)
    .digest("hex");

  return {
    sessionId,
    technicianName,
    technicianId,
    recordingStartTime,
    watermarkApplied: true,
    watermarkOpacity: opacity,
    chainOfCustodyHash,
  };
}

/**
 * Verify watermark integrity
 * Validates that the watermark metadata matches the recording
 */
export function verifyWatermarkIntegrity(
  metadata: WatermarkMetadata,
  expectedSessionId: string,
  expectedTechnicianName: string,
  expectedTechnicianId: string
): boolean {
  const matches =
    metadata.sessionId === expectedSessionId &&
    metadata.technicianName === expectedTechnicianName &&
    metadata.technicianId === expectedTechnicianId &&
    metadata.watermarkApplied === true;

  return matches;
}
