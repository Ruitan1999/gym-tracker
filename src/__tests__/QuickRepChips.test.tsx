import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuickRepChips from '../components/workout/QuickRepChips';

describe('QuickRepChips', () => {
  it('renders a button for each value', () => {
    render(<QuickRepChips values={[5, 8, 10]} current="" onPick={() => {}} />);
    expect(screen.getByRole('button', { name: 'Set reps to 5' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Set reps to 8' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Set reps to 10' })).toBeTruthy();
  });

  it('calls onPick with the value when tapped', () => {
    const onPick = vi.fn();
    render(<QuickRepChips values={[5, 8, 10]} current="" onPick={onPick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Set reps to 8' }));
    expect(onPick).toHaveBeenCalledWith(8);
  });

  it('marks the chip matching current as pressed', () => {
    render(<QuickRepChips values={[5, 8, 10]} current={8} onPick={() => {}} />);
    const active = screen.getByRole('button', { name: 'Set reps to 8' });
    expect(active.getAttribute('aria-pressed')).toBe('true');
    const inactive = screen.getByRole('button', { name: 'Set reps to 5' });
    expect(inactive.getAttribute('aria-pressed')).toBe('false');
  });

  it('still renders the custom-reps entry point when values is empty', () => {
    render(<QuickRepChips values={[]} current="" onPick={() => {}} />);
    expect(screen.getByRole('button', { name: 'Enter custom reps' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Set reps to/ })).toBeNull();
  });
});
