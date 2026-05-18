"""
Path Configurations

This module defines all the absolute paths used across the project,
ensuring consistent directory structuring and file output locations.
"""

import os

# ==========================================================
# 1. PROJECT ROOT AND DIRECTORY STRUCTURE
# ==========================================================

# Absolute path to the project root directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Main data directories
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
RAW_VIDEO_DIR = os.path.join(DATA_DIR, "raw")          # Input RGB videos
JSON_DIR = os.path.join(DATA_DIR, "json")              # Exported skeleton JSON files

# Preview and visualization directories
PREVIEW_DIR = os.path.join(DATA_DIR, "preview")
PREVIEW_RGB_DIR = os.path.join(PREVIEW_DIR, "rgb")
PREVIEW_SKELETON_DIR = os.path.join(PREVIEW_DIR, "skeleton_only")
PREVIEW_OVERLAY_DIR = os.path.join(PREVIEW_DIR, "overlay_rgb_skeleton")