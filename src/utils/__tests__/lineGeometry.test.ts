import { computeLineStyle, distance } from '../lineGeometry';

describe('distance', () => {
  it('computes the euclidean distance between two points', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('is zero for the same point', () => {
    expect(distance({ x: 2, y: 2 }, { x: 2, y: 2 })).toBe(0);
  });
});

describe('computeLineStyle', () => {
  it('sets width to the distance between the two points', () => {
    const style = computeLineStyle({ x: 0, y: 0 }, { x: 3, y: 4 }, 2);
    expect(style.width).toBeCloseTo(5);
  });

  it('positions the line at the "from" point, offset by half the thickness', () => {
    const style = computeLineStyle({ x: 10, y: 20 }, { x: 30, y: 20 }, 4);
    expect(style.left).toBe(10);
    expect(style.top).toBe(18);
  });

  it('rotates by 0 degrees for a horizontal line to the right', () => {
    const style = computeLineStyle({ x: 0, y: 0 }, { x: 10, y: 0 }, 1);
    expect(style.transform[0].rotate).toBe('0deg');
  });

  it('rotates by 90 degrees for a vertical line downward', () => {
    const style = computeLineStyle({ x: 0, y: 0 }, { x: 0, y: 10 }, 1);
    expect(style.transform[0].rotate).toBe('90deg');
  });

  it('always sets transformOrigin to the left-middle edge', () => {
    const style = computeLineStyle({ x: 0, y: 0 }, { x: 5, y: 5 }, 1);
    expect(style.transformOrigin).toBe('0% 50%');
  });
});
