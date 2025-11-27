// User settings management for local storage

export interface UserSettings {
  userAddress: string;
  costPerMile: number;
}

const SETTINGS_KEY = 'planit-user-settings';

const DEFAULT_SETTINGS: UserSettings = {
  userAddress: '',
  costPerMile: 0.67 // IRS standard mileage rate 2025
};

export function getUserSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading user settings:', error);
  }
  return DEFAULT_SETTINGS;
}

export function saveUserSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving user settings:', error);
  }
}
