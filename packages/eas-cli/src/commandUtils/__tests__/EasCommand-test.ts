import { flushAsync, initAsync, logEvent } from '../../analytics';
import { jester as mockJester } from '../../credentials/__tests__/fixtures-constants';
import { getUserAsync } from '../../user/User';
import { ensureLoggedInAsync } from '../../user/actions';
import EasCommand from '../EasCommand';
import TestEasCommand from './TestEasCommand';

TestEasCommand.prototype.authValue = jest.fn().mockImplementation(() => true);

jest.mock('../../user/User');
jest.mock('../../user/actions', () => ({ ensureLoggedInAsync: jest.fn() }));
jest.mock('../../analytics', () => {
  const { AnalyticsEvent } = jest.requireActual('../../analytics');
  return {
    AnalyticsEvent,
    logEvent: jest.fn(),
    initAsync: jest.fn(),
    flushAsync: jest.fn(),
  };
});

beforeEach(() => {
  (getUserAsync as jest.Mock).mockReset().mockImplementation(() => mockJester);
  (ensureLoggedInAsync as jest.Mock).mockReset().mockImplementation(() => mockJester);
  (initAsync as jest.Mock).mockReset();
  (flushAsync as jest.Mock).mockReset();
  (logEvent as jest.Mock).mockReset();
});

describe(EasCommand.name, () => {
  describe('without exceptions', () => {
    it('ensures the user is logged in', async () => {
      await TestEasCommand.run();

      expect(ensureLoggedInAsync).toHaveBeenCalled();
    });

    it('ensures the user data is read from cache', async () => {
      (TestEasCommand.prototype.authValue as jest.Mock).mockImplementationOnce(() => false);

      await TestEasCommand.run();

      expect(getUserAsync).toHaveReturnedWith(mockJester);
    });

    it('initializes analytics', async () => {
      await TestEasCommand.run();

      expect(initAsync).toHaveBeenCalled();
    });

    it('flushes analytics', async () => {
      await TestEasCommand.run();

      expect(flushAsync).toHaveBeenCalled();
    });

    it('logs events', async () => {
      await TestEasCommand.run();

      expect(logEvent).toHaveBeenCalledWith('action', {
        action: `eas ${TestEasCommand.id}`,
      });
    });
  });

  describe('after exceptions', () => {
    it('flushes analytics', async () => {
      try {
        await TestEasCommand.run().then(() => {
          throw new Error('foo');
        });
      } catch (error) {}

      expect(flushAsync).toHaveBeenCalled();
    });
  });
});
