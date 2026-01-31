/* MagicMirror²
 * Node Helper: MMM-NotionCalendar
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
      '/MMM-NotionCalendar.ics',
      this.handleRequest.bind(this),
    );
  },

  async handleRequest (req, res) {
    const input = this.validate(req, res);
    if (!input) { return; }

    const {
      token,
      dataSourceId,
      nameProperty,
      dateProperty,
      emojis,
      customFilter,
    } = input;

    const notion = new Client({
      auth: token,
    });

    const baseFilter = {
      property: dateProperty,
      date: {
        is_not_empty: true,
      },
    };
    const filter = customFilter
      ? { and: [baseFilter, customFilter]}
      : baseFilter;

    const events = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter,
    });

    res.type('text/calendar');
    res.status(200);
    res.send(this.eventsToIcs(
      events?.results ?? [],
      nameProperty,
      dateProperty,
      emojis,
    ));
  },

  validate (req, res) {
    const {
      token,
      dataSourceId,
      nameProperty = 'Name',
      dateProperty = 'Date',
      emojis = false,
      filter = null,
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

    let customFilter = null;
    if (filter) {
      try {
        customFilter = JSON.parse(filter);
      } catch (_) {
        res.status(422).send('"filter" query parameter is not valid JSON.');
        Log.error('"filter" query parameter is not valid JSON.');

        return false;
      }
    }

    return {
      token,
      dataSourceId,
      nameProperty,
      dateProperty,
      emojis,
      customFilter,
    };
  },

  eventsToIcs (notionEvents, nameProperty = 'Name', dateProperty = 'Date', emojis = false) {
    const {value, error} = ics.createEvents(notionEvents.map((event) => {
      const end = this.parseDate(
        event.properties[dateProperty].date.end
        || event.properties[dateProperty].date.start,
      );
      const start = this.parseDate(event.properties[dateProperty].date.start);

      let title = event.properties[nameProperty]?.title[0]?.text.content || 'No Title';
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
