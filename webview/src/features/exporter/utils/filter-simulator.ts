export function testFilterPatterns(
  testString: string,
  incPaths: string,
  excPaths: string,
  incExts: string,
  excExts: string
): { isMatched: boolean; reason: string } {
  if (!testString.trim()) {
    return { isMatched: false, reason: 'Empty test string' };
  }

  const clean = (val: string) =>
    val
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

  for (const pattern of clean(excPaths)) {
    try {
      if (new RegExp(pattern, 'i').test(testString)) {
        return { isMatched: false, reason: `Excluded by path regex: ${pattern}` };
      }
    } catch {}
  }

  for (const pattern of clean(excExts)) {
    try {
      if (new RegExp(pattern, 'i').test(testString)) {
        return { isMatched: false, reason: `Excluded by extension regex: ${pattern}` };
      }
    } catch {}
  }

  const incPathsList = clean(incPaths);
  if (incPathsList.length > 0) {
    let matchedPath = false;
    for (const pattern of incPathsList) {
      try {
        if (new RegExp(pattern, 'i').test(testString)) {
          matchedPath = true;
          break;
        }
      } catch {}
    }
    if (!matchedPath) {
      return { isMatched: false, reason: 'Does not match any include path pattern' };
    }
  }

  const incExtsList = clean(incExts);
  if (incExtsList.length > 0) {
    let matchedExt = false;
    for (const pattern of incExtsList) {
      try {
        if (new RegExp(pattern, 'i').test(testString)) {
          matchedExt = true;
          break;
        }
      } catch {}
    }
    if (!matchedExt) {
      return { isMatched: false, reason: 'Does not match any include extension pattern' };
    }
  }

  return { isMatched: true, reason: 'Matches all filter criteria' };
}
