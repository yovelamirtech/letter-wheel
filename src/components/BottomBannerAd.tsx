import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { BANNER_AD_UNIT_ID } from '../ads/adUnitIds';
import { colors } from '../theme/colors';

// באנר קבוע בתחתית המסך. אם הפרסומת נכשלת בטעינה (למשל בלי אינטרנט)
// הוא פשוט לא מציג כלום, ולא תופס מקום בפריסה.
export default function BottomBannerAd() {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
