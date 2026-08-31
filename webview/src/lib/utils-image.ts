import { imageApiService } from "@/services/api/image-api.service.gen";
import { vsCodeApiService } from "@/services/api/vs-code-api.service.gen";
import { logError } from '@/services/view/log-view.service.wrapper';

export const LOGO_MAX_LIGHT_PATH = 'assets/logo-max-light.png';
export const LOGO_MAX_DARK_PATH = 'assets/logo-max-dark.png';
export const LOGO_LIGHT_PATH = 'assets/logo-light.png';
export const LOGO_DARK_PATH = 'assets/logo-dark.png';

export async function resolveIconUrlAsync(iconPath?: string): Promise<string> {
  if (!iconPath) return '';

  if (iconPath.startsWith('data:')) {
    return iconPath;
  }

  try {
    const base64Data = await imageApiService.readImageAsBase64(iconPath);
    if (base64Data) {
      return base64Data;
    }
  } catch (err) {
    logError(`[utils-image] Failed to read image via backend service: ${iconPath}`, err as Error);
  }

  return iconPath;
}
