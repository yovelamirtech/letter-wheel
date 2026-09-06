import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Level, StoredProgress } from '../types';
import { LEVELS } from '../data/levels';
import { loadProgress, saveProgress, clearProgress, addFoundWordToProgress, getFoundWordsForLevel } from '../utils/progress';
import { hasSeenExplanation, markExplanationSeen } from '../utils/onboarding';
import { loadSettings } from '../utils/settings';
import { useAppFonts } from '../utils/fonts';
import SplashScreen from './SplashScreen';
import ExplanationScreen from './ExplanationScreen';
import SettingsScreen from './SettingsScreen';
import LevelSelectScreen from './LevelSelectScreen';
import GameScreen from './GameScreen';
import BottomBannerAd from '../components/BottomBannerAd';
import { initializeAds } from '../ads/adsInit';

type Screen =
  | { name: 'splash' }
  | { name: 'explanation' }
  // ההגדרות נגישות מכמה מסכים, ולכן הן זוכרות לאן לחזור במקום
  // ליפול תמיד למסך הפתיחה
  | { name: 'settings'; returnTo: Screen }
  | { name: 'levels' }
  | { name: 'game'; level: Level };

export default function AppRoot() {
  const [progress, setProgress] = useState<StoredProgress | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: 'splash' });
  const fontsReady = useAppFonts();

  useEffect(() => {
    loadProgress().then(setProgress);
    loadSettings();
    initializeAds();
  }, []);

  async function handleResetProgress() {
    await clearProgress();
    setProgress({ totalScore: 0, foundWordsByLevel: {} });
  }

  async function handleStart() {
    // מסך ההסבר מוצג רק בפעם הראשונה שלוחצים "בואו נתחיל" - אחרי זה
    // קופצים ישר לרשימת השלבים. הדגל נשמר ב-AsyncStorage, לא רק בזיכרון,
    // כדי שזה יישאר ככה גם בהפעלה הבאה של האפליקציה.
    const seen = await hasSeenExplanation();
    if (seen) {
      setScreen({ name: 'levels' });
    } else {
      setScreen({ name: 'explanation' });
    }
  }

  async function handleExplanationDone() {
    await markExplanationSeen();
    setScreen({ name: 'levels' });
  }

  function handleWordFound(levelIndex: number, word: string, scoreGained: number) {
    setProgress((prev) => {
      if (!prev) return prev;
      const next = addFoundWordToProgress(prev, levelIndex, word, scoreGained);
      saveProgress(next); // לא מחכים (fire-and-forget) - ה-UI כבר התעדכן אופטימית
      return next;
    });
  }

  let content: React.ReactNode;

  if (!fontsReady) {
    // מחכים לפונטים לפני הרינדור הראשון, אחרת מסך הפתיחה מוצג לרגע
    // בפונט ברירת המחדל ואז "קופץ" לפונט הנכון.
    content = (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3A2E1F" />
      </View>
    );
  } else if (screen.name === 'splash') {
    // מסך הפתיחה מוצג מיד, בלי לחכות לטעינת AsyncStorage - אין בו
    // תלות בהתקדמות שמורה, אז אין סיבה להשהות אותו.
    content = (
      <SplashScreen
        onStart={handleStart}
        onOpenSettings={() => setScreen({ name: 'settings', returnTo: { name: 'splash' } })}
      />
    );
  } else if (screen.name === 'explanation') {
    content = <ExplanationScreen onDone={handleExplanationDone} />;
  } else if (screen.name === 'settings') {
    const returnTo = screen.returnTo;
    content = (
      <SettingsScreen
        onBack={() => setScreen(returnTo)}
        onResetProgress={handleResetProgress}
      />
    );
  } else if (!progress) {
    // טעינת ההתקדמות מ-AsyncStorage היא אסינכרונית - מסך המתנה קצרצר
    // עד שהיא מסתיימת, כדי לא להבזיק "0 נקודות" לפני שהנתון האמיתי נטען
    content = (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3A2E1F" />
      </View>
    );
  } else if (screen.name === 'game') {
    const level = screen.level;
    content = (
      <GameScreen
        // ה-key מכריח מחדש (remount) כשעוברים בין שלבים שונים, כדי שה-state
        // הפנימי של GameScreen (המילה שנבנית, המעגל וכו') יתאפס נקי
        key={level.index}
        level={level}
        initialFoundWords={getFoundWordsForLevel(progress, level.index)}
        onWordFound={(word, score) => handleWordFound(level.index, word, score)}
        onBack={() => setScreen({ name: 'levels' })}
        onOpenSettings={() => setScreen({ name: 'settings', returnTo: { name: 'game', level } })}
      />
    );
  } else {
    content = (
      <LevelSelectScreen
        levels={LEVELS}
        progress={progress}
        onSelectLevel={(level) => setScreen({ name: 'game', level })}
        onBackToSplash={() => setScreen({ name: 'splash' })}
        onOpenSettings={() => setScreen({ name: 'settings', returnTo: { name: 'levels' } })}
      />
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.content}>{content}</View>
      <BottomBannerAd />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
  },
});
