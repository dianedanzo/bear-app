interface AdGramConfig {
  blockId: string;
  onReward?: () => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    Adsgram?: {
      init: (config: { blockId: string }) => {
        show: () => Promise<{ done: boolean; description: string; state: string }>;
      };
    };
  }
}

export class AdGramService {
  private static instance: AdGramService;
  private adController: any = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AdGramService {
    if (!AdGramService.instance) {
      AdGramService.instance = new AdGramService();
    }
    return AdGramService.instance;
  }

  async init(blockId: string): Promise<void> {
    if (this.isInitialized) return;

    // Load AdGram SDK
    if (!window.Adsgram) {
      await this.loadScript('https://sad.adsgram.ai/js/sad.min.js');
    }

    if (window.Adsgram) {
      this.adController = window.Adsgram.init({ blockId });
      this.isInitialized = true;
    } else {
      throw new Error('Failed to load AdGram SDK');
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  async showInterstitial(): Promise<{ success: boolean; error?: string }> {
    if (!this.adController) {
      return { success: false, error: 'AdGram not initialized' };
    }

    try {
      const result = await this.adController.show();
      return { success: result.done };
    } catch (error) {
      return { success: false, error: error.toString() };
    }
  }

  async showAd(blockId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Create new ad controller for specific block ID
      if (window.Adsgram) {
        const adController = window.Adsgram.init({ blockId });
        const result = await adController.show();
        return { success: result.done };
      } else {
        return { success: false, error: 'AdGram not available' };
      }
    } catch (error) {
      return { success: false, error: error.toString() };
    }
  }

  async showRewarded(blockId?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.adController) {
      return { success: false, error: 'AdGram not initialized' };
    }

    try {
      const result = await this.adController.show();
      return { success: result.done };
    } catch (error) {
      return { success: false, error: error.toString() };
    }
  }
}

// Environment variables for AdGram configuration
export const ADGRAM_CONFIG = {
  BLOCK_ID_1: import.meta.env.VITE_ADGRAM_BLOCK_ID_1 || 'int-14685',
  BLOCK_ID_2: import.meta.env.VITE_ADGRAM_BLOCK_ID_2 || 'int-14686',
  BLOCK_ID_3: import.meta.env.VITE_ADGRAM_BLOCK_ID_3 || 'int-14687',
};