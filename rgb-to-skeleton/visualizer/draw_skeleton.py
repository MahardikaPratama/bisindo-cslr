"""
Skeleton Drawing Module

Renders 42-keypoint hand-only skeletons on a canvas or over an RGB frame.
Simple style: small dots + connecting lines, no legend.

Color scheme:
    GL (left hand)  — Green
    GR (right hand) — Orange-red
"""

import cv2
import numpy as np

from config import (
    DRAW_CONNECTIONS,
    DRAW_JOINTS,
    JOINT_RADIUS,
    LINE_THICKNESS,
    LEFT_HAND_RANGE,
    RIGHT_HAND_RANGE,
    COLOR_LEFT_HAND,
    COLOR_RIGHT_HAND,
)


class SkeletonDrawer:
    """
    Renders 42-keypoint skeleton frames.

    Parameters
    ----------
    resolution : tuple(int, int)
        Output canvas resolution as (width, height).
    """

    def __init__(self, resolution=(640, 480)):
        self.width, self.height = resolution

        self.left_hand_range  = LEFT_HAND_RANGE
        self.right_hand_range = RIGHT_HAND_RANGE

        # Hand connections (21 keypoints, local indices)
        self.hand_connections = [
            (0, 1), (1, 2), (2, 3), (3, 4),
            (0, 5), (5, 6), (6, 7), (7, 8),
            (0, 9), (9, 10), (10, 11), (11, 12),
            (0, 13), (13, 14), (14, 15), (15, 16),
            (0, 17), (17, 18), (18, 19), (19, 20),
            (5, 9), (9, 13), (13, 17),
        ]

    # --------------------------------------------------
    # Utilities
    # --------------------------------------------------

    def _is_valid(self, point):
        return abs(float(point[0])) > 1e-6 or abs(float(point[1])) > 1e-6

    def _px(self, point):
        x = int(float(point[0]) * self.width)
        y = int(float(point[1]) * self.height)
        return x, y

    def _draw_joints(self, canvas, points, color):
        for pt in points:
            if self._is_valid(pt):
                # Filled circle improves visibility on light or compressed outputs.
                cv2.circle(canvas, self._px(pt), JOINT_RADIUS, color, -1)

    def _draw_edges(self, canvas, points, connections, color):
        for s, e in connections:
            if s < len(points) and e < len(points):
                if self._is_valid(points[s]) and self._is_valid(points[e]):
                    cv2.line(canvas, self._px(points[s]), self._px(points[e]),
                             color, LINE_THICKNESS)

    def _draw_ring(self, canvas, points, indices, color, closed=True):
        valid = [i for i in indices if i < len(points) and self._is_valid(points[i])]
        n = len(valid)
        if n < 2:
            return
        steps = n if closed else n - 1
        for k in range(steps):
            a, b = valid[k], valid[(k + 1) % n]
            cv2.line(canvas, self._px(points[a]), self._px(points[b]),
                     color, LINE_THICKNESS)

    # --------------------------------------------------
    # Main Render
    # --------------------------------------------------

    def draw_frame(self, keypoints, background=None):
        """
        Render a full skeleton frame.

        Parameters
        ----------
        keypoints : np.ndarray, shape (42, 3) or (42, 2)
        background : ndarray or None
            Optional BGR image. If None, dark canvas is used.

        Returns
        -------
        ndarray : rendered BGR image
        """

        if background is None:
            # Use a light background so skeletons remain visible even when
            # only a few keypoints are detected.
            canvas = np.full((self.height, self.width, 3), 245, dtype=np.uint8)
        else:
            canvas = cv2.resize(background, (self.width, self.height))

        lh = keypoints[self.left_hand_range[0]:self.left_hand_range[1]]
        rh = keypoints[self.right_hand_range[0]:self.right_hand_range[1]]

        if DRAW_CONNECTIONS:
            self._draw_edges(canvas, lh, self.hand_connections,  COLOR_LEFT_HAND)
            self._draw_edges(canvas, rh, self.hand_connections,  COLOR_RIGHT_HAND)

        if DRAW_JOINTS:
            self._draw_joints(canvas, lh, COLOR_LEFT_HAND)
            self._draw_joints(canvas, rh, COLOR_RIGHT_HAND)

        return canvas