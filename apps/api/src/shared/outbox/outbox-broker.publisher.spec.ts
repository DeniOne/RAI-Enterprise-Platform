import { RedisService } from '../redis/redis.service';
import { OutboxBrokerPublisher } from './outbox-broker.publisher';
import { SecretsService } from '../config/secrets.service';

describe('OutboxBrokerPublisher', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  function createPublisher(env?: Record<string, string>) {
    process.env = { ...process.env, ...env };

    const redisService = {
      xadd: jest.fn().mockResolvedValue('1710240000000-0'),
    };

    return {
      publisher: new OutboxBrokerPublisher(
        redisService as unknown as RedisService,
        {
          getOptionalSecret: jest.fn().mockImplementation((key: string) =>
            key === 'OUTBOX_BROKER_AUTH_TOKEN'
              ? process.env.OUTBOX_BROKER_AUTH_TOKEN
              : undefined,
          ),
        } as unknown as SecretsService,
      ),
      redisService,
    };
  }

  const sampleMessage = {
    id: 'msg-1',
    type: 'finance.economic_event.created',
    aggregateId: 'agg-1',
    aggregateType: 'EconomicEvent',
    payload: {
      companyId: 'company-1',
      eventVersion: 1,
      replayKey: 'rk-1',
    },
    createdAt: new Date('2026-03-12T19:00:00.000Z'),
  };

  it('publishes to tenant-partitioned Redis stream in broker-native mode', async () => {
    const { publisher, redisService } = createPublisher({
      OUTBOX_BROKER_TRANSPORT: 'redis_streams',
      OUTBOX_BROKER_REDIS_STREAM_KEY: 'rai:outbox',
      OUTBOX_BROKER_REDIS_STREAM_MAXLEN: '5000',
      OUTBOX_BROKER_REDIS_TENANT_PARTITIONING: 'true',
    });

    await publisher.publish(sampleMessage);

    expect(redisService.xadd).toHaveBeenCalledWith(
      'rai:outbox:company-1',
      expect.objectContaining({
        eventId: 'msg-1',
        eventType: 'finance.economic_event.created',
        companyId: 'company-1',
        payload: JSON.stringify(sampleMessage.payload),
      }),
      { maxLen: 5000 },
    );
    expect(publisher.describeConfig()).toContain('transport=redis_streams');
    expect(publisher.describeConfig()).toContain('tenantPartitioning=true');
  });

  it('returns transport-specific config hint when Redis Streams are selected', () => {
    const { publisher } = createPublisher({
      OUTBOX_BROKER_TRANSPORT: 'redis_streams',
      OUTBOX_BROKER_REDIS_STREAM_KEY: '   ',
    });

    expect(publisher.isConfigured()).toBe(false);
    expect(publisher.requiredConfigHint()).toBe(
      'OUTBOX_BROKER_REDIS_STREAM_KEY',
    );
  });

  it('keeps legacy HTTP publisher contract for backward compatibility', () => {
    const { publisher } = createPublisher({
      OUTBOX_BROKER_TRANSPORT: 'http',
      OUTBOX_BROKER_ENDPOINT: 'https://broker.example.com/publish',
    });

    expect(publisher.getTransport()).toBe('http');
    expect(publisher.isConfigured()).toBe(true);
    expect(publisher.describeConfig()).toContain('transport=http');
    expect(publisher.requiredConfigHint()).toBe('OUTBOX_BROKER_ENDPOINT');
  });
});
