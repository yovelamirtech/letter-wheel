import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isHapticEnabled,
  isSoundEffectsEnabled,
  loadSettings,
  setHapticEnabled,
  setSoundEffectsEnabled,
} from '../settings';

beforeEach(async () => {
  await AsyncStorage.clear();
  await loadSettings();
});

describe('loadSettings', () => {
  it('defaults to sound and haptics enabled when nothing is stored', async () => {
    const settings = await loadSettings();
    expect(settings).toEqual({ soundEffectsEnabled: true, hapticEnabled: true });
    expect(isSoundEffectsEnabled()).toBe(true);
    expect(isHapticEnabled()).toBe(true);
  });

  it('loads previously persisted values', async () => {
    await setSoundEffectsEnabled(false);
    await setHapticEnabled(false);

    // simulate a fresh app start reading from storage again
    const settings = await loadSettings();
    expect(settings).toEqual({ soundEffectsEnabled: false, hapticEnabled: false });
  });

  it('falls back to defaults for a malformed stored value', async () => {
    await AsyncStorage.setItem('hebrew-word-game:settings:v1', 'not json');
    const settings = await loadSettings();
    expect(settings).toEqual({ soundEffectsEnabled: true, hapticEnabled: true });
  });

  it('fills in missing fields from a partial stored value', async () => {
    await AsyncStorage.setItem(
      'hebrew-word-game:settings:v1',
      JSON.stringify({ soundEffectsEnabled: false })
    );
    const settings = await loadSettings();
    expect(settings).toEqual({ soundEffectsEnabled: false, hapticEnabled: true });
  });
});

describe('setSoundEffectsEnabled / setHapticEnabled', () => {
  it('updates the in-memory flag immediately', async () => {
    await setSoundEffectsEnabled(false);
    expect(isSoundEffectsEnabled()).toBe(false);

    await setHapticEnabled(false);
    expect(isHapticEnabled()).toBe(false);
  });

  it('persists the change so a reload sees it', async () => {
    await setHapticEnabled(false);
    const reloaded = await loadSettings();
    expect(reloaded.hapticEnabled).toBe(false);
  });
});
