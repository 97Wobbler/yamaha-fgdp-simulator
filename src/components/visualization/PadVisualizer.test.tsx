import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PadVisualizer } from './PadVisualizer';

// Mock the stores to avoid Tone.js issues in tests
vi.mock('../../stores/usePlaybackStore', () => ({
  usePlaybackStore: vi.fn((selector) => {
    const state = { isPlaying: false, currentStep: 0 };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../../stores/usePatternStore', () => ({
  usePatternStore: vi.fn((selector) => {
    const state = { currentPattern: null };
    return selector ? selector(state) : state;
  }),
}));

describe('PadVisualizer', () => {
  it('renders the pad visualizer container', () => {
    render(<PadVisualizer />);
    expect(screen.getByTestId('pad-visualizer')).toBeInTheDocument();
  });

  it('renders all 18 pads', () => {
    render(<PadVisualizer />);
    
    for (let i = 1; i <= 18; i++) {
      const pad = screen.getByTestId(`pad-${i}`);
      expect(pad).toBeInTheDocument();
    }
  });

  it('each pad has data-pad-index attribute with correct value', () => {
    render(<PadVisualizer />);
    
    for (let i = 1; i <= 18; i++) {
      const pad = screen.getByTestId(`pad-${i}`);
      expect(pad).toHaveAttribute('data-pad-index', String(i));
    }
  });

  it('renders SVG with correct viewBox', () => {
    render(<PadVisualizer />);
    
    const container = screen.getByTestId('pad-visualizer');
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '115 110 605 355');
    expect(svg).toHaveAttribute('aria-label', 'FGDP Pad Layout');
  });

  it('applies default class to all pads when no highlights', () => {
    render(<PadVisualizer />);
    
    for (let i = 1; i <= 18; i++) {
      const pad = screen.getByTestId(`pad-${i}`);
      expect(pad).toHaveClass('pad-default');
      expect(pad).not.toHaveClass('pad-highlighted');
    }
  });

  it('applies highlighted class to specified pads', () => {
    render(<PadVisualizer highlightedPads={[1, 5, 10]} />);
    
    // Highlighted pads
    expect(screen.getByTestId('pad-1')).toHaveClass('pad-highlighted');
    expect(screen.getByTestId('pad-5')).toHaveClass('pad-highlighted');
    expect(screen.getByTestId('pad-10')).toHaveClass('pad-highlighted');
    
    // Non-highlighted pads
    expect(screen.getByTestId('pad-2')).not.toHaveClass('pad-highlighted');
    expect(screen.getByTestId('pad-3')).not.toHaveClass('pad-highlighted');
  });

  it('handles empty highlightedPads array', () => {
    render(<PadVisualizer highlightedPads={[]} />);
    
    for (let i = 1; i <= 18; i++) {
      const pad = screen.getByTestId(`pad-${i}`);
      expect(pad).not.toHaveClass('pad-highlighted');
    }
  });
});

