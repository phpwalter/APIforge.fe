import { applyLineEndingPrefs, withByteOrderMark } from './fileEncoding';

describe('applyLineEndingPrefs', () => {
  it('leaves LF text untouched when lineEnding is lf and insertFinalNewline is true and it already ends with one', () => {
    expect(applyLineEndingPrefs('a\nb\n', { lineEnding: 'lf', insertFinalNewline: true })).toBe('a\nb\n');
  });

  it('adds a trailing LF when insertFinalNewline is true and the text is missing one', () => {
    expect(applyLineEndingPrefs('a\nb', { lineEnding: 'lf', insertFinalNewline: true })).toBe('a\nb\n');
  });

  it('strips a trailing LF (and any extras) when insertFinalNewline is false', () => {
    expect(applyLineEndingPrefs('a\nb\n\n\n', { lineEnding: 'lf', insertFinalNewline: false })).toBe('a\nb');
  });

  it('converts LF to CRLF throughout, including the final newline', () => {
    expect(applyLineEndingPrefs('a\nb\nc', { lineEnding: 'crlf', insertFinalNewline: true })).toBe('a\r\nb\r\nc\r\n');
  });

  it('normalizes existing CRLF input before re-applying the target line ending', () => {
    expect(applyLineEndingPrefs('a\r\nb\r\n', { lineEnding: 'lf', insertFinalNewline: true })).toBe('a\nb\n');
  });

  it('strips a trailing CRLF when insertFinalNewline is false with crlf line endings', () => {
    expect(applyLineEndingPrefs('a\r\nb\r\n', { lineEnding: 'crlf', insertFinalNewline: false })).toBe('a\r\nb');
  });

  it('handles an empty string without throwing', () => {
    expect(applyLineEndingPrefs('', { lineEnding: 'lf', insertFinalNewline: false })).toBe('');
    expect(applyLineEndingPrefs('', { lineEnding: 'lf', insertFinalNewline: true })).toBe('\n');
  });
});

describe('withByteOrderMark', () => {
  it('prefixes a BOM character for utf-8-bom', () => {
    expect(withByteOrderMark('hello', 'utf-8-bom')).toBe('﻿hello');
  });

  it('leaves the text untouched for plain utf-8', () => {
    expect(withByteOrderMark('hello', 'utf-8')).toBe('hello');
  });
});
