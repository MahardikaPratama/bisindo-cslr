from __future__ import annotations

import io
import os
import sys
import threading


NOISY_PREFIXES = (
    "INFO: Created TensorFlow Lite XNNPACK delegate for CPU.",
    "WARNING: All log messages before absl::InitializeLog() is called are written to STDERR",
    "W0000 ",
    "[libopenh264 ",
    "Failed to load OpenH264 library:",
)


class FilteredStderr(io.TextIOBase):
    """Filter known noisy third-party stderr lines while preserving real errors."""

    def __init__(self, wrapped):
        self._wrapped = wrapped
        self._buffer = ""

    def write(self, text):
        if not text:
            return 0

        self._buffer += text
        written = len(text)

        while "\n" in self._buffer:
            line, self._buffer = self._buffer.split("\n", 1)
            self._emit_line(line + "\n")

        return written

    def flush(self):
        if self._buffer:
            self._emit_line(self._buffer)
            self._buffer = ""
        self._wrapped.flush()

    def _emit_line(self, line):
        stripped = line.lstrip()
        if stripped.startswith(NOISY_PREFIXES):
            return
        self._wrapped.write(line)


class NativeStderrFilter:
    """Capture OS-level stderr and filter known native library noise."""

    def __init__(self):
        self._original_fd = None
        self._read_fd = None
        self._thread = None
        self._wrapped_stderr = sys.__stderr__

    def __enter__(self):
        self._original_fd = os.dup(2)
        self._read_fd, write_fd = os.pipe()
        os.dup2(write_fd, 2)
        os.close(write_fd)
        self._thread = threading.Thread(target=self._drain, daemon=True)
        self._thread.start()
        return self

    def __exit__(self, exc_type, exc, tb):
        if self._original_fd is not None:
            os.dup2(self._original_fd, 2)
            os.close(self._original_fd)
            self._original_fd = None
        if self._thread is not None:
            self._thread.join(timeout=1.0)
        if self._read_fd is not None:
            try:
                os.close(self._read_fd)
            except OSError:
                pass
            self._read_fd = None

    def _drain(self):
        with os.fdopen(self._read_fd, "r", encoding="utf-8", errors="replace", closefd=False) as stream:
            for line in stream:
                if self._should_drop(line):
                    continue
                self._wrapped_stderr.write(line)
                self._wrapped_stderr.flush()

    @staticmethod
    def _should_drop(line: str) -> bool:
        stripped = line.lstrip()
        return stripped.startswith(NOISY_PREFIXES)


def install_filtered_stderr() -> None:
    """Route Python-level stderr through a filter wrapper once."""
    if not isinstance(sys.stderr, FilteredStderr):
        sys.stderr = FilteredStderr(sys.stderr)
