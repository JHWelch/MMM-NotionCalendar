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
    const input = this.validate(req, res);
    if (!input) { return; }

    const { token, dataSourceId, nameField, dateField } = input;

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
    res.send(this.eventsToIcs(events?.results ?? [], nameField, dateField));
  },

  validate (req, res) {
    const {
      token,
      dataSourceId,
      nameField = 'Name',
      dateField = 'Date',
    } = req.query;

    if (!token) {
      res.status(422).send('"token" query parameter is required.');
      Log.error('"token" query parameter is required.');

      return false;
    }
    if (!dataSourceId) {
      res.status(422).send('"dataSourceId" query parameter is required.');
      Log.error('"dataSourceId" query parameter is required.');

      return false;
    }

    return { token, dataSourceId, nameField, dateField };
  },

  eventsToIcs (notionEvents, nameField = 'Name', dateField = 'Date') {
    const {value, error} = ics.createEvents(notionEvents.map((event) => ({
      uid: event.id,
      title: event.properties[nameField]?.title[0]?.text.content || 'No Title',
      start: event.properties[dateField].date.start,
      end: event.properties[dateField].date.end
        || event.properties[dateField].date.start,
    })));

    if (error) {
      Log.error('Error creating ICS events:', error);

      return null;
    }

    return value;
  },
});
