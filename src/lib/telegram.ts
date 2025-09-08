// Telegram Web App API types and utilities
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
    };
    chat?: {
      id: number;
      type: string;
      title?: string;
      username?: string;
    };
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
    setParams(params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  ready(): void;
  expand(): void;
  close(): void;
  sendData(data: string): void;
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  showPopup(params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text?: string;
    }>;
  }, callback?: (buttonId: string) => void): void;
  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
  showScanQrPopup(params: {
    text?: string;
  }, callback?: (text: string) => boolean): void;
  closeScanQrPopup(): void;
  readTextFromClipboard(callback?: (text: string) => void): void;
  requestWriteAccess(callback?: (granted: boolean) => void): void;
  requestContact(callback?: (granted: boolean) => void): void;
  invokeCustomMethod(method: string, params: any, callback?: (error: string, result: any) => void): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export class TelegramWebAppService {
  private static instance: TelegramWebAppService;
  private webApp: TelegramWebApp | null = null;

  private constructor() {
    this.init();
  }

  static getInstance(): TelegramWebAppService {
    if (!TelegramWebAppService.instance) {
      TelegramWebAppService.instance = new TelegramWebAppService();
    }
    return TelegramWebAppService.instance;
  }

  private init() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webApp = window.Telegram.WebApp;
      this.webApp.ready();
      this.webApp.expand();
      
      // Set theme colors
      this.webApp.headerColor = '#7c3aed';
      this.webApp.backgroundColor = '#1e1b4b';
    }
  }

  getWebApp(): TelegramWebApp | null {
    return this.webApp;
  }

  getUser() {
    return this.webApp?.initDataUnsafe?.user || null;
  }

  getStartParam() {
    return this.webApp?.initDataUnsafe?.start_param || null;
  }

  isInTelegram(): boolean {
    return !!this.webApp;
  }

  showMainButton(text: string, onClick: () => void) {
    if (this.webApp) {
      this.webApp.MainButton.setText(text);
      this.webApp.MainButton.onClick(onClick);
      this.webApp.MainButton.show();
    }
  }

  hideMainButton() {
    if (this.webApp) {
      this.webApp.MainButton.hide();
    }
  }

  showBackButton(onClick: () => void) {
    if (this.webApp) {
      this.webApp.BackButton.onClick(onClick);
      this.webApp.BackButton.show();
    }
  }

  hideBackButton() {
    if (this.webApp) {
      this.webApp.BackButton.hide();
    }
  }

  hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection') {
    if (this.webApp) {
      if (type === 'success' || type === 'error' || type === 'warning') {
        this.webApp.HapticFeedback.notificationOccurred(type);
      } else if (type === 'selection') {
        this.webApp.HapticFeedback.selectionChanged();
      } else {
        this.webApp.HapticFeedback.impactOccurred(type);
      }
    }
  }

  showAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.webApp) {
        this.webApp.showAlert(message, () => resolve());
      } else {
        alert(message);
        resolve();
      }
    });
  }

  showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.webApp) {
        this.webApp.showConfirm(message, (confirmed) => resolve(confirmed));
      } else {
        resolve(confirm(message));
      }
    });
  }

  openLink(url: string) {
    if (this.webApp) {
      this.webApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  openTelegramLink(url: string) {
    if (this.webApp) {
      this.webApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  sendData(data: any) {
    if (this.webApp) {
      this.webApp.sendData(JSON.stringify(data));
    }
  }

  close() {
    if (this.webApp) {
      this.webApp.close();
    }
  }

  getThemeParams() {
    return this.webApp?.themeParams || {};
  }

  getColorScheme() {
    return this.webApp?.colorScheme || 'dark';
  }
}

export const telegramWebApp = TelegramWebAppService.getInstance();