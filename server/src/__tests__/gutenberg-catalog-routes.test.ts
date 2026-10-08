import { CatalogBookDetailSchema, CatalogPageSchema } from 'samwell-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const gutendexBooks = vi.fn();

// Only the network call is replaced; the mapping is the real one.
vi.mock('../gutendex.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../gutendex.js')>()),
  gutendexBooks: (params: string) => gutendexBooks(params),
}));

const { gutenbergCatalogRoutes } = await import('../gutenberg-catalog.js');

const BOOK = {
  id: 2680,
  title: 'Meditations',
  authors: [{ name: 'Marcus Aurelius, Emperor of Rome' }],
  copyright: false,
  languages: ['en'],
  formats: { 'application/epub+zip': 'https://www.gutenberg.org/ebooks/2680.epub3.images' },
};

// Braces matter: a function returned from `beforeEach` is run as teardown,
// and `mockReset` returns the mock.
beforeEach(() => {
  gutendexBooks.mockReset();
});

describe('GET /gutenberg/catalog/books', () => {
  it('answers a page in the shared shape, with the next page number', async () => {
    gutendexBooks.mockResolvedValue({ results: [BOOK], hasNext: true });
    const response = await gutenbergCatalogRoutes.request('/gutenberg/catalog/books?topic=Category%3A%20Philosophy&page=2');
    expect(response.status).toBe(200);
    const page = CatalogPageSchema.parse(await response.json());
    expect(page).toEqual({ books: [{ id: 2680, title: 'Meditations', author: 'Emperor of Rome Marcus Aurelius', coverUrl: null }], nextPage: 3 });
    expect(gutendexBooks.mock.calls[0][0]).toContain('topic=Category%3A%20Philosophy');
  });

  it('refuses a query outside the schema', async () => {
    const response = await gutenbergCatalogRoutes.request('/gutenberg/catalog/books?page=0');
    expect(response.status).toBe(400);
    expect(gutendexBooks).not.toHaveBeenCalled();
  });

  it('says so when the catalogue cannot be reached', async () => {
    gutendexBooks.mockImplementation(async () => {
      throw new Error('down');
    });
    const response = await gutenbergCatalogRoutes.request('/gutenberg/catalog/books');
    expect(response.status).toBe(502);
  });
});

describe('GET /gutenberg/catalog/books/:id', () => {
  it('answers one book in the shared shape', async () => {
    gutendexBooks.mockResolvedValue({ results: [BOOK], hasNext: false });
    const response = await gutenbergCatalogRoutes.request('/gutenberg/catalog/books/2680');
    const book = CatalogBookDetailSchema.parse(await response.json());
    expect(book.publicDomain).toBe(true);
    expect(gutendexBooks).toHaveBeenCalledWith('ids=2680');
  });

  it('is a 404 for a number the catalogue does not have', async () => {
    gutendexBooks.mockResolvedValue({ results: [], hasNext: false });
    expect((await gutenbergCatalogRoutes.request('/gutenberg/catalog/books/99999999')).status).toBe(404);
  });

  it('refuses something that is not a number', async () => {
    expect((await gutenbergCatalogRoutes.request('/gutenberg/catalog/books/abc')).status).toBe(400);
  });
});

describe('the cap', () => {
  it('turns a caller away past it', async () => {
    gutendexBooks.mockResolvedValue({ results: [], hasNext: false });
    const headers = { 'x-forwarded-for': '203.0.113.9' };
    let last = 200;
    for (let i = 0; i < 241; i += 1) {
      last = (await gutenbergCatalogRoutes.request('/gutenberg/catalog/books', { headers })).status;
    }
    expect(last).toBe(429);
  });
});
