const { Client } = require('@notionhq/client');
const { getMockReq, getMockRes } = require('@jest-mock/express');

let Log;
let helper;
let query;

const { res, mockClear } = getMockRes();

beforeEach(() => {
  helper = require('../node_helper.js');
  helper.setName('MMM-NotionCalendar');
  jest.mock('logger');
  Log = require('logger');
});

afterEach(() => {
  mockClear();
});

describe('start', () => {
  it('registers an ics endpoint', () => {
    helper.start();

    expect(helper.expressApp.get).toHaveBeenCalledWith(
      '/MMM-NotionCalendar.ics',
      expect.any(Function),
    );
  });
});

describe('handleRequest', () => {
  beforeEach(() => {
    query = jest.fn();
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2026-01-12'));
    Client.mockImplementation(() => ({
      dataSources: { query },
    }));
  });

  it('calls notion with passed credentials', () => {
    const req = getMockReq({
      query: {
        token: 'test-notion-token',
        dataSourceId: 'test-datasource-id',
      },
    });

    helper.handleRequest(req, res);

    expect(Client).toHaveBeenCalledWith({
      auth: 'test-notion-token',
    });
    expect(query).toHaveBeenCalledWith({
      data_source_id: 'test-datasource-id',
      filter: {
        property: 'Date',
        date: {
          is_not_empty: true,
        },
      },
    });
  });

  it('returns the events as ics', async () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2026-01-12'));
    const notionEvents = [
      {
        object: 'page',
        id: 'page-id',
        properties: {
          Name: { title: [{ text: { content: 'Task 1' } }] },
          Date: { date: { start: '2023-09-30' } },
        },
      },
      {
        object: 'page',
        id: 'page-id-2',
        properties: {
          Name: { title: [{ text: { content: 'Task 2' } }] },
          Date: { date: { start: '2023-10-01' } },
        },
      },
    ];
    query.mockImplementation(() => Promise.resolve({ results: notionEvents}));
    const req = getMockReq({
      query: {
        token: 'test-notion-token',
        dataSourceId: 'test-datasource-id',
      },
    });
    await helper.handleRequest(req, res);

    expect(res.type).toHaveBeenCalledWith('text/calendar');
    expect(res.send).toHaveBeenCalledWith(helper.eventsToIcs(notionEvents));
  });

  it('can customize the name field', async () => {
    const notionEvents = [
      {
        object: 'page',
        id: 'page-id',
        properties: {
          Event: { title: [{ text: { content: 'Task 1' } }] },
          Date: { date: { start: '2023-09-30' } },
        },
      },
      {
        object: 'page',
        id: 'page-id-2',
        properties: {
          Event: { title: [{ text: { content: 'Task 2' } }] },
          Date: { date: { start: '2023-10-01' } },
        },
      },
    ];
    query.mockImplementation(() => Promise.resolve({ results: notionEvents}));
    const req = getMockReq({
      query: {
        token: 'test-notion-token',
        dataSourceId: 'test-datasource-id',
        nameProperty: 'Event',
      },
    });
    await helper.handleRequest(req, res);

    expect(res.type).toHaveBeenCalledWith('text/calendar');
    expect(res.send).toHaveBeenCalledWith(helper.eventsToIcs(notionEvents, 'Event'));
  });

  it('can customize the date field', async () => {
    const notionEvents = [
      {
        object: 'page',
        id: 'page-id',
        properties: {
          Name: { title: [{ text: { content: 'Task 1' } }] },
          EventDate: { date: { start: '2023-09-30' } },
        },
      },
      {
        object: 'page',
        id: 'page-id-2',
        properties: {
          Name: { title: [{ text: { content: 'Task 2' } }] },
          EventDate: { date: { start: '2023-10-01' } },
        },
      },
    ];
    query.mockImplementation(() => Promise.resolve({ results: notionEvents}));
    const req = getMockReq({
      query: {
        token: 'test-notion-token',
        dataSourceId: 'test-datasource-id',
        dateProperty: 'EventDate',
      },
    });
    await helper.handleRequest(req, res);

    expect(res.type).toHaveBeenCalledWith('text/calendar');
    expect(res.send).toHaveBeenCalledWith(helper.eventsToIcs(notionEvents, 'Name', 'EventDate'));
    expect(query).toHaveBeenCalledWith({
      data_source_id: 'test-datasource-id',
      filter: {
        property: 'EventDate',
        date: {
          is_not_empty: true,
        },
      },
    });
  });

  it('can include page emojis', async () => {
    const notionEvents = [
      {
        object: 'page',
        id: 'page-id',
        icon: { type: 'emoji', emoji: '📅' },
        properties: {
          Name: { title: [{ text: { content: 'Event 1' } }] },
          Date: { date: { start: '2023-09-30' } },
        },
      },
      {
        object: 'page',
        id: 'page-id-2',
        icon: { type: 'emoji', emoji: '🎉' },
        properties: {
          Name: { title: [{ text: { content: 'Event 2' } }] },
          Date: { date: { start: '2023-10-01' } },
        },
      },
    ];
    query.mockImplementation(() => Promise.resolve({ results: notionEvents}));
    const req = getMockReq({
      query: {
        token: 'test-notion-token',
        dataSourceId: 'test-datasource-id',
        emojis: true,
      },
    });
    await helper.handleRequest(req, res);

    expect(res.type).toHaveBeenCalledWith('text/calendar');
    expect(res.send).toHaveBeenCalledWith(helper.eventsToIcs(
      notionEvents,
      undefined,
      undefined,
      true,
    ));
  });

  it('can include additional filters', async () => {
    query.mockImplementation(() => Promise.resolve({ results: []}));

    const req = getMockReq({
      query: {
        token: 'test-notion-token',
        dataSourceId: 'test-datasource-id',
        filter: '{ "and": [ { "property": "Status", "status": { "does_not_equal": "Done" } }, { "property": "Status", "status": { "does_not_equal": "Wont Do" } } ] }',
      },
    });

    await helper.handleRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.type).toHaveBeenCalledWith('text/calendar');
    expect(query).toHaveBeenCalledWith({
      data_source_id: 'test-datasource-id',
      filter: {
        and: [
          {
            property: 'Date',
            date: {
              is_not_empty: true,
            },
          },
          {
            and: [
              {
                property: 'Status',
                status: {
                  does_not_equal: 'Done',
                },
              },
              {
                property: 'Status',
                status: {
                  does_not_equal: 'Wont Do',
                },
              },
            ],
          },
        ],
      },
    });
  });

  it('will fail if not provided token', () => {
    const req = getMockReq({
      query: {
        dataSourceId: 'test-datasource-id',
      },
    });

    helper.handleRequest(req, res);

    expect(Client).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.send).toHaveBeenCalledWith('"token" query parameter is required.');
    expect(Log.error).toHaveBeenCalledWith('"token" query parameter is required.');
  });

  it('will fail if not provided dataSourceId', () => {
    const req = getMockReq({
      query: {
        token: 'test-notion-token',
      },
    });

    helper.handleRequest(req, res);

    expect(Client).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.send).toHaveBeenCalledWith('"dataSourceId" query parameter is required.');
    expect(Log.error).toHaveBeenCalledWith('"dataSourceId" query parameter is required.');
  });

  it('will fail if filter is not valid JSON', () => {
    const req = getMockReq({
      query: {
        token: 'test-notion-token',
        dataSourceId: 'test-datasource-id',
        filter: '{ "invalid": json }',
      },
    });

    helper.handleRequest(req, res);

    expect(Client).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.send).toHaveBeenCalledWith('"filter" query parameter is not valid JSON.');
  });
});

describe('eventToIcs', () => {
  beforeEach(() => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2026-01-12'));
  });

  it('converts notion objects to ics format', () => {
    const notionEvents = [
      {
        object: 'page',
        id: 'page-id',
        properties: {
          Name: { title: [{ text: { content: 'Task 1' } }] },
          Date: { date: { start: '2023-09-30' } },
        },
      },
      {
        object: 'page',
        id: 'page-id-2',
        properties: {
          Name: { title: [{ text: { content: 'Task 2' } }] },
          Date: { date: { start: '2023-10-01' } },
        },
      },
    ];

    expect(helper.eventsToIcs(notionEvents)).toMatchSnapshot();
  });

  it('can build events with date and time', () => {
    const notionEvents = [
      {
        object: 'page',
        id: 'page-id',
        properties: {
          Name: { title: [{ text: { content: 'Task 1' } }] },
          Date: { date: { start: '2026-02-03T20:00:00.000-06:00' } },
        },
      },
    ];

    expect(helper.eventsToIcs(notionEvents)).toMatchSnapshot();
  });

  it('can use a custom name field', () => {
    const notionEvents = [
      {
        object: 'page',
        id: 'page-id',
        properties: {
          Event: { title: [{ text: { content: 'Event 1' } }] },
          Date: { date: { start: '2023-09-30' } },
        },
      },
      {
        object: 'page',
        id: 'page-id-2',
        properties: {
          Event: { title: [{ text: { content: 'Event 2' } }] },
          Date: { date: { start: '2023-10-01' } },
        },
      },
    ];

    expect(helper.eventsToIcs(notionEvents, 'Event')).toMatchSnapshot();
  });

  it('can use a custom date field', () => {
    const notionEvents = [
      {
        object: 'page',
        id: 'page-id',
        properties: {
          Name: { title: [{ text: { content: 'Event 1' } }] },
          EventDate: { date: { start: '2023-09-30' } },
        },
      },
      {
        object: 'page',
        id: 'page-id-2',
        properties: {
          Name: { title: [{ text: { content: 'Event 2' } }] },
          EventDate: { date: { start: '2023-10-01' } },
        },
      },
    ];

    expect(helper.eventsToIcs(notionEvents, 'Name', 'EventDate')).toMatchSnapshot();
  });

  it('can include the page emoji', () => {
    const notionEvents = [
      {
        object: 'page',
        id: 'page-id',
        icon: { type: 'emoji', emoji: '📅' },
        properties: {
          Name: { title: [{ text: { content: 'Event 1' } }] },
          Date: { date: { start: '2023-09-30' } },
        },
      },
      {
        object: 'page',
        id: 'page-id-2',
        icon: { type: 'emoji', emoji: '🎉' },
        properties: {
          Name: { title: [{ text: { content: 'Event 2' } }] },
          Date: { date: { start: '2023-10-01' } },
        },
      },
    ];

    expect(helper.eventsToIcs(
      notionEvents,
      'Name',
      'Date',
      true,
    )).toMatchSnapshot();
  });
});
