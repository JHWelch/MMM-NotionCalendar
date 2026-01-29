const { Client } = require('@notionhq/client');
const { getMockReq, getMockRes } = require('@jest-mock/express');

let Log;
let helper;
let query;

const { res, mockClear } = getMockRes();

beforeEach(() => {
  helper = require('../node_helper.js');
  helper.setName('MMM-Notion-Calendar');
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
      '/MMM-Notion-Calendar.ics',
      expect.any(Function),
    );
  });
});

describe('handleRequest', () => {
  beforeEach(() => {
    query = jest.fn();
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
          Status: { select: { name: 'In Progress' } },
          Date: { date: { start: '2023-09-30' } },
        },
      },
      {
        object: 'page',
        id: 'page-id-2',
        properties: {
          Name: { title: [{ text: { content: 'Task 2' } }] },
          Status: { select: { name: 'Not started' } },
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
});

describe('eventToIcs', () => {
  it('converts notion objects to ics format', () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2026-01-12'));
    const notionEvents = [
      {
        object: 'page',
        id: 'page-id',
        properties: {
          Name: { title: [{ text: { content: 'Task 1' } }] },
          Status: { select: { name: 'In Progress' } },
          Date: { date: { start: '2023-09-30' } },
        },
      },
      {
        object: 'page',
        id: 'page-id-2',
        properties: {
          Name: { title: [{ text: { content: 'Task 2' } }] },
          Status: { select: { name: 'Not started' } },
          Date: { date: { start: '2023-10-01' } },
        },
      },
    ];

    expect(helper.eventsToIcs(notionEvents)).toMatchSnapshot();
  });
});
