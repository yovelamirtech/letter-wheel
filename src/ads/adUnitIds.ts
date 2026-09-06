import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

// Google's official test ad unit IDs - always show real test ads that are
// safe to click, never live ads. Replace with the real banner IDs from your
// own AdMob account before publishing (see README instructions).
const REAL_BANNER_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-REPLACE_ME/REPLACE_ME',
  android: 'ca-app-pub-REPLACE_ME/REPLACE_ME',
  default: TestIds.BANNER,
});

export const BANNER_AD_UNIT_ID = __DEV__ ? TestIds.BANNER : REAL_BANNER_AD_UNIT_ID;
