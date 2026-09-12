import React from 'react';
import { Animated, GestureResponderHandlers, StyleSheet, Text, View } from 'react-native';
import { computeLineStyle } from '../utils/lineGeometry';
import { Point } from '../utils/circleLayout';
import { CircleTile } from '../hooks/useLetterCircle';
import { colors } from '../theme/colors';
import { FONTS } from '../utils/fonts';
import { shadows } from '../theme/shadows';

const LINE_THICKNESS = 6;

interface Props {
  circleSize: number;
  tileSize: number;
  tiles: CircleTile[];
  selectedPath: CircleTile[];
  dragPoint: Point | null;
  tileScales: Animated.Value[];
  tileOffsets: Animated.ValueXY[];
  panHandlers: GestureResponderHandlers;
}

// מעגל האותיות: קווי החיבור בין האותיות שנבחרו, קו "זנב" עד לאצבע, והאריחים
// עצמם. רכיב תצוגה טהור - כל לוגיקת הגרירה/הבחירה מגיעה מ-useLetterCircle.
export default function LetterCircle({
  circleSize,
  tileSize,
  tiles,
  selectedPath,
  dragPoint,
  tileScales,
  tileOffsets,
  panHandlers,
}: Props) {
  const selectedIndices = new Set(selectedPath.map((t) => t.index));

  return (
    <View style={[styles.circleContainer, { width: circleSize, height: circleSize }]} {...panHandlers}>
      {selectedPath.slice(1).map((tile, i) => {
        const from = selectedPath[i].point;
        const style = computeLineStyle(from, tile.point, LINE_THICKNESS);
        return <View key={`line-${i}`} style={[styles.line, style]} pointerEvents="none" />;
      })}
      {selectedPath.length > 0 && dragPoint && (
        <View
          style={[
            styles.line,
            styles.trailLine,
            computeLineStyle(selectedPath[selectedPath.length - 1].point, dragPoint, LINE_THICKNESS),
          ]}
          pointerEvents="none"
        />
      )}

      {tiles.map((tile) => {
        const isSelected = selectedIndices.has(tile.index);
        return (
          <Animated.View
            key={tile.index}
            style={[
              styles.letterTile,
              {
                width: tileSize,
                height: tileSize,
                borderRadius: tileSize / 2,
                left: tile.point.x - tileSize / 2,
                top: tile.point.y - tileSize / 2,
              },
              isSelected && styles.letterTileSelected,
              {
                transform: [
                  { translateX: tileOffsets[tile.index].x },
                  { translateY: tileOffsets[tile.index].y },
                  { scale: tileScales[tile.index] },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <Text
              style={[
                styles.letterText,
                { fontSize: Math.round(tileSize * 0.464) },
                isSelected && styles.letterTextSelected,
              ]}
            >
              {tile.char}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  circleContainer: {
    position: 'relative',
    marginVertical: 16,
  },
  line: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.line,
  },
  trailLine: {
    backgroundColor: colors.lineTrail,
  },
  letterTile: {
    position: 'absolute',
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.showcase,
  },
  letterTileSelected: {
    backgroundColor: colors.text,
  },
  letterText: {
    fontFamily: FONTS.bold,
    color: colors.text,
  },
  letterTextSelected: {
    color: colors.card,
  },
});
