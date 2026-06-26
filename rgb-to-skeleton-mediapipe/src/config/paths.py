import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DATA_DIR = os.path.join(PROJECT_ROOT, "data")
RAW_VIDEO_DIR = os.path.join(DATA_DIR, "raw")
JSON_DIR = os.path.join(DATA_DIR, "json")
VIDEO_OUT_SKELETON_DIR = os.path.join(DATA_DIR, "video_skeleton")
VIDEO_OUT_OVERLAY_DIR  = os.path.join(DATA_DIR, "video_overlay")
