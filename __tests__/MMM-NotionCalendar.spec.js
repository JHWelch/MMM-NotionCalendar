require('../__mocks__/Module');

const name = 'MMM-NotionCalendar';

let MMMNotionCalendar;

beforeEach(() => {
  jest.resetModules();
  require('../MMM-NotionCalendar');

  MMMNotionCalendar = global.Module.create(name);
  MMMNotionCalendar.setData({ name, identifier: `Module_1_${name}` });

  const date = new Date(2023, 9, 1); // October 1, 2023
  jest.useFakeTimers().setSystemTime(date);
});

it('requires expected version', () => {
  expect(MMMNotionCalendar.requiresVersion).toBe('2.28.0');
});
