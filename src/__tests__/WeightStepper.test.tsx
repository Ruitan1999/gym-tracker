import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WeightStepper from '../components/workout/WeightStepper';

describe('WeightStepper', () => {
  it('increments by step when + is tapped', () => {
    const onChange = vi.fn();
    render(<WeightStepper label="Weight (kg)" value={60} onChange={onChange} step={2.5} unit="kg" />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase weight by 2.5 kg' }));
    expect(onChange).toHaveBeenCalledWith(62.5);
  });

  it('decrements by step when - is tapped', () => {
    const onChange = vi.fn();
    render(<WeightStepper label="Weight (kg)" value={60} onChange={onChange} step={2.5} unit="kg" />);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease weight by 2.5 kg' }));
    expect(onChange).toHaveBeenCalledWith(57.5);
  });

  it('clamps decrement at 0', () => {
    const onChange = vi.fn();
    render(<WeightStepper label="Weight (kg)" value={1} onChange={onChange} step={2.5} unit="kg" />);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease weight by 2.5 kg' }));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('disables decrement when value is 0', () => {
    render(<WeightStepper label="Weight (kg)" value={0} onChange={() => {}} step={2.5} unit="kg" />);
    const btn = screen.getByRole('button', { name: 'Decrease weight by 2.5 kg' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('increment from empty sets value to step', () => {
    const onChange = vi.fn();
    render(<WeightStepper label="Weight (kg)" value="" onChange={onChange} step={2.5} unit="kg" />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase weight by 2.5 kg' }));
    expect(onChange).toHaveBeenCalledWith(2.5);
  });

  it('decrement from empty is a no-op', () => {
    const onChange = vi.fn();
    render(<WeightStepper label="Weight (kg)" value="" onChange={onChange} step={2.5} unit="kg" />);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease weight by 2.5 kg' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('uses the given step and unit in aria labels (lb)', () => {
    render(<WeightStepper label="Weight (lb)" value={100} onChange={() => {}} step={5} unit="lb" />);
    expect(screen.getByRole('button', { name: 'Increase weight by 5 lb' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Decrease weight by 5 lb' })).toBeTruthy();
  });
});
