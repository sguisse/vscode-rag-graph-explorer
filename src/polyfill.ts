// Comprehensive Node.js global polyfill for DOM objects accessed during extension activation
const g: any = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : this);

function createDummyElement() {
  return {
    style: {},
    setAttribute: () => {},
    getAttribute: () => null,
    removeAttribute: () => {},
    appendChild: (child: any) => child,
    removeChild: () => {},
    replaceChild: () => {},
    insertBefore: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementsByTagName: () => [],
    getElementsByClassName: () => [],
    contains: () => false,
    classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
    ownerDocument: null,
    nodeType: 1,
    nodeName: 'DIV',
    childNodes: [],
    children: [],
  };
}

const mockDocument = {
  createElement: () => createDummyElement(),
  createElementNS: () => createDummyElement(),
  createTextNode: () => ({ style: {} }),
  createComment: () => ({}),
  createDocumentFragment: () => createDummyElement(),
  getElementsByTagName: () => [],
  getElementsByClassName: () => [],
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  documentElement: createDummyElement(),
  head: createDummyElement(),
  body: createDummyElement(),
  location: { href: '', search: '', pathname: '', hash: '', host: '', hostname: '' },
  cookie: '',
  referrer: '',
  activeElement: null,
  styleSheets: [],
};

if (typeof g.document === 'undefined') {
  g.document = mockDocument;
  if (typeof global !== 'undefined') (global as any).document = mockDocument;
}

if (typeof g.window === 'undefined') {
  g.window = g;
  if (typeof global !== 'undefined') (global as any).window = g;
}

if (typeof g.navigator === 'undefined') {
  const nav = { userAgent: 'node', platform: 'node', appVersion: 'node' };
  g.navigator = nav;
  if (typeof global !== 'undefined') (global as any).navigator = nav;
}

if (typeof g.HTMLElement === 'undefined') {
  class HTMLElement {}
  g.HTMLElement = HTMLElement;
  if (typeof global !== 'undefined') (global as any).HTMLElement = HTMLElement;
}

if (typeof g.Element === 'undefined') {
  class Element {}
  g.Element = Element;
  if (typeof global !== 'undefined') (global as any).Element = Element;
}

if (typeof g.Node === 'undefined') {
  class Node {}
  g.Node = Node;
  if (typeof global !== 'undefined') (global as any).Node = Node;
}

if (typeof g.customElements === 'undefined') {
  const ce = { get: () => undefined, define: () => {} };
  g.customElements = ce;
  if (typeof global !== 'undefined') (global as any).customElements = ce;
}

if (typeof g.getComputedStyle === 'undefined') {
  const gcs = () => ({ getPropertyValue: () => '', setProperty: () => {} });
  g.getComputedStyle = gcs;
  if (typeof global !== 'undefined') (global as any).getComputedStyle = gcs;
}
