from __future__ import annotations

import math
import random
import time
from typing import List, Tuple, Optional

from PyQt6.QtCore import Qt, QTimer, QRectF, QPointF, pyqtSignal
from PyQt6.QtGui import (
    QPainter, QColor, QPen, QBrush, QRadialGradient, QLinearGradient,
    QPainterPath, QFont
)
from PyQt6.QtWidgets import QWidget, QSizePolicy


class CortexColors:
    BG        = "#00060a"
    PANEL     = "#010d14"
    PRI       = "#00d4ff"
    CYAN      = "#00f3ff"
    BLUE      = "#0077ff"
    DEEP_BLUE = "#0a1b3a"
    VIOLET    = "#c866ff"
    MAGENTA   = "#ff00ff"
    AMBER     = "#ffaa00"
    GOLD      = "#ffcc00"
    RED       = "#ff3355"
    MUTED_C   = "#ff3366"
    WHITE     = "#d8f8ff"


def _qcol(hex_str: str, alpha: int | float = 255) -> QColor:
    c = QColor(hex_str)
    c.setAlpha(max(0, min(255, int(alpha))))
    return c


class NebulaCloud3D:
    def __init__(self, x: float, y: float, z: float, base_radius: float, color: str):
        self.orig_x = x
        self.orig_y = y
        self.orig_z = z
        self.x = x
        self.y = y
        self.z = z
        self.base_radius = base_radius
        self.color = color
        self.phase = random.uniform(0, math.pi * 2)
        self.speed = random.uniform(0.5, 1.1)


class Neural3DPoint:
    def __init__(self, x: float, y: float, z: float, layer_type: str = "cortex"):
        self.orig_x = x
        self.orig_y = y
        self.orig_z = z
        self.x = x
        self.y = y
        self.z = z
        self.layer_type = layer_type
        self.phase = random.uniform(0, math.pi * 2)
        self.speed = random.uniform(0.8, 1.4)
        self.activation = 0.0
        self.base_size = 2.2 if layer_type == "dust" else (4.6 if layer_type == "core" else 3.2)
        self.hemisphere = 1 if x > 0 else -1


class SynapticArc3D:
    def __init__(self, idx_a: int, idx_b: int, color: str = CortexColors.CYAN):
        self.idx_a = idx_a
        self.idx_b = idx_b
        self.progress = 0.0
        self.speed = random.uniform(0.04, 0.09)
        self.color = color


class SoundWaveRing3D:
    def __init__(self, color: str = CortexColors.CYAN):
        self.radius = 0.1
        self.max_radius = 1.6
        self.alpha = 255
        self.color = color


class CortexVisualizer(QWidget):
    """
    Self-contained 3D Holographic AI Brain Cortex & Waveform Canvas for PyQt6.
    Can be placed directly in any layout (QVBoxLayout, QHBoxLayout, QGridLayout).
    """

    stateChanged = pyqtSignal(str)
    speakingChanged = pyqtSignal(bool)
    mutedChanged = pyqtSignal(bool)

    def __init__(self, parent: Optional[QWidget] = None):
        super().__init__(parent)
        self.setAttribute(Qt.WidgetAttribute.WA_OpaquePaintEvent)
        self.setMinimumSize(260, 260)
        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)

        self._muted    = False
        self._speaking = False
        self._state    = "INITIALISING"  # LISTENING | THINKING | SPEAKING | MUTED | PROCESSING | SLEEPING

        self._tick       = 0
        self._rot_x      = 0.25
        self._rot_y      = 0.0
        self._rot_z      = 0.0
        self._scale      = 1.0
        self._tgt_scale  = 1.0
        self._energy     = 0.35
        self._tgt_energy = 0.35
        self._last_t     = time.time()
        self._blink      = True
        self._blink_tick = 0

        self._points: List[Neural3DPoint] = []
        self._clouds: List[NebulaCloud3D] = []
        self._connections: List[Tuple[int, int, float]] = []
        self._arcs: List[SynapticArc3D] = []
        self._shockwaves: List[SoundWaveRing3D] = []
        self._audio_spectrum = [0.0] * 48

        self._build_3d_mesh()

        self._timer = QTimer(self)
        self._timer.timeout.connect(self._step)
        self._timer.start(16)  # ~60 FPS

    # ── Public Control API ──────────────────────────────────────────────

    def set_state(self, state: str) -> None:
        """Sets assistant state: 'LISTENING', 'THINKING', 'SPEAKING', 'MUTED', 'PROCESSING', 'SLEEPING'"""
        state = state.upper()
        if self._state != state:
            self._state = state
            self.stateChanged.emit(state)
            self.update()

    def set_speaking(self, speaking: bool) -> None:
        if self._speaking != speaking:
            self._speaking = speaking
            if speaking:
                self.set_state("SPEAKING")
            elif not self._muted:
                self.set_state("LISTENING")
            self.speakingChanged.emit(speaking)
            self.update()

    def set_muted(self, muted: bool) -> None:
        if self._muted != muted:
            self._muted = muted
            if muted:
                self.set_state("MUTED")
            else:
                self.set_state("LISTENING" if not self._speaking else "SPEAKING")
            self.mutedChanged.emit(muted)
            self.update()

    def feed_audio_level(self, level: float) -> None:
        """Optional hook to feed raw microphone / output audio level (0.0 to 1.0)."""
        lvl = max(0.0, min(1.0, level))
        if self._speaking:
            self._tgt_scale = 1.15 + lvl * 0.35
            self._tgt_energy = 0.90 + lvl * 0.60

    # ── 3D Geometry Initialization ──────────────────────────────────────

    def _build_3d_mesh(self) -> None:
        # 1. Volumetric 3D Neural Nebula Clouds
        cloud_colors = [CortexColors.CYAN, CortexColors.MAGENTA, CortexColors.VIOLET, CortexColors.BLUE, CortexColors.DEEP_BLUE]
        for _ in range(12):
            rad = random.uniform(0.3, 0.95)
            th = random.uniform(0, math.pi * 2)
            ph = random.uniform(-math.pi / 2, math.pi / 2)
            cx = rad * math.cos(ph) * math.cos(th)
            cy = (rad * 0.85) * math.cos(ph) * math.sin(th)
            cz = rad * math.sin(ph)
            base_r = random.uniform(0.35, 0.65)
            self._clouds.append(NebulaCloud3D(cx, cy, cz, base_r, random.choice(cloud_colors)))

        # 2. Organic 3D Brain Cortex Points
        num_cortex = 84
        for i in range(num_cortex):
            phi = math.acos(1.0 - 2.0 * (i + 0.5) / num_cortex)
            theta = math.pi * (1.0 + 5.0 ** 0.5) * (i + 0.5)
            r = 0.85 + 0.12 * math.sin(theta * 3.0) * math.cos(phi * 2.0)
            hx = r * math.sin(phi) * math.cos(theta)
            hy = (r * 0.82) * math.sin(phi) * math.sin(theta)
            hz = (r * 0.95) * math.cos(phi)
            hemi = 1 if hx >= 0 else -1
            hx = (abs(hx) + 0.12) * hemi
            self._points.append(Neural3DPoint(hx, hy, hz, "cortex"))

        # 3. Inner Quantum Singularity Core
        num_core = 18
        for i in range(num_core):
            u = random.uniform(-1, 1)
            th = random.uniform(0, math.pi * 2)
            rad = random.uniform(0.15, 0.40)
            cx = rad * math.sqrt(1 - u * u) * math.cos(th)
            cy = rad * math.sqrt(1 - u * u) * math.sin(th)
            cz = rad * u
            self._points.append(Neural3DPoint(cx, cy, cz, "core"))

        # 4. Outer Orbital Synaptic Particle Field
        num_dust = 36
        for i in range(num_dust):
            rad = random.uniform(1.10, 1.45)
            th = random.uniform(0, math.pi * 2)
            ph = random.uniform(-math.pi / 2, math.pi / 2)
            dx = rad * math.cos(ph) * math.cos(th)
            dy = rad * math.cos(ph) * math.sin(th)
            dz = rad * math.sin(ph)
            self._points.append(Neural3DPoint(dx, dy, dz, "dust"))

        # Precalculate connections
        for i in range(num_cortex):
            p1 = self._points[i]
            for j in range(i + 1, num_cortex):
                p2 = self._points[j]
                d2 = (p1.orig_x - p2.orig_x)**2 + (p1.orig_y - p2.orig_y)**2 + (p1.orig_z - p2.orig_z)**2
                if d2 < 0.22:
                    self._connections.append((i, j, math.sqrt(d2)))

    # ── Animation Step ──────────────────────────────────────────────────

    def _step(self) -> None:
        self._tick += 1
        now = time.time()
        t = self._tick * 0.035

        # Dynamic Energy & Audio Reactivity
        if self._speaking:
            if now - self._last_t > 0.06:
                self._tgt_scale = random.uniform(1.18, 1.45)
                self._tgt_energy = random.uniform(0.90, 1.40)
                self._last_t = now
                if random.random() < 0.48:
                    self._shockwaves.append(SoundWaveRing3D(random.choice([CortexColors.CYAN, CortexColors.MAGENTA, CortexColors.WHITE])))
        elif self._muted:
            self._tgt_scale = 0.85
            self._tgt_energy = 0.1
        elif self._state in ("THINKING", "PROCESSING"):
            think_wave = 0.5 + 0.5 * math.sin(t * 2.8)
            self._tgt_scale = 1.02 + 0.08 * think_wave
            self._tgt_energy = 0.60 + 0.30 * think_wave
        else:
            breath = 0.5 + 0.5 * math.sin(t * 1.8)
            self._tgt_scale = 1.0 + 0.05 * breath
            self._tgt_energy = 0.35 + 0.15 * breath

        self._scale += (self._tgt_scale - self._scale) * 0.25
        self._energy += (self._tgt_energy - self._energy) * 0.25

        # 3D Rotation speeds
        if self._speaking:
            self._rot_y += 0.022
            self._rot_x = 0.22 + 0.08 * math.sin(t * 0.7)
            self._rot_z += 0.008
        elif self._state in ("THINKING", "PROCESSING"):
            self._rot_y += 0.015
            self._rot_x = 0.20 + 0.05 * math.sin(t * 1.0)
            self._rot_z += 0.005
        elif self._muted:
            self._rot_y += 0.002
        else:
            self._rot_y += 0.010
            self._rot_x = 0.20 + 0.05 * math.sin(t * 0.5)

        # 1. Update Clouds
        for c in self._clouds:
            drift = 1.0 + 0.08 * math.sin(t * 1.5 * c.speed + c.phase)
            c.x = c.orig_x * drift
            c.y = c.orig_y * drift
            c.z = c.orig_z * drift

        # 2. Update Neural Points
        for p in self._points:
            wave = math.sin(t * 2.0 * p.speed + p.phase) * (0.04 * self._energy)
            if self._speaking:
                wave += math.sin(t * 8.0 + p.orig_x * 5.0) * (0.06 * self._energy)

            disp = 1.0 + wave
            p.x = p.orig_x * disp
            p.y = p.orig_y * disp
            p.z = p.orig_z * disp

            if p.layer_type == "dust":
                ang = t * 0.5 * p.speed + p.phase
                r_orbit = math.sqrt(p.orig_x**2 + p.orig_y**2)
                p.x = r_orbit * math.cos(ang)
                p.y = r_orbit * math.sin(ang)

            if p.activation > 0:
                p.activation = max(0.0, p.activation - 0.04)

        # 3. Synaptic Arcs
        max_arcs = 18 if self._speaking else (12 if self._state in ("THINKING", "PROCESSING") else 6)
        spawn_rate = 0.45 if self._speaking else (0.25 if self._state in ("THINKING", "PROCESSING") else 0.10)

        if len(self._arcs) < max_arcs and random.random() < spawn_rate and self._connections:
            conn = random.choice(self._connections)
            col = CortexColors.WHITE if random.random() < 0.3 else (CortexColors.MAGENTA if self._speaking else CortexColors.CYAN)
            self._arcs.append(SynapticArc3D(conn[0], conn[1], col))

        kept_arcs = []
        for arc in self._arcs:
            arc.progress += arc.speed * (2.2 if self._speaking else 1.2)
            if arc.progress >= 1.0:
                if arc.idx_b < len(self._points):
                    self._points[arc.idx_b].activation = 1.0
            else:
                kept_arcs.append(arc)
        self._arcs = kept_arcs

        # 4. Shockwaves
        kept_waves = []
        for sw in self._shockwaves:
            sw.radius += 0.045
            sw.alpha = int(255 * (1.0 - sw.radius / sw.max_radius))
            if sw.alpha > 5 and sw.radius < sw.max_radius:
                kept_waves.append(sw)
        self._shockwaves = kept_waves

        # 5. Spectrum
        for i in range(len(self._audio_spectrum)):
            if self._speaking:
                tgt = random.uniform(6, 26)
            elif self._state in ("THINKING", "PROCESSING"):
                tgt = 3 + 6 * math.sin(t * 3.0 + i * 0.4)
            elif self._muted:
                tgt = 0.5
            else:
                tgt = 2.5 + 3.5 * math.sin(t * 1.2 + i * 0.3)
            self._audio_spectrum[i] += (tgt - self._audio_spectrum[i]) * 0.35

        self._blink_tick += 1
        if self._blink_tick >= 35:
            self._blink = not self._blink
            self._blink_tick = 0

        self.update()

    # ── Paint Event ─────────────────────────────────────────────────────

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        p.fillRect(self.rect(), _qcol(CortexColors.BG))

        W, H = self.width(), self.height()
        cx, cy = W / 2.0, H / 2.0
        fw = min(W, H)
        t = self._tick * 0.035

        # 1. Cosmic Radial Glow
        nebula_r = fw * 0.48 * self._scale
        grad = QRadialGradient(cx, cy, nebula_r)
        if self._muted:
            grad.setColorAt(0.0, _qcol(CortexColors.RED, 65))
            grad.setColorAt(0.35, _qcol(CortexColors.MUTED_C, 35))
            grad.setColorAt(0.75, _qcol("#2a000a", 15))
        elif self._speaking:
            grad.setColorAt(0.0, _qcol(CortexColors.MAGENTA, int(95 * self._energy)))
            grad.setColorAt(0.35, _qcol(CortexColors.VIOLET, int(55 * self._energy)))
            grad.setColorAt(0.70, _qcol(CortexColors.BLUE, int(30 * self._energy)))
        elif self._state in ("THINKING", "PROCESSING"):
            grad.setColorAt(0.0, _qcol(CortexColors.AMBER, int(85 * self._energy)))
            grad.setColorAt(0.45, _qcol(CortexColors.VIOLET, int(45 * self._energy)))
        else:
            grad.setColorAt(0.0, _qcol(CortexColors.CYAN, int(55 * self._energy)))
            grad.setColorAt(0.35, _qcol(CortexColors.BLUE, int(35 * self._energy)))
            grad.setColorAt(0.75, _qcol(CortexColors.DEEP_BLUE, int(20 * self._energy)))
        grad.setColorAt(1.0, _qcol(CortexColors.BG, 0))
        p.setBrush(QBrush(grad))
        p.setPen(Qt.PenStyle.NoPen)
        p.drawEllipse(QRectF(cx - nebula_r, cy - nebula_r, nebula_r * 2, nebula_r * 2))

        # 3D Matrix Setup
        cos_x, sin_x = math.cos(self._rot_x), math.sin(self._rot_x)
        cos_y, sin_y = math.cos(self._rot_y), math.sin(self._rot_y)
        cos_z, sin_z = math.cos(self._rot_z), math.sin(self._rot_z)

        world_scale = fw * 0.28 * self._scale
        fov = fw * 1.8

        # 2. Render Nebula Clouds
        for cloud in self._clouds:
            x0 = cloud.x * world_scale
            y0 = cloud.y * world_scale
            z0 = cloud.z * world_scale

            x1 = x0 * cos_y + z0 * sin_y
            y1 = y0
            z1 = -x0 * sin_y + z0 * cos_y

            x2 = x1
            y2 = y1 * cos_x - z1 * sin_x
            z2 = y1 * sin_x + z1 * cos_x

            x3 = x2 * cos_z - y2 * sin_z
            y3 = x2 * sin_z + y2 * cos_z
            z3 = z2

            depth_scale = fov / (fov + z3 + world_scale * 1.5)
            x2d = cx + x3 * depth_scale
            y2d = cy + y3 * depth_scale
            depth_f = (z3 + world_scale * 1.5) / (world_scale * 3.0)
            depth_f = max(0.1, min(1.0, depth_f))

            c_radius = cloud.base_radius * world_scale * depth_scale * (1.2 if self._speaking else (0.8 if self._muted else 1.0))
            c_grad = QRadialGradient(x2d, y2d, c_radius)
            cloud_col = CortexColors.RED if self._muted else cloud.color
            c_alpha = int((30 if self._muted else (50 if self._speaking else 30)) * depth_f * (0.6 if self._muted else self._energy))
            c_grad.setColorAt(0.0, _qcol(cloud_col, c_alpha))
            c_grad.setColorAt(0.5, _qcol(cloud_col, int(c_alpha * 0.4)))
            c_grad.setColorAt(1.0, _qcol(CortexColors.BG, 0))
            p.setBrush(QBrush(c_grad))
            p.setPen(Qt.PenStyle.NoPen)
            p.drawEllipse(QRectF(x2d - c_radius, y2d - c_radius, c_radius * 2, c_radius * 2))

        # 3. Harmonic Silk Ribbon Waves
        ribbon_cy = cy + fw * 0.05
        base_amp = (34.0 if self._speaking else (8.0 if self._muted else 15.0)) * (0.8 + 0.6 * self._energy)
        step_px = 6
        steps = int(W / step_px) + 2

        # Ribbon 1
        grad1 = QLinearGradient(0, ribbon_cy - base_amp, W, ribbon_cy + base_amp)
        if self._muted:
            grad1.setColorAt(0.0, _qcol(CortexColors.RED, 0))
            grad1.setColorAt(0.40, _qcol(CortexColors.RED, 75))
            grad1.setColorAt(0.80, _qcol(CortexColors.MUTED_C, 45))
            grad1.setColorAt(1.0, _qcol(CortexColors.BG, 0))
        elif self._speaking:
            grad1.setColorAt(0.0, _qcol(CortexColors.CYAN, 0))
            grad1.setColorAt(0.25, _qcol(CortexColors.CYAN, int(175 * self._energy)))
            grad1.setColorAt(0.65, _qcol(CortexColors.BLUE, int(195 * self._energy)))
            grad1.setColorAt(1.0, _qcol(CortexColors.DEEP_BLUE, 0))
        else:
            grad1.setColorAt(0.0, _qcol(CortexColors.CYAN, 0))
            grad1.setColorAt(0.30, _qcol(CortexColors.CYAN, 95))
            grad1.setColorAt(0.70, _qcol(CortexColors.BLUE, 115))
            grad1.setColorAt(1.0, _qcol(CortexColors.DEEP_BLUE, 0))

        path1 = QPainterPath()
        top_pts1, bot_pts1 = [], []
        for i in range(steps):
            x = i * step_px
            prog = x / max(1.0, W)
            y_top = ribbon_cy + math.sin(prog * math.pi * 2.2 + t * 1.4) * base_amp \
                             + math.cos(prog * math.pi * 1.1 + t * 0.7) * (base_amp * 0.38)
            ribbon_w = (14.0 + 16.0 * math.sin(prog * math.pi * 2.8 + t * 1.1)) * (1.2 if self._speaking else (0.6 if self._muted else 0.9))
            top_pts1.append(QPointF(x, y_top))
            bot_pts1.append(QPointF(x, y_top + ribbon_w))

        path1.moveTo(top_pts1[0])
        for pt in top_pts1[1:]: path1.lineTo(pt)
        for pt in reversed(bot_pts1): path1.lineTo(pt)
        path1.closeSubpath()
        p.setBrush(QBrush(grad1))
        p.setPen(Qt.PenStyle.NoPen)
        p.drawPath(path1)

        # 4. Project 3D Points
        proj_points: List[Tuple[float, float, float, Neural3DPoint, float, int]] = []
        for idx, pt in enumerate(self._points):
            x0 = pt.x * world_scale
            y0 = pt.y * world_scale
            z0 = pt.z * world_scale

            x1 = x0 * cos_y + z0 * sin_y
            y1 = y0
            z1 = -x0 * sin_y + z0 * cos_y

            x2 = x1
            y2 = y1 * cos_x - z1 * sin_x
            z2 = y1 * sin_x + z1 * cos_x

            x3 = x2 * cos_z - y2 * sin_z
            y3 = x2 * sin_z + y2 * cos_z
            z3 = z2

            depth_scale = fov / (fov + z3 + world_scale * 1.5)
            x2d = cx + x3 * depth_scale
            y2d = cy + y3 * depth_scale
            depth_factor = (z3 + world_scale * 1.5) / (world_scale * 3.0)
            depth_factor = max(0.05, min(1.0, depth_factor))
            proj_points.append((x2d, y2d, z3, pt, depth_factor, idx))

        # 5. Synaptic Connections
        p.setBrush(Qt.BrushStyle.NoBrush)
        for i, j, _ in self._connections:
            p1_proj = proj_points[i]
            p2_proj = proj_points[j]
            avg_depth = (p1_proj[4] + p2_proj[4]) * 0.5
            is_active = (p1_proj[3].activation > 0.2 or p2_proj[3].activation > 0.2) and not self._muted

            if is_active:
                line_alpha = int(255 * avg_depth)
                col_hex = CortexColors.WHITE if random.random() < 0.5 else CortexColors.MAGENTA
                line_w = 2.2 * avg_depth
            elif self._muted:
                line_alpha = int(55 * avg_depth)
                col_hex = CortexColors.RED if avg_depth > 0.55 else CortexColors.MUTED_C
                line_w = 0.85 * avg_depth
            else:
                line_alpha = int((130 if self._speaking else 75) * avg_depth)
                col_hex = CortexColors.CYAN if avg_depth > 0.5 else CortexColors.BLUE
                line_w = 1.0 * avg_depth

            p.setPen(QPen(_qcol(col_hex, line_alpha), max(0.8, line_w)))
            p.drawLine(QPointF(p1_proj[0], p1_proj[1]), QPointF(p2_proj[0], p2_proj[1]))

        # 6. Synaptic Lightning Sparks
        if not self._muted:
            for arc in self._arcs:
                if arc.idx_a < len(proj_points) and arc.idx_b < len(proj_points):
                    p1 = proj_points[arc.idx_a]
                    p2 = proj_points[arc.idx_b]
                    cur_x = p1[0] + (p2[0] - p1[0]) * arc.progress
                    cur_y = p1[1] + (p2[1] - p1[1]) * arc.progress
                    cur_d = p1[4] + (p2[4] - p1[4]) * arc.progress
                    spark_alpha = int(255 * cur_d)
                    spark_sz = (6.5 if self._speaking else 4.2) * cur_d
                    p.setBrush(QBrush(_qcol(arc.color, int(130 * cur_d))))
                    p.setPen(Qt.PenStyle.NoPen)
                    p.drawEllipse(QPointF(cur_x, cur_y), spark_sz * 2.4, spark_sz * 2.4)
                    p.setBrush(QBrush(_qcol(CortexColors.WHITE, spark_alpha)))
                    p.drawEllipse(QPointF(cur_x, cur_y), spark_sz, spark_sz)

        # 7. Shockwave Rings
        for sw in self._shockwaves:
            r_px = sw.radius * world_scale
            sw_alpha = int(sw.alpha * (0.85 if self._speaking else (0.25 if self._muted else 0.45)))
            sw_col = CortexColors.RED if self._muted else sw.color
            p.setBrush(Qt.BrushStyle.NoBrush)
            p.setPen(QPen(_qcol(sw_col, sw_alpha), 1.8, Qt.PenStyle.DashLine))
            p.drawEllipse(QRectF(cx - r_px, cy - r_px * 0.45, r_px * 2, r_px * 0.90))

        # 8. Central AI Quantum Core
        core_r = fw * 0.13 * self._scale * (1.2 if self._speaking else (0.88 if self._muted else 1.0))
        core_grad = QRadialGradient(cx, cy, core_r)
        if self._muted:
            core_col = CortexColors.RED
            inner_halo = CortexColors.MUTED_C
        elif self._speaking:
            core_col = CortexColors.WHITE
            inner_halo = CortexColors.VIOLET
        elif self._state in ("THINKING", "PROCESSING"):
            core_col = CortexColors.AMBER
            inner_halo = CortexColors.GOLD
        else:
            core_col = CortexColors.CYAN
            inner_halo = CortexColors.BLUE

        core_grad.setColorAt(0.0, _qcol(CortexColors.WHITE if not self._muted else "#ff8899", 255))
        core_grad.setColorAt(0.25, _qcol(core_col, int(190 if self._muted else 230 * self._energy)))
        core_grad.setColorAt(0.60, _qcol(inner_halo, int(110 if self._muted else 140 * self._energy)))
        core_grad.setColorAt(0.85, _qcol("#220008" if self._muted else CortexColors.DEEP_BLUE, int(45 if self._muted else 60 * self._energy)))
        core_grad.setColorAt(1.0, _qcol(CortexColors.BG, 0))
        p.setBrush(QBrush(core_grad))
        p.setPen(Qt.PenStyle.NoPen)
        p.drawEllipse(QRectF(cx - core_r, cy - core_r, core_r * 2, core_r * 2))

        # 9. Neural Nodes (Sorted far to near)
        sorted_nodes = sorted(proj_points, key=lambda item: item[2])
        for x2d, y2d, z3, pt, depth, idx in sorted_nodes:
            sz = pt.base_size * depth * (1.4 if (pt.activation > 0.2 and not self._muted) else 1.0) * (1.2 if self._speaking else (0.85 if self._muted else 1.0))
            node_alpha = int((190 if self._muted else 255) * depth)

            if self._muted:
                node_col = CortexColors.RED if depth > 0.55 else CortexColors.MUTED_C
                halo_col = CortexColors.RED
                halo_mult = 2.2
            elif pt.layer_type == "core":
                node_col = CortexColors.WHITE if depth > 0.6 else CortexColors.CYAN
                halo_col = CortexColors.CYAN
                halo_mult = 3.2
            elif pt.layer_type == "dust":
                node_col = CortexColors.MAGENTA if (idx % 2 == 0) else CortexColors.CYAN
                halo_col = node_col
                halo_mult = 2.0
                sz *= 0.75
            else:
                if pt.activation > 0.3:
                    node_col = CortexColors.WHITE
                    halo_col = CortexColors.MAGENTA
                    halo_mult = 3.8
                else:
                    node_col = CortexColors.CYAN if depth > 0.55 else CortexColors.BLUE
                    halo_col = CortexColors.VIOLET if self._speaking else CortexColors.DEEP_BLUE
                    halo_mult = 2.4

            if depth > 0.30 or (pt.activation > 0.2 and not self._muted):
                p.setPen(Qt.PenStyle.NoPen)
                p.setBrush(QBrush(_qcol(halo_col, int((55 if self._muted else 95) * depth))))
                p.drawEllipse(QPointF(x2d, y2d), sz * halo_mult, sz * halo_mult)

            p.setBrush(QBrush(_qcol(node_col, node_alpha)))
            p.setPen(QPen(_qcol(CortexColors.WHITE if not self._muted else CortexColors.RED, int(150 * depth)), 0.8))
            p.drawEllipse(QPointF(x2d, y2d), sz, sz)

        # 10. Outer Circular Equalizer
        spec_len = len(self._audio_spectrum)
        spec_r = fw * 0.44
        p.setBrush(Qt.BrushStyle.NoBrush)
        for i, val in enumerate(self._audio_spectrum):
            ang = (i / spec_len) * 2.0 * math.pi + t * (0.05 if self._muted else 0.2)
            ca, sa = math.cos(ang), math.sin(ang)
            r_in = spec_r
            r_out = spec_r + (2.0 if self._muted else (val * (1.4 if self._speaking else 0.85)))
            p1 = QPointF(cx + ca * r_in, cy + sa * r_in)
            p2 = QPointF(cx + ca * r_out, cy + sa * r_out)

            if self._muted:
                bar_col = CortexColors.RED if i % 4 == 0 else CortexColors.MUTED_C
                bar_alpha = 75
            elif i % 4 == 0 and self._speaking:
                bar_col = CortexColors.MAGENTA
                bar_alpha = int(140 + min(115, val * 8))
            elif i % 2 == 0:
                bar_col = CortexColors.CYAN
                bar_alpha = int(140 + min(115, val * 8))
            else:
                bar_col = CortexColors.BLUE
                bar_alpha = int(140 + min(115, val * 8))

            p.setPen(QPen(_qcol(bar_col, bar_alpha), 1.8))
            p.drawLine(p1, p2)

        # 11. Status Text
        sy = cy + fw * 0.435
        if self._muted:
            txt, col = "⊘  NEURAL CORE DORMANT // MICROPHONE MUTED", _qcol(CortexColors.RED)
        elif self._speaking:
            txt, col = f"●  SYNAPSE ACTIVE // AUDIO STREAMING // {len(self._arcs):02d} ARCS", _qcol(CortexColors.MAGENTA)
        elif self._state in ("THINKING", "PROCESSING"):
            sym = "◈" if self._blink else "◇"
            txt, col = f"{sym}  NEURAL SYNAPSE // PROCESSING", _qcol(CortexColors.AMBER)
        elif self._state == "LISTENING":
            sym = "●" if self._blink else "○"
            txt, col = f"{sym}  NEURAL CORE ONLINE // LISTENING", _qcol(CortexColors.CYAN)
        else:
            sym = "●" if self._blink else "○"
            txt, col = f"{sym}  {self._state}", _qcol(CortexColors.CYAN)

        p.setPen(QPen(col, 1))
        p.setFont(QFont("Consolas", 9, QFont.Weight.Bold))
        p.drawText(QRectF(0, sy, W, 20), Qt.AlignmentFlag.AlignCenter, txt)

        # 12. Bottom Waveform
        vw = min(W * 0.82, 360.0)
        vx0 = (W - vw) / 2.0
        vy = H - 14.0
        n_bars = 40
        bar_step = vw / n_bars
        bw = max(2.0, bar_step * 0.60)

        p.setPen(QPen(_qcol(CortexColors.RED if self._muted else CortexColors.CYAN, 40), 1))
        p.drawLine(QPointF(vx0, vy), QPointF(vx0 + vw, vy))

        wave_path = QPainterPath()
        first_pt = True

        for i in range(n_bars):
            dist_from_mid = abs(i - (n_bars / 2.0)) / (n_bars / 2.0)
            spec_idx = int(dist_from_mid * (len(self._audio_spectrum) - 1))
            val = self._audio_spectrum[spec_idx]
            h = 2.5 if self._muted else ((val / 26.0) * (18.0 if self._speaking else 7.0) * (1.0 - dist_from_mid * 0.3) + 2.0)
            bx = vx0 + i * bar_step

            if self._muted:
                bar_c = CortexColors.RED if dist_from_mid < 0.45 else CortexColors.MUTED_C
            elif self._speaking:
                bar_c = CortexColors.MAGENTA if dist_from_mid < 0.4 else (CortexColors.VIOLET if dist_from_mid < 0.75 else CortexColors.CYAN)
            elif self._state in ("THINKING", "PROCESSING"):
                bar_c = CortexColors.AMBER if dist_from_mid < 0.5 else CortexColors.CYAN
            else:
                bar_c = CortexColors.CYAN if dist_from_mid < 0.6 else CortexColors.BLUE

            bar_alpha = int(110 if self._muted else (160 + min(95, val * 6)))
            p.setBrush(QBrush(_qcol(bar_c, bar_alpha)))
            p.setPen(Qt.PenStyle.NoPen)
            p.drawRoundedRect(QRectF(bx, vy - h, bw, h), 1.0, 1.0)

            peak_pt = QPointF(bx + bw * 0.5, vy - h - 1.5)
            if first_pt:
                wave_path.moveTo(peak_pt)
                first_pt = False
            else:
                wave_path.lineTo(peak_pt)

        p.setBrush(Qt.BrushStyle.NoBrush)
        p.setPen(QPen(_qcol(CortexColors.WHITE if self._speaking else CortexColors.CYAN, 140 if self._speaking else 80), 1.2))
        p.drawPath(wave_path)
