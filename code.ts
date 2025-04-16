// This plugin will open a window to prompt the user to create shapes.
// It supports rectangles and ellipses, with user-chosen colors.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// Show the HTML page in "ui.html".
figma.showUI(__html__);

// Convert a hex color string (#RRGGBB) to an RGB object with values 0–1
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

// Handle messages sent from the UI
figma.ui.onmessage = (msg: { type: string; count?: number; shape?: string; color?: string }) => {
  if (msg.type === 'create-shapes') {
    const count = msg.count || 1;
    const shape = msg.shape || 'rectangle';
    const colorHex = msg.color || '#ff8000';
    const fillColor = hexToRgb(colorHex);

    const nodes: SceneNode[] = [];
    for (let i = 0; i < count; i++) {
      let node: SceneNode;
      switch (shape) {
        case 'ellipse':
          node = figma.createEllipse();
          break;
        default:
          node = figma.createRectangle();
      }
      node.x = i * 150;
      node.y = 0;
      if ('fills' in node) {
        (node as GeometryMixin).fills = [{ type: 'SOLID', color: fillColor }];
      }
      figma.currentPage.appendChild(node);
      nodes.push(node);
    }
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
    figma.closePlugin();
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};