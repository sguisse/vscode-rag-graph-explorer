export interface FilePathUI {
    absolutePath: string;
    relativePath: string;
    displayPath: string;
    fileName: string;
    fileExtension: string;
    isDirectory: boolean;
}

export function buildFilePathUI(rawPath: string): FilePathUI {
  const trimmed = rawPath.trim();
  if (!trimmed) {
    return {
      absolutePath: '',
      relativePath: '',
      displayPath: '',
      fileName: '',
      fileExtension: '',
      isDirectory: false,
    };
  }

  const isDirectory = trimmed.endsWith('/') || trimmed.endsWith('\\');
  const normalized = trimmed.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  const fileName = lastSlash >= 0 ? normalized.substring(lastSlash + 1) : normalized;
  const lastDot = fileName.lastIndexOf('.');
  const fileExtension = lastDot >= 0 ? fileName.substring(lastDot) : '';

  let displayPath = normalized;

  if (fileExtension.toLowerCase() === '.java') {
    let clean = normalized;
    const javaMarkers = [
      '/src/main/java/', 'src/main/java/',
      '/src/test/java/', 'src/test/java/',
      '/src/main/kotlin/', 'src/main/kotlin/',
      '/src/test/kotlin/', 'src/test/kotlin/'
    ];
    let foundMarker = false;
    for (const marker of javaMarkers) {
      const idx = clean.indexOf(marker);
      if (idx !== -1) {
        clean = clean.substring(idx + marker.length);
        foundMarker = true;
        break;
      }
    }
    if (!foundMarker) {
      const pkgMarkers = ['/com/', 'com/', '/org/', 'org/', '/net/', 'net/', '/io/', 'io/', '/fr/', 'fr/', '/de/', 'de/'];
      for (const marker of pkgMarkers) {
        const idx = clean.indexOf(marker);
        if (idx !== -1) {
          const cleanMarker = marker.startsWith('/') ? marker.substring(1) : marker;
          clean = cleanMarker + clean.substring(idx + marker.length);
          foundMarker = true;
          break;
        }
      }
    }
    clean = clean.replace(/\.java$/i, '').replace(/^\/+|\/+$/g, '');
    displayPath = clean.replace(/\//g, '.');
  } else {
    let clean = normalized;
    const srcMarkers = ['/src/', 'src/'];
    let foundSrc = false;
    for (const marker of srcMarkers) {
      const idx = clean.indexOf(marker);
      if (idx !== -1) {
        displayPath = clean.substring(idx + marker.length);
        foundSrc = true;
        break;
      }
    }
    if (!foundSrc) {
      displayPath = clean.replace(/^\/+/, '');
    }
  }

  return {
    absolutePath: trimmed,
    relativePath: normalized,
    displayPath,
    fileName,
    fileExtension,
    isDirectory,
  };
}
