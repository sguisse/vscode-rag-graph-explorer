import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';

export interface RenderedCanvasImageResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

const CRITICAL_CSS_PROPERTIES = [
  'display',
  'position',
  'top',
  'left',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'flex-direction',
  'align-items',
  'justify-content',
  'flex-wrap',
  'flex-grow',
  'flex-shrink',
  'gap',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'background-color',
  'color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'box-shadow',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-align',
  'white-space',
  'word-break',
  'overflow-x',
  'overflow-y',
  'text-overflow',
  'box-sizing',
  'opacity',
  'visibility',
  'transform',
  'accent-color',
];

function cloneAndFreezeNodeTree(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;

  const origElements = Array.from(source.querySelectorAll('*')) as HTMLElement[];
  const cloneElements = Array.from(clone.querySelectorAll('*')) as HTMLElement[];

  origElements.forEach((orig, idx) => {
    const target = cloneElements[idx];
    if (!target) return;

    const tag = orig.tagName.toLowerCase();
    const computed = window.getComputedStyle(orig);

    if (tag === 'img') {
      const img = orig as HTMLImageElement;
      const replacement = document.createElement('div');

      replacement.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${computed.width};
        height: ${computed.height};
        border-radius: ${computed.borderRadius};
        background-color: ${computed.backgroundColor || '#1e293b'};
        overflow: hidden;
        border: ${computed.border};
        box-sizing: border-box;
      `;

      const span = document.createElement('span');
      span.style.cssText = 'font-size: 10px; color: #94a3b8; font-family: monospace; font-weight: bold;';
      span.textContent = `🖼️ [Image: ${img.alt || 'Media'}]`;
      replacement.appendChild(span);

      target.parentNode?.replaceChild(replacement, target);
    } else if (tag === 'input' && (orig as HTMLInputElement).type === 'range') {
      const inputEl = orig as HTMLInputElement;
      const min = parseFloat(inputEl.min) || 0;
      const max = parseFloat(inputEl.max) || 100;
      const val = parseFloat(inputEl.value) || min;
      const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

      let accentCol = computed.accentColor;
      if (!accentCol || accentCol === 'auto' || accentCol === 'initial' || accentCol === 'inherit') {
        accentCol = computed.color && computed.color !== 'rgba(0, 0, 0, 0)' ? computed.color : '#6366f1';
      }

      const sliderContainer = document.createElement('div');
      sliderContainer.style.cssText = `
        display: flex;
        align-items: center;
        position: relative;
        width: ${computed.width || '100%'};
        height: ${computed.height || '20px'};
        padding: ${computed.padding};
        margin: ${computed.margin};
        box-sizing: border-box;
      `;

      const track = document.createElement('div');
      track.style.cssText = `
        width: 100%;
        height: 6px;
        background-color: rgba(148, 163, 184, 0.25);
        border-radius: 9999px;
        position: relative;
      `;

      const activeTrack = document.createElement('div');
      activeTrack.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: ${pct}%;
        background-color: ${accentCol};
        border-radius: 9999px;
      `;

      const thumb = document.createElement('div');
      thumb.style.cssText = `
        position: absolute;
        top: 50%;
        left: ${pct}%;
        transform: translate(-50%, -50%);
        width: 14px;
        height: 14px;
        background-color: ${accentCol};
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      `;

      track.appendChild(activeTrack);
      track.appendChild(thumb);
      sliderContainer.appendChild(track);

      target.parentNode?.replaceChild(sliderContainer, target);
    } else if (tag === 'input' && (orig as HTMLInputElement).type === 'checkbox') {
      const checkbox = orig as HTMLInputElement;
      const box = document.createElement('div');
      box.style.cssText = `
        width: ${computed.width || '14px'};
        height: ${computed.height || '14px'};
        border: ${computed.border || '1px solid #64748b'};
        border-radius: ${computed.borderRadius || '3px'};
        background-color: ${checkbox.checked ? '#6366f1' : 'transparent'};
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 10px;
        font-weight: bold;
        box-sizing: border-box;
      `;
      if (checkbox.checked) {
        box.textContent = '✓';
      }
      target.parentNode?.replaceChild(box, target);
    } else if (tag === 'textarea' || tag === 'input' || tag === 'select') {
      const replacement = document.createElement('div');

      let textVal = '';
      if (tag === 'select') {
        const select = orig as HTMLSelectElement;
        textVal = select.options[select.selectedIndex]?.text || select.value;
      } else {
        textVal = (orig as HTMLInputElement | HTMLTextAreaElement).value || '';
      }

      replacement.textContent = textVal;

      let inlineStyle = '';
      for (const prop of CRITICAL_CSS_PROPERTIES) {
        const val = computed.getPropertyValue(prop);
        if (val && val !== 'initial' && val !== 'inherit') {
          inlineStyle += `${prop}:${val};`;
        }
      }

      inlineStyle += `white-space: ${tag === 'textarea' ? 'pre-wrap' : 'nowrap'}; overflow: hidden; text-overflow: ellipsis; word-break: break-word;`;
      replacement.setAttribute('style', inlineStyle);

      target.parentNode?.replaceChild(replacement, target);
    } else {
      let inlineStyle = '';
      for (const prop of CRITICAL_CSS_PROPERTIES) {
        const val = computed.getPropertyValue(prop);
        if (val && val !== 'initial' && val !== 'inherit') {
          inlineStyle += `${prop}:${val};`;
        }
      }
      target.setAttribute('style', inlineStyle);
    }
  });

  return clone;
}

function freezeSvgStyles(origSvg: SVGElement, clonedSvg: SVGElement) {
  const origEls = Array.from(origSvg.querySelectorAll('*'));
  const cloneEls = Array.from(clonedSvg.querySelectorAll('*'));

  origEls.forEach((orig, idx) => {
    const target = cloneEls[idx] as HTMLElement | SVGElement;
    if (!target) return;

    const computed = window.getComputedStyle(orig);
    const tag = orig.tagName.toLowerCase();

    if (computed.fill && computed.fill !== 'none') {
      target.setAttribute('fill', computed.fill);
    }
    if (computed.stroke && computed.stroke !== 'none') {
      target.setAttribute('stroke', computed.stroke);
    }
    if (computed.strokeWidth) {
      target.setAttribute('stroke-width', computed.strokeWidth);
    }
    if (computed.strokeDasharray && computed.strokeDasharray !== 'none') {
      target.setAttribute('stroke-dasharray', computed.strokeDasharray);
    }

    if (tag === 'text') {
      target.setAttribute('fill', computed.fill !== 'none' && computed.fill !== 'rgba(0, 0, 0, 0)' ? computed.fill : computed.color);
    }

    if (tag === 'svg') {
      target.setAttribute('width', computed.width);
      target.setAttribute('height', computed.height);
    }

    target.setAttribute(
      'style',
      `font-family:${computed.fontFamily}; font-size:${computed.fontSize}; font-weight:${computed.fontWeight}; color:${computed.color};`
    );
  });
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

  const padding = 50;
  minX = Math.floor(minX - padding);
  minY = Math.floor(minY - padding);
  maxX = Math.ceil(maxX + padding);
  maxY = Math.ceil(maxY + padding);

  const exportWidth = Math.max(Math.ceil(maxX - minX), 400);
  const exportHeight = Math.max(Math.ceil(maxY - minY), 300);

  const clonedNodesWrapper = cloneAndFreezeNodeTree(nodesWrapper);
  clonedNodesWrapper.style.transform = `translate(${-minX}px, ${-minY}px)`;
  clonedNodesWrapper.style.position = 'absolute';
  clonedNodesWrapper.style.top = '0';
  clonedNodesWrapper.style.left = '0';
  clonedNodesWrapper.style.width = `${exportWidth}px`;
  clonedNodesWrapper.style.height = `${exportHeight}px`;

  const clonedSvg = svgElement.cloneNode(true) as SVGElement;
  clonedSvg.style.transform = `translate(${-minX}px, ${-minY}px)`;
  clonedSvg.setAttribute('width', `${exportWidth}`);
  clonedSvg.setAttribute('height', `${exportHeight}`);
  freezeSvgStyles(svgElement, clonedSvg);

  const xmlSerializer = new XMLSerializer();
  const svgEdgesString = xmlSerializer.serializeToString(clonedSvg);
  const nodesXhtmlString = xmlSerializer.serializeToString(clonedNodesWrapper);

  const combinedSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${exportWidth}" height="${exportHeight}">
      <defs>
        <style>
          * {
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          body, div, span, text {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          code, kbd, pre, select, input, textarea {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          }
        </style>
      </defs>
      <g>
        ${svgEdgesString}
      </g>
      <foreignObject width="${exportWidth}" height="${exportHeight}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${exportWidth}px; height:${exportHeight}px; position:relative; background:transparent;">
          ${nodesXhtmlString}
        </div>
      </foreignObject>
    </svg>
  `;

  const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(combinedSvg);

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const scaleFactor = 3;
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(exportWidth * scaleFactor);
      canvas.height = Math.ceil(exportHeight * scaleFactor);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
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
      console.error('Failed to load SVG image during PNG export:', err);
      resolve(null);
    };

    image.src = svgDataUrl;
  });
}
