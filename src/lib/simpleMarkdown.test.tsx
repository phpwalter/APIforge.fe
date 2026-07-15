import { render } from '@testing-library/react';
import { renderMarkdown } from './simpleMarkdown';

function html(source: string): string {
  const { container } = render(<>{renderMarkdown(source)}</>);
  return container.innerHTML;
}

describe('renderMarkdown', () => {
  it('renders a paragraph', () => {
    expect(html('Hello world.')).toBe('<p>Hello world.</p>');
  });

  it('joins consecutive lines with no blank line between them into one paragraph', () => {
    expect(html('Line one\nLine two')).toBe('<p>Line one Line two</p>');
  });

  it('splits on a blank line into separate paragraphs', () => {
    expect(html('First.\n\nSecond.')).toBe('<p>First.</p><p>Second.</p>');
  });

  it('renders # / ## / ### as h2 / h3 / h4', () => {
    expect(html('# Top')).toBe('<h2>Top</h2>');
    expect(html('## Section')).toBe('<h3>Section</h3>');
    expect(html('### Sub')).toBe('<h4>Sub</h4>');
  });

  it('renders a bullet list from - or * lines', () => {
    expect(html('- one\n- two')).toBe('<ul><li>one</li><li>two</li></ul>');
    expect(html('* one\n* two')).toBe('<ul><li>one</li><li>two</li></ul>');
  });

  it('renders --- as a horizontal rule', () => {
    expect(html('---')).toBe('<hr>');
  });

  it('renders **bold** as <strong>', () => {
    expect(html('This is **important**.')).toBe('<p>This is <strong>important</strong>.</p>');
  });

  it('renders a mixed document with headings, paragraphs, and a list in order', () => {
    const doc = ['# Terms', '', 'Please read.', '', '## Rules', '', '- one', '- two', '', 'Thanks.'].join('\n');
    expect(html(doc)).toBe(
      '<h2>Terms</h2><p>Please read.</p><h3>Rules</h3><ul><li>one</li><li>two</li></ul><p>Thanks.</p>',
    );
  });
});
