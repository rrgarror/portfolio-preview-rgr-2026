"use strict";

const canvas = document.querySelector("#visual-canvas");
const siteHeader = document.querySelector(".site-header");
const researchSection = document.querySelector("#research");
const teachingSection = document.querySelector("#teaching");

const clamp = (value, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

const smoothstep = (start, end, value) => {
  const amount = clamp((value - start) / (end - start));
  return amount * amount * (3 - 2 * amount);
};

function getVisualProgress() {
  const researchTop = researchSection?.offsetTop ?? window.innerHeight;
  const teachingTop = teachingSection?.offsetTop ?? researchTop * 2;

  if (window.scrollY <= researchTop) {
    return 0.5 * clamp(window.scrollY / Math.max(researchTop, 1));
  }

  return 0.5 + 0.5 * clamp(
    (window.scrollY - researchTop) / Math.max(teachingTop - researchTop, 1),
  );
}

if (canvas) {
  const context = canvas.getContext("2d", { alpha: true });
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  let width = window.innerWidth;
  let height = window.innerHeight;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  let targetProgress = getVisualProgress();
  let displayedProgress = targetProgress;
  let frameRequest = null;

  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const objectVertices = [
    [-1, goldenRatio, 0],
    [1, goldenRatio, 0],
    [-1, -goldenRatio, 0],
    [1, -goldenRatio, 0],
    [0, -1, goldenRatio],
    [0, 1, goldenRatio],
    [0, -1, -goldenRatio],
    [0, 1, -goldenRatio],
    [goldenRatio, 0, -1],
    [goldenRatio, 0, 1],
    [-goldenRatio, 0, -1],
    [-goldenRatio, 0, 1],
  ];

  const objectEdges = [];

  for (let first = 0; first < objectVertices.length; first += 1) {
    for (let second = first + 1; second < objectVertices.length; second += 1) {
      const a = objectVertices[first];
      const b = objectVertices[second];
      const distance = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

      if (distance < 2.1) {
        objectEdges.push([first, second]);
      }
    }
  }

  const edgeKeys = new Set(
    objectEdges.map(([first, second]) => `${Math.min(first, second)}-${Math.max(first, second)}`),
  );
  const objectFaces = [];

  for (let first = 0; first < objectVertices.length; first += 1) {
    for (let second = first + 1; second < objectVertices.length; second += 1) {
      for (let third = second + 1; third < objectVertices.length; third += 1) {
        const pairs = [
          `${first}-${second}`,
          `${first}-${third}`,
          `${second}-${third}`,
        ];

        if (pairs.every((pair) => edgeKeys.has(pair))) {
          objectFaces.push([first, second, third]);
        }
      }
    }
  }

  const targetSegments = [
    [0.18, 0.18, 0.08, 0.08],
    [0.18, 0.18, 0.28, 0.08],
    [0.18, 0.18, 0.18, 0.31],
    [0.38, 0.12, 0.62, 0.12],
    [0.50, 0.12, 0.50, 0.28],
    [0.50, 0.12, 0.50, 0.04],
    [0.82, 0.18, 0.70, 0.08],
    [0.82, 0.18, 0.94, 0.08],
    [0.82, 0.18, 0.82, 0.31],
    [0.18, 0.48, 0.18, 0.35],
    [0.18, 0.48, 0.31, 0.48],
    [0.40, 0.38, 0.47, 0.50],
    [0.47, 0.50, 0.54, 0.38],
    [0.54, 0.38, 0.61, 0.50],
    [0.61, 0.50, 0.68, 0.38],
    [0.84, 0.46, 0.74, 0.36],
    [0.84, 0.46, 0.94, 0.36],
    [0.84, 0.46, 0.74, 0.56],
    [0.84, 0.46, 0.94, 0.56],
    [0.07, 0.70, 0.30, 0.70],
    [0.07, 0.76, 0.30, 0.76],
    [0.07, 0.82, 0.30, 0.82],
    [0.43, 0.68, 0.61, 0.68],
    [0.61, 0.68, 0.61, 0.84],
    [0.61, 0.84, 0.43, 0.84],
    [0.43, 0.84, 0.43, 0.68],
    [0.76, 0.68, 0.84, 0.82],
    [0.84, 0.82, 0.92, 0.68],
    [0.78, 0.90, 0.94, 0.90],
    [0.70, 0.64, 0.70, 0.90],
  ];

  const dashedSegmentIndices = new Set([5, 17, 25, 29]);
  const arrowSegmentIndices = new Set([3, 6, 7, 18]);
  const junctionPoints = [
    [0.18, 0.18],
    [0.50, 0.12],
    [0.82, 0.18],
    [0.18, 0.48],
    [0.47, 0.50],
    [0.54, 0.38],
    [0.61, 0.50],
    [0.84, 0.46],
    [0.84, 0.82],
  ];

  const lineLabels = [
    [0.12, 0.13, "+"],
    [0.55, 0.11, "−"],
    [0.80, 0.26, "+"],
    [0.23, 0.75, "−"],
  ];

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    requestRender();
  }

  function rotateVertex(vertex, rotationX, rotationY) {
    const [x, y, z] = vertex;
    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    const rotatedX = x * cosY + z * sinY;
    const rotatedZ = -x * sinY + z * cosY;
    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);

    return [
      rotatedX,
      y * cosX - rotatedZ * sinX,
      y * sinX + rotatedZ * cosX,
    ];
  }

  function getProjectedObject(progress) {
    const scale = Math.min(width, height) * (width < 720 ? 0.16 : 0.22);
    const desktopCenter = width * (0.58 + smoothstep(0.1, 0.5, progress) * 0.2);
    const centerX = width < 900 ? width * 0.7 : desktopCenter;
    const centerY = height * 0.47;
    const rotationY = -0.52 + progress * 1.35;
    const rotationX = 0.3 - progress * 0.38;

    const points = objectVertices.map((vertex) => {
      const [x, y, z] = rotateVertex(vertex, rotationX, rotationY);
      const perspective = 3.9 / (4.9 - z * 0.5);

      return {
        x: centerX + x * scale * perspective,
        y: centerY + y * scale * perspective,
        z,
      };
    });

    return { points, centerX, centerY, scale };
  }

  function getTargetPoint(x, y) {
    const regionLeft = width < 900 ? width * 0.1 : width * 0.57;
    const regionTop = height * 0.08;
    const regionWidth = width < 900 ? width * 0.8 : width * 0.38;
    const regionHeight = height * 0.82;

    return {
      x: regionLeft + x * regionWidth,
      y: regionTop + y * regionHeight,
    };
  }

  function getTargetSegment(index) {
    const [x1, y1, x2, y2] = targetSegments[index % targetSegments.length];

    return {
      first: getTargetPoint(x1, y1),
      second: getTargetPoint(x2, y2),
    };
  }

  function mixPoint(first, second, amount) {
    return {
      x: first.x + (second.x - first.x) * amount,
      y: first.y + (second.y - first.y) * amount,
      z: first.z ?? 0,
    };
  }

  function drawSolidFaces(points, opacity) {
    if (opacity <= 0.002) {
      return;
    }

    const orderedFaces = objectFaces
      .map((face) => ({
        face,
        depth: face.reduce((total, index) => total + points[index].z, 0) / 3,
      }))
      .sort((a, b) => a.depth - b.depth);

    context.save();
    context.globalAlpha = opacity;

    orderedFaces.forEach(({ face, depth }, index) => {
      const shade = clamp((depth + 2.6) / 5.2);
      const red = Math.round(211 + shade * 18);
      const green = Math.round(210 + shade * 17);
      const blue = Math.round(198 + shade * 18);
      const warmFace = index % 5 === 0;

      context.fillStyle = warmFace
        ? `rgb(${red + 2}, ${green - 2}, ${blue - 2})`
        : `rgb(${red}, ${green}, ${blue})`;
      context.beginPath();
      context.moveTo(points[face[0]].x, points[face[0]].y);
      context.lineTo(points[face[1]].x, points[face[1]].y);
      context.lineTo(points[face[2]].x, points[face[2]].y);
      context.closePath();
      context.fill();
    });

    const hull = points
      .slice()
      .sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (origin, a, b) =>
      (a.x - origin.x) * (b.y - origin.y) -
      (a.y - origin.y) * (b.x - origin.x);
    const lower = [];
    const upper = [];

    hull.forEach((point) => {
      while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), point) <= 0) {
        lower.pop();
      }
      lower.push(point);
    });

    hull.slice().reverse().forEach((point) => {
      while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), point) <= 0) {
        upper.pop();
      }
      upper.push(point);
    });

    const outline = lower.slice(0, -1).concat(upper.slice(0, -1));
    context.strokeStyle = "rgba(51, 54, 49, 0.14)";
    context.lineWidth = 0.9;
    context.beginPath();
    outline.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    context.closePath();
    context.stroke();

    context.restore();
  }

  function drawArrowhead(first, second, opacity) {
    const amount = 0.56;
    const x = first.x + (second.x - first.x) * amount;
    const y = first.y + (second.y - first.y) * amount;
    const angle = Math.atan2(second.y - first.y, second.x - first.x);
    const size = 4.5;

    context.save();
    context.globalAlpha = opacity;
    context.fillStyle = "rgb(138, 71, 55)";
    context.translate(x, y);
    context.rotate(angle);
    context.beginPath();
    context.moveTo(size, 0);
    context.lineTo(-size, -size * 0.55);
    context.lineTo(-size, size * 0.55);
    context.closePath();
    context.fill();
    context.restore();
  }

  function drawPrimitiveAnnotations(opacity) {
    if (opacity <= 0.002) {
      return;
    }

    context.save();
    context.globalAlpha = opacity;
    context.strokeStyle = "rgba(35, 40, 37, 0.52)";
    context.fillStyle = "rgba(241, 238, 230, 0.92)";
    context.lineWidth = 0.8;

    junctionPoints.forEach(([x, y]) => {
      const point = getTargetPoint(x, y);
      context.beginPath();
      context.arc(point.x, point.y, 2.7, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    });

    context.fillStyle = "rgba(138, 71, 55, 0.72)";
    context.font = '11px ui-sans-serif, "Segoe UI", sans-serif';
    context.textAlign = "center";
    context.textBaseline = "middle";

    lineLabels.forEach(([x, y, label]) => {
      const point = getTargetPoint(x, y);
      context.fillText(label, point.x, point.y);
    });

    context.restore();
  }

  function drawMorph(progress) {
    const { points, centerX, centerY, scale } = getProjectedObject(progress);
    const faceOpacity = 1 - smoothstep(0.08, 0.46, progress);
    const segmentMorph = smoothstep(0.53, 0.98, progress);
    const wireframeReveal = smoothstep(0.15, 0.49, progress);
    const annotationOpacity = smoothstep(0.68, 0.98, progress);

    drawSolidFaces(points, faceOpacity);

    context.save();
    context.lineCap = "round";

    objectEdges.forEach(([firstIndex, secondIndex], edgeIndex) => {
      const target = getTargetSegment(edgeIndex);
      const first = mixPoint(points[firstIndex], target.first, segmentMorph);
      const second = mixPoint(points[secondIndex], target.second, segmentMorph);
      const depth = clamp((points[firstIndex].z + points[secondIndex].z + 5) / 10, 0.34, 1);
      const lineOpacity = (0.17 + depth * 0.18) * Math.max(wireframeReveal, segmentMorph);

      context.lineWidth = 0.75 + segmentMorph * 0.3;
      context.strokeStyle = `rgba(35, 40, 37, ${lineOpacity})`;
      context.setLineDash(
        segmentMorph > 0.72 && dashedSegmentIndices.has(edgeIndex) ? [3, 5] : [],
      );
      context.beginPath();
      context.moveTo(first.x, first.y);
      context.lineTo(second.x, second.y);
      context.stroke();

      if (arrowSegmentIndices.has(edgeIndex)) {
        drawArrowhead(first, second, annotationOpacity * 0.72);
      }
    });

    if (segmentMorph < 0.55) {
      const pointOpacity =
        wireframeReveal * (1 - smoothstep(0.38, 0.56, progress));

      points.forEach((point) => {
        context.fillStyle = `rgba(138, 71, 55, ${0.5 * pointOpacity})`;
        context.beginPath();
        context.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
        context.fill();
      });

      context.strokeStyle = `rgba(115, 120, 99, ${0.15 * pointOpacity})`;
      context.setLineDash([3, 7]);
      context.beginPath();
      context.ellipse(centerX, centerY, scale * 1.05, scale * 0.3, -0.22, 0, Math.PI * 2);
      context.stroke();
    }

    context.restore();
    drawPrimitiveAnnotations(annotationOpacity);
  }

  function renderFrame() {
    const easing = reducedMotionQuery.matches ? 1 : 0.09;
    displayedProgress += (targetProgress - displayedProgress) * easing;

    context.clearRect(0, 0, width, height);
    drawMorph(displayedProgress);

    if (Math.abs(targetProgress - displayedProgress) > 0.0005) {
      frameRequest = window.requestAnimationFrame(renderFrame);
    } else {
      displayedProgress = targetProgress;
      frameRequest = null;
    }
  }

  function requestRender() {
    if (frameRequest === null) {
      frameRequest = window.requestAnimationFrame(renderFrame);
    }
  }

  function handleScroll() {
    targetProgress = getVisualProgress();
    siteHeader?.classList.toggle("is-scrolled", window.scrollY > 24);
    requestRender();
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", resizeCanvas);
  reducedMotionQuery.addEventListener?.("change", requestRender);

  resizeCanvas();
  handleScroll();
}
