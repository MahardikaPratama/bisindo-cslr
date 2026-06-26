MEDIAPIPE_CONFIG = {
    "static_image_mode": False,
    "model_complexity": 0,
    "smooth_landmarks": True,
    "min_detection_confidence": 0.5,
    "min_tracking_confidence": 0.5,
}

TOTAL_KEYPOINTS  = 42
LEFT_HAND_RANGE  = (0,  21)
RIGHT_HAND_RANGE = (21, 42)

# ==========================================================
# 3. DATA FORMAT & OUTPUT CONFIGURATION
# ==========================================================
USE_3D_COORDINATES = False  # If False, only (x, y) are stored
SAVE_JSON = True            # Save results to JSON files
SAVE_VIDEO_SKELETON = True  # Save skeleton-only video
SAVE_VIDEO_OVERLAY = True   # Save raw video with skeleton overlay
