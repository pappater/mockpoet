import { describe, it, expect } from 'vitest';
import { slugify, findChapterBySlug } from './slugify';

describe('slugify', () => {
  it('converts text to lowercase slug', () => {
    expect(slugify('The Raid')).toBe('the_raid');
  });

  it('replaces spaces with underscores', () => {
    expect(slugify('The Alpha\'s Presence')).toBe('the_alphas_presence');
  });

  it('removes special characters', () => {
    expect(slugify('Chapter: The Beginning!')).toBe('chapter_the_beginning');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('handles null/undefined', () => {
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
  });

  it('handles multiple spaces', () => {
    expect(slugify('The  Raid   Here')).toBe('the_raid_here');
  });
});

describe('findChapterBySlug', () => {
  const chapters = [
    { chapter: 1, chapter_name: 'The Raid' },
    { chapter: 2, chapter_name: 'The Alpha\'s Presence' },
    { chapter: 3, chapter_name: 'Dangerous Attraction' },
  ];

  it('finds chapter by slug', () => {
    const result = findChapterBySlug(chapters, 'the_raid');
    expect(result).toEqual({ chapter: 1, chapter_name: 'The Raid' });
  });

  it('finds chapter with special characters', () => {
    const result = findChapterBySlug(chapters, 'the_alphas_presence');
    expect(result).toEqual({ chapter: 2, chapter_name: 'The Alpha\'s Presence' });
  });

  it('returns null for non-existent slug', () => {
    const result = findChapterBySlug(chapters, 'nonexistent');
    expect(result).toBeUndefined();
  });

  it('handles empty slug', () => {
    const result = findChapterBySlug(chapters, '');
    expect(result).toBeNull();
  });

  it('handles empty chapters array', () => {
    const result = findChapterBySlug([], 'the_raid');
    expect(result).toBeUndefined();
  });
});
