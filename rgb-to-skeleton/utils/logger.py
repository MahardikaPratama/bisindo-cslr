import logging
import os
import sys


def get_logger(name: str, level: str = "INFO") -> logging.Logger:
    """Return a configured logger for the given module name.

    Handler and formatter are idempotent-safe (won't duplicate handlers
    on repeated calls for the same logger name).
    """
    logger = logging.getLogger(name)
    env_level = os.getenv("LOG_LEVEL", "").strip().upper()
    effective_level = env_level or level.upper()
    numeric_level = getattr(logging, effective_level, logging.INFO)
    logger.setLevel(numeric_level)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            "[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger


__all__ = ["get_logger"]
