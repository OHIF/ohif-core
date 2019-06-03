import CommandsManager from './CommandsManager.js';
import log from './../log.js';

jest.mock('./../log.js');

describe('CommandsManager', () => {
  let commandsManager,
    contextName = 'VTK',
    command = {
      commandFn: jest.fn(),
      storeContexts: [],
      options: {},
    },
    commandsManagerConfig = {
      getAppState: () => {
        return {
          viewers: 'Test',
        };
      },
      getActiveContexts: () => ['VIEWER', 'ACTIVEVIEWER::CORNERSTONE'],
    };

  beforeEach(() => {
    commandsManager = new CommandsManager(commandsManagerConfig);
    jest.clearAllMocks();
  });

  it('has a contexts property', () => {
    expect(commandsManager).toHaveProperty('contexts');
    expect(commandsManager.contexts).toEqual({});
  });

  it('logs a warning if instantiated without getAppState or getActiveContexts', () => {
    new CommandsManager();

    expect(log.warn.mock.calls.length).toBe(1);
  });

  describe('createContext()', () => {
    it('creates a context', () => {
      commandsManager.createContext(contextName);

      expect(commandsManager.contexts).toHaveProperty(contextName);
    });

    it('clears the context if it already exists', () => {
      commandsManager.createContext(contextName);
      commandsManager.registerCommand(contextName, 'TestCommand', command);
      commandsManager.registerCommand(contextName, 'TestCommand2', command);
      commandsManager.createContext(contextName);

      const registeredCommands = commandsManager.getContext(contextName);

      expect(registeredCommands).toEqual({});
    });
  });

  describe('getContext()', () => {
    it('returns all registered commands for a context', () => {
      commandsManager.createContext(contextName);
      commandsManager.registerCommand(contextName, 'TestCommand', command);
      const registeredCommands = commandsManager.getContext(contextName);

      expect(registeredCommands).toHaveProperty('TestCommand');
      expect(registeredCommands['TestCommand']).toEqual(command);
    });
    it('returns undefined if the context does not exist', () => {
      const registeredCommands = commandsManager.getContext(contextName);

      expect(registeredCommands).toBe(undefined);
    });
  });

  describe('clearContext()', () => {
    it('clears all registered commands for a context', () => {
      commandsManager.createContext(contextName);
      commandsManager.registerCommand(contextName, 'TestCommand', command);
      commandsManager.registerCommand(contextName, 'TestCommand2', command);
      commandsManager.clearContext(contextName);

      const registeredCommands = commandsManager.getContext(contextName);

      expect(registeredCommands).toEqual({});
    });
  });

  describe('registerCommand()', () => {
    it('registers commands to a context', () => {
      commandsManager.createContext(contextName);
      commandsManager.registerCommand(contextName, 'TestCommand', command);
      const registeredCommands = commandsManager.getContext(contextName);

      expect(registeredCommands).toHaveProperty('TestCommand');
      expect(registeredCommands['TestCommand']).toEqual(command);
    });
  });

  describe('getCommand()', () => {
    it('returns undefined if context does not exist', () => {
      const result = commandsManager.getCommand(
        'TestCommand',
        'NonExistentContext'
      );

      expect(result).toBe(undefined);
    });
    it('returns undefined if command does not exist in context', () => {
      commandsManager.createContext(contextName);
      const result = commandsManager.getCommand('TestCommand', contextName);

      expect(result).toBe(undefined);
    });
    it('uses contextName param to get command', () => {
      commandsManager.createContext('GLOBAL');
      commandsManager.registerCommand('GLOBAL', 'TestCommand', command);
      const foundCommand = commandsManager.getCommand('TestCommand', 'GLOBAL');

      expect(foundCommand).toBe(command);
    });
    it('uses activeContexts, if contextName is not provided, to get command', () => {
      commandsManager.createContext('VIEWER');
      commandsManager.registerCommand('VIEWER', 'TestCommand', command);
      const foundCommand = commandsManager.getCommand('TestCommand');

      expect(foundCommand).toBe(command);
    });
    it('returns the expected command', () => {
      commandsManager.createContext(contextName);
      commandsManager.registerCommand(contextName, 'TestCommand', command);
      const result = commandsManager.getCommand('TestCommand', contextName);

      expect(result).toEqual(command);
    });
  });

  describe('runCommand()', () => {
    // TODO: NOT IMPLEMENTED
  });
});
