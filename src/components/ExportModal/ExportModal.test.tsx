import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportModal } from './ExportModal';
import { useAppStore } from '../../state/useAppStore';
import { useSpecStore } from '../../state/useSpecStore';

vi.mock('../../lib/api/securityTypes', () => ({
  fetchSecurityTypes: vi.fn(() => Promise.resolve([])),
}));

const { downloadTextFile } = vi.hoisted(() => ({ downloadTextFile: vi.fn() }));
vi.mock('../../lib/openapiExport', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/openapiExport')>();
  return { ...actual, downloadTextFile };
});

const initialAppState = useAppStore.getState();
const initialSpecState = useSpecStore.getState();

beforeEach(() => {
  useAppStore.setState(initialAppState, true);
  useSpecStore.setState(initialSpecState, true);
  useSpecStore.getState().loadSampleProject();
  downloadTextFile.mockClear();
});

describe('ExportModal', () => {
  it('applies the File Encoding line-ending and BOM preferences to the downloaded file', async () => {
    useAppStore.getState().setFileEncodingLineEnding('crlf');
    useAppStore.getState().setFileEncodingCharacterEncoding('utf-8-bom');
    const user = userEvent.setup();
    render(<ExportModal />);

    await user.click(screen.getByRole('button', { name: /Clean OpenAPI Export/ }));

    expect(downloadTextFile).toHaveBeenCalledTimes(1);
    const [, content, mimeType] = downloadTextFile.mock.calls[0];
    expect((content as string).startsWith('﻿')).toBe(true);
    expect(content).toContain('\r\n');
    expect(mimeType).toBe('application/yaml');
  });

  it('defaults to LF with a trailing newline and no BOM when preferences are untouched', async () => {
    const user = userEvent.setup();
    render(<ExportModal />);

    await user.click(screen.getByRole('button', { name: /Full APIforge Export/ }));

    const [, content] = downloadTextFile.mock.calls[0];
    expect((content as string).startsWith('﻿')).toBe(false);
    expect((content as string).endsWith('\n')).toBe(true);
    expect(content).not.toContain('\r\n');
  });
});
