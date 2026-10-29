import { getJson } from '../http';

const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

describe('getJson', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it('200: отдаёт данные', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { a: 1 }));
    await expect(getJson('https://x')).resolves.toEqual({ ok: true, data: { a: 1 } });
  });

  it('400: server с reason, без повтора', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { error: true, reason: 'Latitude must be in range' }));
    const res = await getJson('https://x', { retryDelayMs: 0 });
    expect(res).toEqual({ ok: false, error: { kind: 'server', status: 400, reason: 'Latitude must be in range' } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('429: rate-limit, без повтора', async () => {
    fetchMock.mockResolvedValue(jsonResponse(429, {}));
    const res = await getJson('https://x', { retryDelayMs: 0 });
    expect(res).toEqual({ ok: false, error: { kind: 'rate-limit' } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('500: один повтор, потом успех', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, {})).mockResolvedValueOnce(jsonResponse(200, { ok: 1 }));
    const res = await getJson('https://x', { retryDelayMs: 0 });
    expect(res).toEqual({ ok: true, data: { ok: 1 } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('500 дважды: server', async () => {
    fetchMock.mockResolvedValue(jsonResponse(503, {}));
    const res = await getJson('https://x', { retryDelayMs: 0 });
    expect(res).toMatchObject({ ok: false, error: { kind: 'server', status: 503 } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('исключение сети: offline после одного повтора', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    const res = await getJson('https://x', { retryDelayMs: 0 });
    expect(res).toEqual({ ok: false, error: { kind: 'offline' } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('таймаут: offline', async () => {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const res = await getJson('https://x', { timeoutMs: 10, retryDelayMs: 0 });
    expect(res).toEqual({ ok: false, error: { kind: 'offline' } });
  });

  it('тело не JSON: invalid', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => { throw new SyntaxError('x'); } } as unknown as Response);
    const res = await getJson('https://x');
    expect(res).toMatchObject({ ok: false, error: { kind: 'invalid' } });
  });
});
