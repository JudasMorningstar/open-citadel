import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-file-system/legacy', () => ({ documentDirectory: 'file:///docs/' }));
vi.mock('@/db/client', () => ({ db: {} }));
vi.mock('@/db/schema', () => ({ podcastEpisodes: {} }));
vi.mock('@/services/podcasts/records', () => ({ nowIso: () => '' }));

const { fileNameFor, localFileUri } = await import('@/services/podcasts/download-files');

describe('fileNameFor', () => {
  it('takes the extension from the type, then the address, then mp3', () => {
    expect(fileNameFor({ id: 'e1', audioUrl: 'https://a.test/x', mimeType: 'audio/mp4' })).toBe('e1.m4a');
    expect(fileNameFor({ id: 'e1', audioUrl: 'https://a.test/x.OGG?token=1', mimeType: null })).toBe('e1.ogg');
    expect(fileNameFor({ id: 'e1', audioUrl: 'https://a.test/stream', mimeType: null })).toBe('e1.mp3');
  });
});

describe('localFileUri', () => {
  it('is the file in the podcasts folder once downloaded, and null before', () => {
    expect(localFileUri({ downloadStatus: 'downloaded', downloadFile: 'e1.mp3' })).toBe('file:///docs/podcasts/e1.mp3');
    expect(localFileUri({ downloadStatus: 'downloading', downloadFile: 'e1.mp3' })).toBeNull();
    expect(localFileUri({ downloadStatus: 'downloaded', downloadFile: null })).toBeNull();
  });
});
