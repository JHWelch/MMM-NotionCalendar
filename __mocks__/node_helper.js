/* eslint-disable no-unused-vars */
module.exports = {
  create (overrides) {
    const base = {
      expressApp: {
        get: jest.fn(),
      },

      init () {},

      loaded (callback) {
        callback();
      },

      start () {},

      stop () {},

      socketNotificationReceived (notification, payload) {},

      setName (name) {
        this.name = name;
      },

      setPath (path) {
        this.path = path;
      },

      sendSocketNotification: jest.fn(),

      setExpressApp: jest.fn(),

      setSocketIO: jest.fn(),
    };

    return { ...base, ...overrides };
  },
};
