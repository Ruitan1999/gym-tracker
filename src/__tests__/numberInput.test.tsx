import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import NumberInput from '../components/shared/NumberInput';

/** Mirrors how the weight field is driven: empty is stored as zero. */
function Harness({ initial = 0 }: { initial?: number }) {
  const [value, setValue] = useState<number | ''>(initial);
  return (
    <>
      <NumberInput
        value={value}
        onChange={(v) => setValue(v === '' ? 0 : v)}
        placeholder="0"
        min={0}
        label="LOAD"
      />
      <output>{String(value)}</output>
    </>
  );
}

const field = () => screen.getByLabelText('LOAD') as HTMLInputElement;

describe('NumberInput on a field reading zero', () => {
  it('empties the field when tapped, so typing does not append', () => {
    render(<Harness />);
    expect(field().value).toBe('0');

    fireEvent.focus(field());

    expect(field().value).toBe('');
  });

  it('takes the typed number rather than tacking it onto the zero', () => {
    render(<Harness />);

    fireEvent.focus(field());
    fireEvent.change(field(), { target: { value: '60' } });

    expect(field().value).toBe('60');
    expect(screen.getByText('60')).toBeDefined();
  });

  it('comes back to zero if nothing is typed', () => {
    render(<Harness />);

    fireEvent.focus(field());
    fireEvent.blur(field());

    expect(screen.getByText('0')).toBeDefined();
  });

  it('leaves a real value alone when tapped', () => {
    render(<Harness initial={60} />);

    fireEvent.focus(field());

    expect(field().value).toBe('60');
  });

  it('clears a zero however it is written', () => {
    const onChange = vi.fn();
    render(<NumberInput value={0} onChange={onChange} label="LOAD" />);
    const input = field();

    fireEvent.change(input, { target: { value: '0.0' } });
    fireEvent.blur(input);
    fireEvent.focus(input);

    expect(input.value).toBe('');
  });
});
