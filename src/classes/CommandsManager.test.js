import CommandsManager from './CommandsManager.js';

describe('CommandsManager', () => {
  let commandsManager,
    contextName = 'VTK',
    command = {
      commandFn: jest.fn(),
      storeContexts: [],
      options: {},
    };

  beforeEach(() => {
    commandsManager = new CommandsManager();
  });

  it('has a contexts property', () => {
    expect(commandsManager).toHaveProperty('contexts');
    expect(commandsManager.contexts).toEqual({});
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
    it('returns undefined if command does not exist', () => {
      commandsManager.createContext(contextName);
      const result = commandsManager.getCommand('TestCommand', contextName);

      expect(result).toBe(undefined);
    });
    it('uses the globalCurrentContext if contextName is not provided', () => {
      // TODO: NOT IMPLEMENTED
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
