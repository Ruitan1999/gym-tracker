import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import IconLink from '../components/shared/IconLink';

describe('IconLink', () => {
  it('is a named 48px link to its page', () => {
    render(
      <MemoryRouter>
        <IconLink to="/settings" label="Settings" icon={<svg />} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'Settings' });
    expect(link.getAttribute('href')).toBe('/settings');
    expect(link.className).toContain('w-12');
    expect(link.className).toContain('h-12');
  });

  it('gets a surface and outline only when bordered', () => {
    render(
      <MemoryRouter>
        <IconLink to="/a" label="Plain" icon={<svg />} />
        <IconLink to="/b" label="Boxed" icon={<svg />} bordered />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Plain' }).style.border).toBe('');
    expect(screen.getByRole('link', { name: 'Boxed' }).style.border).not.toBe('');
  });
});
