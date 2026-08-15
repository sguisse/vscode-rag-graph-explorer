#!/usr/bin/env bash
set -e

echo "🎨 Externalizing Light & Dark color palettes into separate CSS files..."

# ==============================================================================
# Step 1: Create webview/src/color-light-palette.css
# ==============================================================================
cat << 'EOF' > webview/src/color-light-palette.css
:root {
  /* --- Light Palette Scale Definitions --- */
  --gray-0: #F2F5F3;
  --gray-1: #E4EBE6;
  --gray-2: #D2D9D4;
  --gray-3: #C4CCC6;
  --gray-4: #B6BFB8;
  --gray-5: #96A199;
  --gray-6: #77827A;
  --gray-7: #58635B;
  --gray-8: #353D37;
  --gray-9: #191F1B;

  --blue-0: #DDF4FF;
  --blue-1: #BCECFF;
  --blue-2: #8DD6FF;
  --blue-3: #5FB9FF;
  --blue-4: #3094FF;
  --blue-5: #0377FF;
  --blue-6: #0055D5;
  --blue-7: #0040A7;
  --blue-8: #002F7A;
  --blue-9: #001C4D;

  --green-0: #EBF9F4;
  --green-1: #BFFFD1;
  --green-2: #8CF2A6;
  --green-3: #5FED83;
  --green-4: #23EA57;
  --green-5: #0FBF3E;
  --green-6: #08872B;
  --green-7: #0D6731;
  --green-8: #0E4A2E;
  --green-9: #0D3024;

  --yellow-0: #FFF8C5;
  --yellow-1: #FFE777;
  --yellow-2: #FFD743;
  --yellow-3: #FABF21;
  --yellow-4: #DB9D00;
  --yellow-5: #BE7D00;
  --yellow-6: #A06100;
  --yellow-7: #824800;
  --yellow-8: #653200;
  --yellow-9: #471F00;

  --orange-0: #FFF1E5;
  --orange-1: #FCCEAB;
  --orange-2: #F4A876;
  --orange-3: #F08A3A;
  --orange-4: #DA7210;
  --orange-5: #B85B06;
  --orange-6: #954502;
  --orange-7: #703100;
  --orange-8: #5C2300;
  --orange-9: #471700;

  --red-0: #FFEBE9;
  --red-1: #FFCECB;
  --red-2: #FFABA8;
  --red-3: #FF8182;
  --red-4: #FA4549;
  --red-5: #CF2230;
  --red-6: #AE0B29;
  --red-7: #860620;
  --red-8: #730019;
  --red-9: #420011;

  --purple-0: #F0E5FF;
  --purple-1: #DBBFFD;
  --purple-2: #C898FD;
  --purple-3: #B870FF;
  --purple-4: #9F51FA;
  --purple-5: #8534F3;
  --purple-6: #6619E1;
  --purple-7: #43179E;
  --purple-8: #26115F;
  --purple-9: #160048;

  --pink-0: #FFF0FC;
  --pink-1: #FFC9F2;
  --pink-2: #F67ED2;
  --pink-3: #FF80D2;
  --pink-4: #FF4AC0;
  --pink-5: #EF2AA4;
  --pink-6: #CA2186;
  --pink-7: #952866;
  --pink-8: #651643;
  --pink-9: #3D0A28;

  --coral-0: #FFF0EB;
  --coral-1: #FFCAB8;
  --coral-2: #FFA387;
  --coral-3: #FF7B56;
  --coral-4: #FE4C25;
  --coral-5: #E13F1B;
  --coral-6: #C53211;
  --coral-7: #A22710;
  --coral-8: #801E0F;
  --coral-9: #500A00;

  --lemon-0: #FDF5B3;
  --lemon-1: #F5E36B;
  --lemon-2: #F2DA3B;
  --lemon-3: #E1C50F;
  --lemon-4: #C7A60B;
  --lemon-5: #A98906;
  --lemon-6: #806803;
  --lemon-7: #614D01;
  --lemon-8: #413200;
  --lemon-9: #322400;

  --lime-0: #F3FEC8;
  --lime-1: #E8FC97;
  --lime-2: #DCFA67;
  --lime-3: #D1F441;
  --lime-4: #B2DE28;
  --lime-5: #92C219;
  --lime-6: #698E17;
  --lime-7: #425E13;
  --lime-8: #2C440B;
  --lime-9: #182C01;

  --teal-0: #DAF9F5;
  --teal-1: #A4EFE8;
  --teal-2: #6EE5DC;
  --teal-3: #39DAD2;
  --teal-4: #23B1AE;
  --teal-5: #197B7B;
  --teal-6: #136061;
  --teal-7: #024B4D;
  --teal-8: #083D3D;
  --teal-9: #052B2C;

  --indigo-0: #EFF2FF;
  --indigo-1: #D4DBFF;
  --indigo-2: #B3C1FD;
  --indigo-3: #8E9DF7;
  --indigo-4: #6B7BEF;
  --indigo-5: #4956E5;
  --indigo-6: #2D3DD7;
  --indigo-7: #262DAE;
  --indigo-8: #212183;
  --indigo-9: #12144F;

  --black-0: #000000;
  --white-0: #ffffff;

  /* --- Semantic Mappings (Light Mode) --- */
  --background: var(--white-0);
  --foreground: var(--gray-8);
  --card: var(--white-0);
  --card-foreground: var(--gray-8);
  --card-spacing: 2px;
  --popover: var(--white-0);
  --popover-foreground: var(--gray-8);
  --primary: var(--blue-5);
  --primary-foreground: var(--white-0);
  --secondary: var(--gray-0);
  --secondary-foreground: var(--gray-7);
  --muted: var(--gray-0);
  --muted-foreground: var(--gray-6);
  --accent: var(--blue-0);
  --accent-foreground: var(--blue-8);
  --border: var(--gray-1);
  --input: var(--gray-1);
  --ring: var(--blue-5);
  --chart-1: var(--blue-5);
  --chart-2: var(--teal-4);
  --chart-3: var(--indigo-5);
  --chart-4: var(--orange-4);
  --chart-5: var(--purple-4);
  --sidebar: var(--gray-0);
  --sidebar-foreground: var(--gray-9);
  --sidebar-primary: var(--gray-8);
  --sidebar-primary-foreground: var(--gray-0);
  --sidebar-accent: var(--blue-0);
  --sidebar-accent-foreground: var(--blue-5);
  --sidebar-border: var(--gray-2);
  --sidebar-ring: var(--blue-5);

  --success: var(--green-0);
  --success-foreground: var(--green-7);

  --destructive: var(--red-0);
  --destructive-foreground: var(--red-6);

  --warning: var(--yellow-0);
  --warning-foreground: var(--yellow-7);

  --info: var(--blue-0);
  --info-foreground: var(--blue-7);

  --user-bg: var(--blue-0);
  --user-border: var(--blue-2);

  --radius: 0.625rem;
}
EOF

# ==============================================================================
# Step 2: Create webview/src/color-dark-palette.css
# ==============================================================================
cat << 'EOF' > webview/src/color-dark-palette.css
.dark {
  /* --- Dark Palette Scale Definitions --- */
  --gray-0: #D2D9D4;
  --gray-1: #C4CCC6;
  --gray-2: #A4AEA6;
  --gray-3: #7C8980;
  --gray-4: #58635B;
  --gray-5: #353D37;
  --gray-6: #262C28;
  --gray-7: #191F1B;
  --gray-8: #0F1511;
  --gray-9: #060907;

  --blue-0: #C2EDFF;
  --blue-1: #A2DAFF;
  --blue-2: #78BAFE;
  --blue-3: #3094FF;
  --blue-4: #0377FF;
  --blue-5: #0A50DB;
  --blue-6: #1530B7;
  --blue-7: #082A8F;
  --blue-8: #052063;
  --blue-9: #000839;

  --green-0: #CDFCD9;
  --green-1: #8CF2A6;
  --green-2: #5FED83;
  --green-3: #23EA57;
  --green-4: #0FBF3E;
  --green-5: #08872B;
  --green-6: #0D6731;
  --green-7: #0E422C;
  --green-8: #0D3024;
  --green-9: #0A241B;

  --yellow-0: #F8E3A1;
  --yellow-1: #F7D162;
  --yellow-2: #FABF21;
  --yellow-3: #DB9D00;
  --yellow-4: #BE7D00;
  --yellow-5: #A06100;
  --yellow-6: #834800;
  --yellow-7: #653200;
  --yellow-8: #471F00;
  --yellow-9: #2A1000;

  --orange-0: #FFE2CC;
  --orange-1: #FAB580;
  --orange-2: #F08A3A;
  --orange-3: #EA7110;
  --orange-4: #D56101;
  --orange-5: #B35101;
  --orange-6: #924100;
  --orange-7: #703100;
  --orange-8: #572400;
  --orange-9: #3D1800;

  --red-0: #FFD9D6;
  --red-1: #FEB2AE;
  --red-2: #FD8986;
  --red-3: #FC5C5D;
  --red-4: #FA383D;
  --red-5: #D31231;
  --red-6: #AE0B29;
  --red-7: #860620;
  --red-8: #5E0217;
  --red-9: #33000D;

  --purple-0: #EADBFF;
  --purple-1: #D3B3FE;
  --purple-2: #C08BFC;
  --purple-3: #A665F9;
  --purple-4: #8B40F5;
  --purple-5: #6619E1;
  --purple-6: #43179E;
  --purple-7: #26115F;
  --purple-8: #160048;
  --purple-9: #0E022C;

  --pink-0: #FFDBF7;
  --pink-1: #FCABE7;
  --pink-2: #F67ED2;
  --pink-3: #ED55BA;
  --pink-4: #E22D9F;
  --pink-5: #CA2186;
  --pink-6: #961C66;
  --pink-7: #741550;
  --pink-8: #520E39;
  --pink-9: #30081F;

  --coral-0: #FFD5C7;
  --coral-1: #FDB7A1;
  --coral-2: #FA9072;
  --coral-3: #F66945;
  --coral-4: #EF4319;
  --coral-5: #C53211;
  --coral-6: #A22710;
  --coral-7: #801E0F;
  --coral-8: #500A00;
  --coral-9: #3C0000;

  --lemon-0: #FCF2A5;
  --lemon-1: #F9E76A;
  --lemon-2: #F4DA38;
  --lemon-3: #E4C411;
  --lemon-4: #C7A60B;
  --lemon-5: #A98906;
  --lemon-6: #876A04;
  --lemon-7: #654D02;
  --lemon-8: #423101;
  --lemon-9: #241900;

  --lime-0: #EDFFC9;
  --lime-1: #DCFF96;
  --lime-2: #CDF041;
  --lime-3: #B1E119;
  --lime-4: #88B80F;
  --lime-5: #608A10;
  --lime-6: #3E5F0F;
  --lime-7: #22360B;
  --lime-8: #142A08;
  --lime-9: #091D05;

  --teal-0: #CFF7F2;
  --teal-1: #99F1E8;
  --teal-2: #61EEE3;
  --teal-3: #26EDE2;
  --teal-4: #10DCD4;
  --teal-5: #0BBAB6;
  --teal-6: #079695;
  --teal-7: #047172;
  --teal-8: #024B4D;
  --teal-9: #052D2E;

  --indigo-0: #DBE3FF;
  --indigo-1: #B3C1FD;
  --indigo-2: #8D9FF8;
  --indigo-3: #6A7DF0;
  --indigo-4: #4A5CE5;
  --indigo-5: #2D3DD7;
  --indigo-6: #232FB3;
  --indigo-7: #212183;
  --indigo-8: #161962;
  --indigo-9: #0D103F;

  --black-0: #000000;
  --white-0: #ffffff;

  /* --- Semantic Mappings (Dark Mode) --- */
  --background: var(--gray-7);
  --foreground: var(--gray-0);
  --card: var(--gray-6);
  --card-foreground: var(--gray-0);
  --card-spacing: 5px;
  --popover: var(--gray-6);
  --popover-foreground: var(--gray-0);
  --primary: var(--blue-3);
  --primary-foreground: var(--white-0);
  --secondary: var(--gray-6);
  --secondary-foreground: var(--gray-0);
  --muted: var(--gray-6);
  --muted-foreground: var(--gray-2);
  --accent: var(--blue-7);
  --accent-foreground: var(--blue-1);
  --border: var(--gray-5);
  --input: var(--gray-5);
  --ring: var(--blue-3);
  --chart-1: var(--blue-3);
  --chart-2: var(--teal-3);
  --chart-3: var(--indigo-3);
  --chart-4: var(--orange-3);
  --chart-5: var(--purple-3);
  --sidebar: var(--gray-7);
  --sidebar-foreground: var(--gray-0);
  --sidebar-primary: var(--blue-3);
  --sidebar-primary-foreground: var(--white-0);
  --sidebar-accent: var(--blue-8);
  --sidebar-accent-foreground: var(--blue-1);
  --sidebar-border: var(--gray-6);
  --sidebar-ring: var(--blue-3);

  --success: var(--green-9);
  --success-foreground: var(--green-1);

  --destructive: var(--red-9);
  --destructive-foreground: var(--red-2);

  --warning: var(--yellow-9);
  --warning-foreground: var(--yellow-1);

  --info: var(--blue-9);
  --info-foreground: var(--blue-1);

  --user-bg: var(--blue-9);
  --user-border: var(--blue-7);
}
EOF

# ==============================================================================
# Step 3: Update webview/src/index.css to import both palette files
# ==============================================================================
cat << 'EOF' > webview/src/index.css
@import "tailwindcss";

@source "./**/*.{ts,tsx,js,jsx,html}";

/* Use @import for CSS-first Tailwind v4 packages */
@import "tw-animate-css";

@import "@fontsource-variable/inter";
@import "@fontsource-variable/source-serif-4";
@import "@fontsource-variable/jetbrains-mono";
@import "shadcn/tailwind.css";

/* Externalized Light & Dark Palettes */
@import "./color-light-palette.css";
@import "./color-dark-palette.css";

@custom-variant dark (&:is(.dark *));

@theme {
  --font-sans: 'Inter Variable', system-ui, -apple-system, sans-serif;
  --font-heading: 'Inter Variable', system-ui, -apple-system, sans-serif;
  --font-body: 'Inter Variable', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, monospace;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --card-spacing: var(--card-spacing);

  /* Color scale registrations */
  --color-gray-0: var(--gray-0);
  --color-gray-1: var(--gray-1);
  --color-gray-2: var(--gray-2);
  --color-gray-3: var(--gray-3);
  --color-gray-4: var(--gray-4);
  --color-gray-5: var(--gray-5);
  --color-gray-6: var(--gray-6);
  --color-gray-7: var(--gray-7);
  --color-gray-8: var(--gray-8);
  --color-gray-9: var(--gray-9);

  --color-blue-0: var(--blue-0);
  --color-blue-1: var(--blue-1);
  --color-blue-2: var(--blue-2);
  --color-blue-3: var(--blue-3);
  --color-blue-4: var(--blue-4);
  --color-blue-5: var(--blue-5);
  --color-blue-6: var(--blue-6);
  --color-blue-7: var(--blue-7);
  --color-blue-8: var(--blue-8);
  --color-blue-9: var(--blue-9);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  html {
    font-family: var(--font-sans);
    @apply font-sans;
  }
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans);
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  /* Prime Scrollback & Scrollbar Style - Dark Mode */
  .dark {
    scrollbar-width: thin;
    scrollbar-color: var(--gray-5) transparent;
  }

  .dark ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .dark ::-webkit-scrollbar-track {
    background: transparent;
  }

  .dark ::-webkit-scrollbar-thumb {
    background-color: var(--gray-5);
    border-radius: 9999px;
    border: 1px solid transparent;
    background-clip: content-box;
    transition: background-color 0.2s ease;
  }

  .dark ::-webkit-scrollbar-thumb:hover {
    background-color: var(--blue-4);
  }

  .dark ::-webkit-scrollbar-corner {
    background: transparent;
  }
}

@theme inline {
  --font-heading: var(--font-sans);
  --font-sans: 'Inter Variable', sans-serif;
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --color-foreground: var(--foreground);
  --color-background: var(--background);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}
EOF

echo "✅ feat: Externalized color palettes into color-light-palette.css and color-dark-palette.css, imported by index.css!"
npm run compile
