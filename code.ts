figma.showUI(__html__, { width: 260, height: 320 });

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

interface UpdateMessage {
  type: 'update';
  add?: boolean;
  shape: string;
  edges?: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

// Node used for previewing the current settings before adding a shape
let previewNode: SceneNode | null = null;

function createShape(shape: string, edges: number, width: number, height: number): SceneNode {
  let node: SceneNode;
  switch (shape) {
    case 'circle':
      node = figma.createEllipse();
      (node as EllipseNode).resize(width, height);
      break;
    case 'ellipse':
      node = figma.createEllipse();
      (node as EllipseNode).resize(width, height);
      break;
    case 'square':
      node = figma.createRectangle();
      (node as RectangleNode).resize(width, height);
      break;
    case 'rectangle':
      node = figma.createRectangle();
      (node as RectangleNode).resize(width, height);
      break;
    case 'polygon':
      node = figma.createPolygon();
      (node as PolygonNode).pointCount = edges;
      (node as PolygonNode).resize(width, height);
      break;
    default:
      node = figma.createRectangle();
  }
  node.x = 0;
  node.y = 0;
  return node;
}

function applyFill(node: SceneNode, colorHex?: string, fromHex?: string, toHex?: string) {
  if (!('fills' in node)) return;
  let paints: Paint[] = [];
  if (fromHex && toHex) {
    const from = hexToRgb(fromHex);
    const to = hexToRgb(toHex);
    paints = [
      {
        type: 'GRADIENT_LINEAR',
        gradientStops: [
          { color: { ...from, a: 1 }, position: 0 },
          { color: { ...to, a: 1 }, position: 1 },
        ],
        gradientTransform: [
          [1, 0, 0],
          [0, 1, 0],
        ],
      },
    ];
  } else if (colorHex) {
    const color = hexToRgb(colorHex);
    paints = [
      {
        type: 'SOLID',
        color,
      },
    ];
  }
  (node as GeometryMixin).fills = paints;
}

figma.ui.onmessage = (msg: UpdateMessage | { type: 'cancel' }) => {
  if (msg.type === 'update') {
    const {
      add = false,
      shape,
      edges = 3,
      width,
      height,
      rotation,
      color,
      gradientFrom,
      gradientTo,
    } = msg;
    if (add) {
      if (previewNode) {
        previewNode.remove();
        previewNode = null;
      }
      const node = createShape(shape, edges, width, height);
      (node as LayoutMixin).rotation = rotation;
      applyFill(node, color, gradientFrom, gradientTo);
      figma.currentPage.appendChild(node);
      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);
    } else {
      if (previewNode) previewNode.remove();
      previewNode = createShape(shape, edges, width, height);
      (previewNode as LayoutMixin).rotation = rotation;
      applyFill(previewNode, color, gradientFrom, gradientTo);
      figma.currentPage.appendChild(previewNode);
      figma.currentPage.selection = [previewNode];
      figma.viewport.scrollAndZoomIntoView([previewNode]);
    }
  } else if (msg.type === 'cancel') {
    if (previewNode) previewNode.remove();
    figma.closePlugin();
  }
};
