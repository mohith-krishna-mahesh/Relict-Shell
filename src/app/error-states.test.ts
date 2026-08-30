import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { RootErrorBoundary, MissingConfigScreen, CoreUnreachable } from '@/components/ErrorStates';

describe('Production Error States and Boundary Handling', () => {
  it('renders MissingConfigScreen with guidance when configuration is missing', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(MissingConfigScreen, {
          reason: 'VITE_CLERK_PUBLISHABLE_KEY is not defined in the environment.',
        })
      )
    );

    expect(html).toContain('Authentication Configuration Missing');
    expect(html).toContain('VITE_CLERK_PUBLISHABLE_KEY');
    expect(html).toContain('Vercel Project Dashboard');
    expect(html).toContain('Check Configuration');
  });

  it('renders CoreUnreachable banner without crashing the interface', () => {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(CoreUnreachable, {})
      )
    );
    expect(html).toContain('Relict Core is unreachable');
    expect(html).toContain('Check the connection or try again');
    expect(html).toContain('Open Settings');
  });

  it('renders children normally in RootErrorBoundary when no error occurs', () => {
    const html = renderToString(
      React.createElement(
        RootErrorBoundary,
        null,
        React.createElement('div', { id: 'test-child' }, 'Workspace Loaded')
      )
    );

    expect(html).toContain('Workspace Loaded');
    expect(html).not.toContain('Application Error');
  });
});
