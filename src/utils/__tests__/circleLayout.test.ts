import { computeCirclePositions } from '../circleLayout';

describe('computeCirclePositions', () => {
  it('returns as many positions as requested', () => {
    expect(computeCirclePositions(6, 100, { x: 0, y: 0 })).toHaveLength(6);
  });

  it('returns an empty array for zero letters', () => {
    expect(computeCirclePositions(0, 100, { x: 0, y: 0 })).toEqual([]);
  });

  it('places the first position directly above the center', () => {
    const [first] = computeCirclePositions(4, 100, { x: 50, y: 50 });
    expect(first.x).toBeCloseTo(50);
    expect(first.y).toBeCloseTo(-50);
  });

  it('spaces positions evenly around the circle at the given radius', () => {
    const center = { x: 0, y: 0 };
    const radius = 10;
    const positions = computeCirclePositions(4, radius, center);

    for (const p of positions) {
      const distanceFromCenter = Math.sqrt((p.x - center.x) ** 2 + (p.y - center.y) ** 2);
      expect(distanceFromCenter).toBeCloseTo(radius);
    }

    // 4 points 90 degrees apart starting at top: top, right, bottom, left
    expect(positions[1].x).toBeCloseTo(radius);
    expect(positions[1].y).toBeCloseTo(0);
    expect(positions[2].x).toBeCloseTo(0);
    expect(positions[2].y).toBeCloseTo(radius);
  });
});
