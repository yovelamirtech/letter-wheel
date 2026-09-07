import AsyncStorage from '@react-native-async-storage/async-storage';
import { hasSeenExplanation, markExplanationSeen } from '../onboarding';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('hasSeenExplanation', () => {
  it('is false when nothing has been stored yet', async () => {
    expect(await hasSeenExplanation()).toBe(false);
  });

  it('is true after markExplanationSeen was called', async () => {
    await markExplanationSeen();
    expect(await hasSeenExplanation()).toBe(true);
  });

  it('is false for any stored value other than the string "true"', async () => {
    await AsyncStorage.setItem('hebrew-word-game:hasSeenExplanation:v1', 'false');
    expect(await hasSeenExplanation()).toBe(false);
  });
});
