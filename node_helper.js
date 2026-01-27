/* Magic Mirror
 * Node Helper: MMM-Notion-Calendar
 *
 * By Jordan Welch
 * MIT Licensed.
 */

const Log = require('logger');
const NodeHelper = require('node_helper');
const { Client } = require('@notionhq/client');
const ics = require('ics');

module.exports = NodeHelper.create({
  start () {
    this.expressApp.get(
      '/MMM-Notion-Calendar.ics',
      this.handleRequest.bind(this),
    );
  },

  async handleRequest (req, res) {
    const { token, dataSourceId } = req.query;

    const notion = new Client({
      auth: token,
    });

    const events = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: 'Date',
        date: {
          is_not_empty: true,
        },
      },
    });

    res.type('text/calendar');
    res.send(this.eventsToIcs(events?.results ?? []));
  },

  eventsToIcs (notionEvents) {
    const {value, error} = ics.createEvents(notionEvents.map((event) => ({
      uid: event.id,
      title: event.properties.Name.title[0]?.text.content || 'No Title',
      start: event.properties.Date.date.start,
      end: event.properties.Date.date.end || event.properties.Date.date.start,
    })));

    if (error) {
      Log.error('Error creating ICS events:', error);

      return null;
    }

    return value;
  },
});
