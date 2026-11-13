import { describe, it, expect } from 'vitest';
import { slugify, getChapterSlug, findChapterBySlug } from './slugify';

describe('slugify', () => {
  it('converts text to lowercase slug', () => {
    expect(slugify('The Raid')).toBe('the_raid');
  });

  it('replaces spaces with underscores', () => {
    expect(slugify("The Alpha's Presence")).toBe('the_alphas_presence');
  });

  it('removes special characters', () => {
    expect(slugify('Chapter: The Beginning!')).toBe('chapter_the_beginning');
  });

  it('preserves Tamil Unicode characters for readable URLs', () => {
    expect(slugify('மழைக் குறிஞ்சி')).toBe('மழைக்_குறிஞ்சி');
  });

  it('handles empty string and null/undefined', () => {
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
  });
});

describe('findChapterBySlug', () => {
  const chapters = [
    { chapter: 1, chapter_name: 'The Raid' },
    { chapter: 2, chapter_name: "The Alpha's Presence" },
    { chapter: 3, chapter_name: 'மழைக் குறிஞ்சி' },
  ];

  it('finds chapter by slug', () => {
    const result = findChapterBySlug(chapters, 'the_raid');
    expect(result).toEqual({ chapter: 1, chapter_name: 'The Raid' });
  });

  it('finds chapter with Tamil Unicode slug (encoded or decoded)', () => {
    const slug = getChapterSlug(chapters[2]);
    expect(findChapterBySlug(chapters, slug)).toEqual(chapters[2]);
    expect(findChapterBySlug(chapters, encodeURIComponent(slug))).toEqual(chapters[2]);
  });

  it('returns null for non-existent slug or empty inputs', () => {
    expect(findChapterBySlug(chapters, 'nonexistent')).toBeNull();
    expect(findChapterBySlug(chapters, '')).toBeNull();
    expect(findChapterBySlug([], 'the_raid')).toBeNull();
  });
});
