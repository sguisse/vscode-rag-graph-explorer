function inlineElementStyles(source: Element, target: HTMLElement) {
  const computed = window.getComputedStyle(source);
  const properties = [
    'background-color',
    'color',
    'border-color',
    'border-width',
    'border-style',
    'border-radius',
    'font-family',
    'font-size',
    'font-weight',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'margin',
    'display',
    'flex-direction',
    'align-items',
    'justify-content',
    'gap',
    'box-shadow',
    'position',
    'left',
    'top',
    'width',
    'height',
    'min-width',
    'min-height',
    'max-width',
    'max-height',
    'overflow',
    'text-align',
    'line-height',
    'white-space',
    'opacity',
    'visibility',
  ];

  let cssText = '';
  for (const prop of properties) {
    const val = computed.getPropertyValue(prop);
    if (val) {
      cssText += `${prop}:${val};`;
    }
  }

  target.setAttribute('style', (target.getAttribute('style') || '') + ';' + cssText);

  const sourceChildren = source.children;
  const targetChildren = target.children;
  for (let i = 0; i < sourceChildren.length; i++) {
    if (targetChildren[i]) {
      inlineElementStyles(sourceChildren[i], targetChildren[i] as HTMLElement);
    }
  }
}

export interface RenderedCanvasImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

export async function generateCanvasImage(containerId: string): Promise<RenderedCanvasImageResult | null> {
  const container = document.getElementById(containerId);
  if (!container) return null;

  const svgElement = container.querySelector('svg');
  if (!svgElement) return null;

  const nodeElements = Array.from(container.querySelectorAll('[data-node-wrapper="true"]')) as HTMLElement[];
  if (nodeElements.length === 0) return null;

  const nodesWrapper = nodeElements[0].parentElement;
  if (!nodesWrapper) return null;

  // 1. Calculate bounding box around all node cards
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodeElements.forEach((el) => {
    const left = parseFloat(el.style.left) || 0;
    const top = parseFloat(el.style.top) || 0;
    const width = parseFloat(el.style.width) || 240;
    const height = parseFloat(el.style.height) || 200;

    minX = Math.min(minX, left);
    minY = Math.min(minY, top);
    maxX = Math.max(maxX, left + width);
    maxY = Math.max(maxY, top + height);
  });

  const padding = 60;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const exportWidth = Math.max(Math.round(maxX - minX), 400);
  const exportHeight = Math.max(Math.round(maxY - minY), 300);

  // 2. Clone node tree and preserve user inputs
  const clonedNodesWrapper = nodesWrapper.cloneNode(true) as HTMLElement;
  const origInputs = Array.from(nodesWrapper.querySelectorAll('input, textarea, select')) as (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[];
  const cloneInputs = Array.from(clonedNodesWrapper.querySelectorAll('input, textarea, select')) as (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[];

  origInputs.forEach((orig, idx) => {
    const clone = cloneInputs[idx];
    if (!clone) return;

    const tag = orig.tagName.toLowerCase();
    if (tag === 'textarea') {
      clone.textContent = orig.value;
    } else if (tag === 'input') {
      clone.setAttribute('value', orig.value);
    } else if (tag === 'select') {
      const val = orig.value;
      const opts = clone.querySelectorAll('option');
      opts.forEach((opt) => {
        if ((opt as HTMLOptionElement).value === val) {
          opt.setAttribute('selected', 'selected');
        }
      });
    }
  });

  inlineElementStyles(nodesWrapper, clonedNodesWrapper);

  clonedNodesWrapper.style.transform = `translate(${-minX}px, ${-minY}px)`;
  clonedNodesWrapper.style.position = 'absolute';
  clonedNodesWrapper.style.top = '0';
  clonedNodesWrapper.style.left = '0';
  clonedNodesWrapper.style.width = `${exportWidth}px`;
  clonedNodesWrapper.style.height = `${exportHeight}px`;

  // 3. Clone SVG Edges Layer
  const clonedSvg = svgElement.cloneNode(true) as SVGElement;
  clonedSvg.style.transform = `translate(${-minX}px, ${-minY}px)`;
  clonedSvg.setAttribute('width', `${exportWidth}`);
  clonedSvg.setAttribute('height', `${exportHeight}`);

  const origSvgEls = Array.from(svgElement.querySelectorAll('path, text, rect, g'));
  const cloneSvgEls = Array.from(clonedSvg.querySelectorAll('path, text, rect, g'));

  origSvgEls.forEach((orig, idx) => {
    if (cloneSvgEls[idx]) {
      const computed = window.getComputedStyle(orig);
      const targetStyle = (cloneSvgEls[idx] as HTMLElement).style;
      targetStyle.fill = computed.fill;
      targetStyle.stroke = computed.stroke;
      targetStyle.strokeWidth = computed.strokeWidth;
      targetStyle.strokeDasharray = computed.strokeDasharray;
      targetStyle.fontFamily = computed.fontFamily;
      targetStyle.fontSize = computed.fontSize;
      targetStyle.fontWeight = computed.fontWeight;
    }
  });

  const xmlSerializer = new XMLSerializer();
  const svgEdgesString = xmlSerializer.serializeToString(clonedSvg);
  const nodesXhtmlString = xmlSerializer.serializeToString(clonedNodesWrapper);

  const computedBody = window.getComputedStyle(document.body);
  const bgColor = computedBody.getPropertyValue('background-color') || '#0f172a';

  // 4. Create combined SVG document string
  const combinedSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${exportWidth}" height="${exportHeight}">
      <rect width="100%" height="100%" fill="${bgColor}" />
      <g>
        ${svgEdgesString}
      </g>
      <foreignObject width="${exportWidth}" height="${exportHeight}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${exportWidth}px; height:${exportHeight}px; position:relative;">
          ${nodesXhtmlString}
        </div>
      </foreignObject>
    </svg>
  `;

  // 5. Convert SVG string to UTF-8 Base64 Data URL to prevent canvas tainting SecurityError
  const utf8Bytes = new TextEncoder().encode(combinedSvg);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const svgBase64DataUrl = `data:image/svg+xml;base64,${window.btoa(binary)}`;

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const scaleFactor = 2; // High DPI 2x canvas
      const canvas = document.createElement('canvas');
      canvas.width = exportWidth * scaleFactor;
      canvas.height = exportHeight * scaleFactor;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scaleFactor, scaleFactor);
        ctx.drawImage(image, 0, 0);

        canvas.toBlob((pngBlob) => {
          if (!pngBlob) {
            resolve(null);
            return;
          }
          const dataUrl = canvas.toDataURL('image/png');
          resolve({
            blob: pngBlob,
            dataUrl,
            width: exportWidth,
            height: exportHeight,
          });
        }, 'image/png');
      } else {
        resolve(null);
      }
    };

    image.onerror = (err) => {
      console.error('Failed to load SVG Base64 image:', err);
      resolve(null);
    };

    image.src = svgBase64DataUrl;
  });
}
