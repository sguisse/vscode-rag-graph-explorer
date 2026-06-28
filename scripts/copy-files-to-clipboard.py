#!/usr/bin/env python3
import sys
import os
import json
import subprocess

def configureOutputEncoding():
    """Force UTF-8 output for Windows pipes and terminals."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")


configureOutputEncoding()


def copyFilesToClipboard(filePaths):
    if not filePaths:
        return

    platform = sys.platform
    if platform == 'darwin':
        # JXA pur via stdin : Évite les doublons (1 seul writeObjects) et contourne les limites de taille shell
        jxa_script = f"""
        ObjC.import('AppKit');
        var pb = $.NSPasteboard.generalPasteboard;
        pb.clearContents;

        var paths = {json.dumps(filePaths)};
        var urls = $.NSMutableArray.alloc.init;
        for (var i = 0; i < paths.length; i++) {{
            urls.addObject($.NSURL.fileURLWithPath(paths[i]));
        }}

        // Use strictly NSURL objects to prevent Finder duplications
        pb.writeObjects(urls);

        // Keep process alive momentarily to let the OS Pasteboard server absorb the data
        $.NSThread.sleepForTimeInterval(0.5);
        """

        subprocess.run(['osascript', '-l', 'JavaScript', '-'], input=jxa_script.encode('utf-8'), check=True)

    elif platform == 'win32':
        powershell_script = r"""
$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Windows.Forms

$paths = [Console]::In.ReadToEnd() | ConvertFrom-Json
$fileDropList = New-Object System.Collections.Specialized.StringCollection

foreach ($path in @($paths)) {
    if ([string]::IsNullOrWhiteSpace($path)) {
        continue
    }
    [void]$fileDropList.Add([System.IO.Path]::GetFullPath($path))
}

$lastError = $null
for ($attempt = 0; $attempt -lt 10; $attempt++) {
    try {
        [System.Windows.Forms.Clipboard]::SetFileDropList($fileDropList)
        $actualCount = [System.Windows.Forms.Clipboard]::GetFileDropList().Count
        if ($actualCount -eq $fileDropList.Count) {
            exit 0
        }
        $lastError = "Clipboard file drop count mismatch: expected $($fileDropList.Count), found $actualCount."
    } catch {
        $lastError = $_.Exception.Message
    }
    Start-Sleep -Milliseconds 100
}

throw $lastError
"""
        subprocess.run(
            ["powershell.exe", "-NoProfile", "-Sta", "-ExecutionPolicy", "Bypass", "-Command", powershell_script],
            input=json.dumps(filePaths).encode('utf-8'),
            check=True
        )

    else:
        uris = "\n".join([f"file://{p}" for p in filePaths])
        subprocess.run(["xclip", "-selection", "clipboard", "-t", "text/uri-list", "-i"], input=uris.encode('utf-8'), check=True)

def main():
    if len(sys.argv) < 2:
        sys.exit(1)

    input_file = sys.argv[1]
    if not os.path.exists(input_file):
        sys.exit(1)

    try:
        with open(input_file, 'r', encoding='utf-8-sig') as f:
            file_paths = json.load(f)

        copyFilesToClipboard(file_paths)
        print(f"[SUCCESS] Successfully copied {len(file_paths)} file(s) to the OS clipboard.")
    except Exception as e:
        print(f"Error copying to clipboard: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
