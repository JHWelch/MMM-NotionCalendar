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

    // Log all routes
    Log.info('Registered routes:');
    Log.info(this.expressApp._router.stack
      .filter(r => r.route && r.route.path)
      .map(r => r.route.path));
  },

  async handleRequest (req, res) {
    const input = this.validate(req, res);
    if (!input) { return; }

    const { token, dataSourceId, nameField, dateField, emojis } = input;

    const notion = new Client({
      auth: token,
    });

    const events = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: dateField,
        date: {
          is_not_empty: true,
        },
      },
    });

    res.type('text/calendar');
    res.send(this.eventsToIcs(
      events?.results ?? [],
      nameField,
      dateField,
      emojis,
    ));
  },

  validate (req, res) {
    const {
      token,
      dataSourceId,
      nameField = 'Name',
      dateField = 'Date',
      emojis = false,
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

    return { token, dataSourceId, nameField, dateField, emojis };
  },

  eventsToIcs (notionEvents, nameField = 'Name', dateField = 'Date', emojis = false) {
    const {value, error} = ics.createEvents(notionEvents.map((event) => {
      const end = this.parseDate(
        event.properties[dateField].date.end
        || event.properties[dateField].date.start,
      );
      const start = this.parseDate(event.properties[dateField].date.start);

      let title = event.properties[nameField]?.title[0]?.text.content || 'No Title';
      if (emojis && event.icon && event.icon.type === 'emoji') {
        title = `${event.icon.emoji} ${title}`;
      }

      return { uid: event.id, title, start, end };
    }));

    if (error) {
      Log.error('Error creating ICS events:', error);

      return null;
    }

    return value;
  },

  parseDate (dateString) {
    const date = new Date(dateString);

    return [
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
    ];
  },
});
