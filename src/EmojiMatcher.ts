/**
 * EmojiMatcher - Matches facial expressions to emojis
 * 
 * Analyzes facial landmarks to detect expressions and returns matching emoji
 */

import { Landmark } from './FaceTracker.js';

export enum Expression {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  VERY_HAPPY = 'very_happy',
  SAD = 'sad',
  SURPRISED = 'surprised',
  ANGRY = 'angry',
  WINK = 'wink',
  KISS = 'kiss',
  TONGUE_OUT = 'tongue_out',
  THINKING = 'thinking',
  SLEEPY = 'sleepy',
  CONFUSED = 'confused'
}

export interface ExpressionResult {
  expression: Expression;
  emoji: string;
  confidence: number;
}

export class EmojiMatcher {
  // Emoji mappings
  private readonly emojiMap: Record<Expression, string> = {
    [Expression.NEUTRAL]: '😐',
    [Expression.HAPPY]: '🙂',
    [Expression.VERY_HAPPY]: '😄',
    [Expression.SAD]: '😢',
    [Expression.SURPRISED]: '😮',
    [Expression.ANGRY]: '😠',
    [Expression.WINK]: '😉',
    [Expression.KISS]: '😘',
    [Expression.TONGUE_OUT]: '😛',
    [Expression.THINKING]: '🤔',
    [Expression.SLEEPY]: '😴',
    [Expression.CONFUSED]: '😕'
  };

  private lastExpression: Expression = Expression.NEUTRAL;
  private expressionStability: number = 0;

  /**
   * Analyze facial landmarks and return matching emoji
   * @param landmarks - Array of facial landmarks
   * @returns ExpressionResult - The detected expression and emoji
   */
  analyzeExpression(landmarks: Landmark[]): ExpressionResult {
    if (landmarks.length < 468) {
      return {
        expression: Expression.NEUTRAL,
        emoji: this.emojiMap[Expression.NEUTRAL],
        confidence: 0
      };
    }

    // Calculate various facial metrics
    const mouthOpenness = this.calculateMouthOpenness(landmarks);
    const smileLevel = this.calculateSmileLevel(landmarks);
    const eyebrowRaise = this.calculateEyebrowRaise(landmarks);
    const leftEyeOpenness = this.calculateEyeOpenness(landmarks, 'left');
    const rightEyeOpenness = this.calculateEyeOpenness(landmarks, 'right');
    const mouthWidth = this.calculateMouthWidth(landmarks);
    const lipsPucker = this.calculateLipsPucker(landmarks);
    const headTilt = this.calculateHeadTilt(landmarks);

    let detectedExpression: Expression = Expression.NEUTRAL;
    let confidence = 0.5;

    // Detect wink (one eye significantly more closed than the other)
    const eyeDifference = Math.abs(leftEyeOpenness - rightEyeOpenness);
    if (eyeDifference > 0.012 && (leftEyeOpenness < 0.015 || rightEyeOpenness < 0.015)) {
      detectedExpression = Expression.WINK;
      confidence = 0.9;
    }
    // Detect kiss (lips puckered)
    else if (lipsPucker > 0.015 && mouthWidth < 0.12) {
      detectedExpression = Expression.KISS;
      confidence = 0.85;
    }
    // Detect surprised (mouth open + eyebrows raised)
    else if (mouthOpenness > 0.045 && eyebrowRaise > 0.035) {
      detectedExpression = Expression.SURPRISED;
      confidence = 0.9;
    }
    // Detect tongue out (very wide mouth with specific shape)
    else if (mouthOpenness > 0.05 && mouthWidth > 0.14 && smileLevel > 0.01) {
      detectedExpression = Expression.TONGUE_OUT;
      confidence = 0.8;
    }
    // Detect very happy (big smile + wide mouth)
    else if (smileLevel > 0.045 && mouthWidth > 0.15) {
      detectedExpression = Expression.VERY_HAPPY;
      confidence = 0.9;
    }
    // Detect happy (smile)
    else if (smileLevel > 0.025) {
      detectedExpression = Expression.HAPPY;
      confidence = 0.85;
    }
    // Detect sad (frown)
    else if (smileLevel < -0.015) {
      detectedExpression = Expression.SAD;
      confidence = 0.8;
    }
    // Detect thinking (head tilt + slight eyebrow raise)
    else if (Math.abs(headTilt) > 0.03 && eyebrowRaise > 0.025 && eyebrowRaise < 0.04) {
      detectedExpression = Expression.THINKING;
      confidence = 0.75;
    }
    // Detect sleepy (eyes partially closed)
    else if (leftEyeOpenness < 0.018 && rightEyeOpenness < 0.018 && Math.abs(eyeDifference) < 0.005) {
      detectedExpression = Expression.SLEEPY;
      confidence = 0.8;
    }
    // Detect confused (eyebrows asymmetric or slightly raised with neutral mouth)
    else if (eyebrowRaise > 0.02 && eyebrowRaise < 0.035 && Math.abs(smileLevel) < 0.015) {
      detectedExpression = Expression.CONFUSED;
      confidence = 0.7;
    }
    // Detect angry (eyebrows down + slight frown)
    else if (eyebrowRaise < 0.025 && smileLevel < 0.005 && mouthWidth < 0.13) {
      detectedExpression = Expression.ANGRY;
      confidence = 0.75;
    }

    // Apply smoothing to prevent flickering
    if (detectedExpression === this.lastExpression) {
      this.expressionStability++;
    } else {
      this.expressionStability = 0;
    }

    // Only change expression if it's stable for at least 2 frames
    if (this.expressionStability >= 2 || detectedExpression !== this.lastExpression) {
      this.lastExpression = detectedExpression;
    }

    return {
      expression: this.lastExpression,
      emoji: this.emojiMap[this.lastExpression],
      confidence: confidence
    };
  }

  /**
   * Calculate mouth openness (vertical distance between lips)
   */
  private calculateMouthOpenness(landmarks: Landmark[]): number {
    // Upper lip center (index 13)
    const upperLip = landmarks[13];
    // Lower lip center (index 14)
    const lowerLip = landmarks[14];
    
    // Also check inner mouth points for better accuracy
    const upperInner = landmarks[12];  // Upper inner lip
    const lowerInner = landmarks[15];  // Lower inner lip

    const outerDistance = Math.abs(lowerLip.y - upperLip.y);
    const innerDistance = Math.abs(lowerInner.y - upperInner.y);
    
    // Average both measurements
    return (outerDistance + innerDistance) / 2;
  }

  /**
   * Calculate smile level (mouth corners vs center)
   */
  private calculateSmileLevel(landmarks: Landmark[]): number {
    // Left mouth corner (index 61)
    const leftCorner = landmarks[61];
    // Right mouth corner (index 291)
    const rightCorner = landmarks[291];
    // Upper lip center (index 0)
    const upperLipCenter = landmarks[0];
    // Lower lip center (index 17)
    const lowerLipCenter = landmarks[17];

    const mouthCenterY = (upperLipCenter.y + lowerLipCenter.y) / 2;
    const avgCornerY = (leftCorner.y + rightCorner.y) / 2;
    
    // Also check the width of the smile
    const mouthWidth = Math.abs(rightCorner.x - leftCorner.x);
    
    // Positive = smile (corners up), negative = frown (corners down)
    const verticalSmile = mouthCenterY - avgCornerY;
    
    // Wider mouth = more smile
    const widthFactor = mouthWidth > 0.15 ? 0.02 : 0;
    
    return verticalSmile + widthFactor;
  }

  /**
   * Calculate eyebrow raise level
   */
  private calculateEyebrowRaise(landmarks: Landmark[]): number {
    // Left eyebrow points (indices 70, 63, 105, 66, 107)
    const leftBrow1 = landmarks[70];
    const leftBrow2 = landmarks[63];
    const leftBrow3 = landmarks[105];
    
    // Right eyebrow points (indices 300, 293, 334, 296, 336)
    const rightBrow1 = landmarks[300];
    const rightBrow2 = landmarks[293];
    const rightBrow3 = landmarks[334];
    
    // Left eye top (index 159)
    const leftEyeTop = landmarks[159];
    // Right eye top (index 386)
    const rightEyeTop = landmarks[386];

    // Average eyebrow positions
    const leftBrowAvg = (leftBrow1.y + leftBrow2.y + leftBrow3.y) / 3;
    const rightBrowAvg = (rightBrow1.y + rightBrow2.y + rightBrow3.y) / 3;
    
    const leftDistance = leftEyeTop.y - leftBrowAvg;
    const rightDistance = rightEyeTop.y - rightBrowAvg;

    // Average distance (larger = eyebrows raised)
    return (leftDistance + rightDistance) / 2;
  }

  /**
   * Calculate eye openness
   */
  private calculateEyeOpenness(landmarks: Landmark[], eye: 'left' | 'right'): number {
    let topIndices: number[], bottomIndices: number[];

    if (eye === 'left') {
      // Left eye top points
      topIndices = [159, 158, 157, 173];
      // Left eye bottom points
      bottomIndices = [145, 144, 143, 153];
    } else {
      // Right eye top points
      topIndices = [386, 385, 384, 398];
      // Right eye bottom points
      bottomIndices = [374, 373, 372, 380];
    }

    // Calculate average vertical distance
    let totalDistance = 0;
    const numPoints = Math.min(topIndices.length, bottomIndices.length);
    
    for (let i = 0; i < numPoints; i++) {
      const top = landmarks[topIndices[i]];
      const bottom = landmarks[bottomIndices[i]];
      totalDistance += Math.abs(bottom.y - top.y);
    }

    return totalDistance / numPoints;
  }

  /**
   * Calculate mouth width
   */
  private calculateMouthWidth(landmarks: Landmark[]): number {
    const leftCorner = landmarks[61];
    const rightCorner = landmarks[291];
    return Math.abs(rightCorner.x - leftCorner.x);
  }

  /**
   * Calculate lips pucker (for kiss detection)
   */
  private calculateLipsPucker(landmarks: Landmark[]): number {
    // Measure how much the lips are pushed forward
    const upperLip = landmarks[0];
    const lowerLip = landmarks[17];
    const leftCorner = landmarks[61];
    const rightCorner = landmarks[291];
    
    const lipCenterX = (upperLip.x + lowerLip.x) / 2;
    const cornerCenterX = (leftCorner.x + rightCorner.x) / 2;
    
    // Pucker is indicated by lips being more forward than corners
    return Math.abs(lipCenterX - cornerCenterX);
  }

  /**
   * Calculate head tilt
   */
  private calculateHeadTilt(landmarks: Landmark[]): number {
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    
    // Calculate angle of line between eyes
    const deltaY = rightEye.y - leftEye.y;
    const deltaX = rightEye.x - leftEye.x;
    
    // Return the vertical difference (positive = tilted right, negative = tilted left)
    return deltaY / (deltaX + 0.0001); // Avoid division by zero
  }
}
