import cv2
import numpy as np
import mediapipe as mp

# Standard Hand Connections from MediaPipe
HAND_CONNECTIONS = mp.solutions.hands.HAND_CONNECTIONS

# Colors (BGR)
COLOR_LEFT_HAND = (0, 255, 0)      # Green
COLOR_RIGHT_HAND = (0, 100, 255)   # Orange-Red
COLOR_POINT = (255, 255, 255)      # White

def draw_hand(image: np.ndarray, keypoints: np.ndarray, color: tuple, width: int, height: int):
    """
    Draws a single hand's keypoints on the image.
    keypoints shape: (21, 2) where values are normalized [0.0, 1.0].
    """
    if keypoints is None or len(keypoints) == 0:
        return

    # Convert normalized coordinates to pixel coordinates
    pixel_pts = []
    for kp in keypoints:
        x, y = kp[0], kp[1]
        # Treat [0.0, 0.0] as missing keypoint (standard behavior for missing points in this pipeline)
        if x == 0.0 and y == 0.0:
            pixel_pts.append(None)
        else:
            px = int(x * width)
            py = int(y * height)
            pixel_pts.append((px, py))

    # Draw connections
    for connection in HAND_CONNECTIONS:
        start_idx = connection[0]
        end_idx = connection[1]
        
        if start_idx < len(pixel_pts) and end_idx < len(pixel_pts):
            pt1 = pixel_pts[start_idx]
            pt2 = pixel_pts[end_idx]
            if pt1 is not None and pt2 is not None:
                cv2.line(image, pt1, pt2, color, thickness=2, lineType=cv2.LINE_AA)

    # Draw points
    for pt in pixel_pts:
        if pt is not None:
            cv2.circle(image, pt, radius=3, color=COLOR_POINT, thickness=-1, lineType=cv2.LINE_AA)

def draw_skeleton(image: np.ndarray, frame_keypoints: np.ndarray, normalized: bool = False):
    """
    Draws the full skeleton (Left Hand + Right Hand) on the image.
    frame_keypoints shape: (42, 2) where values are normalized [0.0, 1.0].
    [0:21] is Left Hand, [21:42] is Right Hand.
    """
    h, w, _ = image.shape

    if normalized:
        frame_keypoints = np.clip(frame_keypoints, 0.0, 1.0)
    
    # Left Hand (0 - 21)
    left_hand_kps = frame_keypoints[0:21]
    draw_hand(image, left_hand_kps, COLOR_LEFT_HAND, w, h)
    
    # Right Hand (21 - 42)
    right_hand_kps = frame_keypoints[21:42]
    draw_hand(image, right_hand_kps, COLOR_RIGHT_HAND, w, h)
