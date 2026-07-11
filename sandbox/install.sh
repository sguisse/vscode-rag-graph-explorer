#!/bin/bash
# Fix the syntax error by adding the missing comma after the 'notification' parameter in destructuring

awk '
/^[ \t]*notification[ \t]*\r?$/ {
    print "  notification,"
    next
}
{ print }
' src/components/app/layout/AppLayout.tsx > tmp_layout.tsx && mv tmp_layout.tsx src/components/app/layout/AppLayout.tsx

# Verify the build passes
npm run build

echo "✅ fix: Added missing comma in AppLayout.tsx props destructuring to resolve the Vite build error!"
