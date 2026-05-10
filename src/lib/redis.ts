import Redis from 'ioredis';

const useMock = !process.env.REDIS_URL;

class InMemoryRedis {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    this.store.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
    return 'OK';
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    const result: string[] = [];
    for (const key of this.store.keys()) {
      if (regex.test(key)) result.push(key);
    }
    return result;
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async quit(): Promise<string> {
    this.store.clear();
    return 'OK';
  }
}

export const isRedisMock = useMock;

export const redis: any = useMock
  ? new InMemoryRedis()
  : new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

if (!useMock) {
  redis.on('error', (err: Error) => {
    console.error('Redis error:', err);
  });
}
