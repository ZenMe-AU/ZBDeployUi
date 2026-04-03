import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { ScriptForm } from '../components/ScriptForm';

describe('StatusBadge', () => {
  it.each([
    ['idle', 'Idle'],
    ['running', 'Running'],
    ['success', 'Success'],
    ['failed', 'Failed'],
  ] as const)('renders label for %s status', (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe('Modal', () => {
  it('renders title and children', () => {
    render(
      <Modal title="Test Modal" onClose={() => {}}>
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Modal title="Close Test" onClose={onClose}>
        <p>content</p>
      </Modal>,
    );
    await userEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('ScriptForm', () => {
  it('submits form data correctly', async () => {
    const onSubmit = vi.fn();
    render(<ScriptForm onSubmit={onSubmit} onCancel={() => {}} />);

    await userEvent.type(screen.getByLabelText(/name/i), 'My Deploy Script');
    await userEvent.type(screen.getByLabelText(/command/i), 'echo deploy');
    await userEvent.click(screen.getByRole('button', { name: /save script/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Deploy Script',
        command: 'echo deploy',
      }),
    );
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    render(<ScriptForm onSubmit={() => {}} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('pre-fills form when initial data is provided', () => {
    render(
      <ScriptForm
        initial={{ name: 'Existing', description: 'desc', command: 'cmd', environment: 'production' }}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByDisplayValue('Existing')).toBeInTheDocument();
    expect(screen.getByDisplayValue('cmd')).toBeInTheDocument();
  });
});
