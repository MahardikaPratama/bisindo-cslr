"""
Settings Configurations

This module contains application-wide settings such as MediaPipe parameters,
keypoint constants, and output switches.
"""

# ==========================================================
# 1. MEDIAPIPE CONFIGURATION
# ==========================================================

MEDIAPIPE_CONFIG = {
    "static_image_mode": False,        # False for video tracking mode
    "max_num_hands": 2,                # Detect left and right hands only
    "model_complexity": 2,             # 0=light, 1=balanced, 2=heavy/accurate
    "smooth_landmarks": True,          # Apply temporal smoothing
    "min_detection_confidence": 0.5,   # Minimum confidence for detection
    "min_tracking_confidence": 0.5,    # Minimum confidence for tracking
}


# ==========================================================
# 2. KEYPOINT LAYOUT (Hands Only)
# ==========================================================
# Total = 21 (LH) + 21 (RH) = 42

TOTAL_KEYPOINTS  = 42
LEFT_HAND_RANGE  = (0,  21)
RIGHT_HAND_RANGE = (21, 42)
MOUTH_RANGE      = (42, 42)
POSE_RANGE       = (42, 42)


# ==========================================================
# 3. DATA FORMAT CONFIGURATION
# ==========================================================

USE_3D_COORDINATES = False  # False -> store (x, y, confidence); True -> store (x, y, z)


# ==========================================================
# 4. OUTPUT CONFIGURATION
# ==========================================
SAVE_JSON = True      # Save skeleton data as .json

# ==========================================================
# 3. PREVIEW / VISUALIZATION CONFIGURATION
# ==========================================================

PREVIEW_FPS = 30
PREVIEW_RESOLUTION = (1920, 1080)

DRAW_CONNECTIONS = True   # Draw skeleton edges
DRAW_JOINTS      = True   # Draw joint circles

JOINT_RADIUS    = 4       # Pixel radius
LINE_THICKNESS  = 2       # Garis lebih tebal agar skeleton mudah terlihat

# Color per region — BGR format
COLOR_LEFT_HAND  = (0,   255,  0)    # GL — green
COLOR_RIGHT_HAND = (0,   100, 255)   # GR — orange-red
COLOR_MOUTH      = (0,   220, 220)   # GM — yellow
COLOR_POSE       = (0,   0,   200)   # GP — red