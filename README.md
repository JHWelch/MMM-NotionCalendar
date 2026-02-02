# MMM-NotionCalendar

This is a module for the [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror/).

This module provides an internal iCalendar feed of a Notion database that can be used in the [MagicMirror² Calendar module](https://docs.magicmirror.builders/modules/calendar.html).

<div style="max-width: 400px;">
  <img src="screenshot.png" alt="Screenshot of Notion Calendar in MagicMirror²" style="width: 100%; height: auto;" />
</div>

Notion events displayed in the MagicMirror² Calendar module.

## Installation

In `~/MagicMirror/modules`

```sh
git clone https://github.com/JHWelch/MMM-NotionCalendar.git

npm install --omit=dev
```

## Obtaining Notion Secrets

### Notion API Key

1. Open [Notion Integrations](https://www.notion.so/profile/integrations)
2. Click "New Integration"
3. Fill out Details
   1. Name: Anything (MMM)
   2. Associated workspace: Pick target workspace
   3. Type: Internal
   4. Click Save
4. Click "Configure integration settings"
5. Copy "Internal Integration secret" for use in config (`notionToken`)
6. Set "Capabilities" this app only requires
   1. Content Capabilities: Read Content
   2. User Capabilities: Read user information without email address
7. In "Access" tab edit access and select your database.

### Data Source Id

1. Open the page of your database.
2. Open the table menu and select "Manage Data Sources"
3. Select the desired data source and "Copy data source ID"
4. Save for use in url (`dataSourceId`)

## Configuration

Add the following to the `modules` array in `config/config.js`. It does not require any configuration options or position. Config options will be passed in the URL of the calendar feed.

```js
{
    module: 'MMM-NotionCalendar',
}
```

Add the following to the `calendars` array in the configuration of the default `calendar` module.

```js
{
    url: 'http://localhost:8080/MMM-NotionCalendar.ics?notionToken=YOUR_NOTION_TOKEN&dataSourceId=YOUR_DATA_SOURCE_ID',
}
```

To easily obtain a URL with the correct parameters, as well as adding additional options, there is [a helper tool to generate URLs](https://jhwelch.github.io/MMM-NotionCalendar/).

## Update

### Automatic Update

Did you know MagicMirror² has a built-in module updater? Read more about it [here](https://docs.magicmirror.builders/modules/updatenotification.html#updates-array).

Add the following to your `updates` array of `updatenotification` in `config/config.js`

```js
{ 'MMM-NotionCalendar': 'git pull && npm install --omit=dev' },
```

### Manual Update

In `~/MagicMirror/modules/MMM-NotionCalendar`

```sh
git pull
npm install --omit=dev
```

## Development

Install dev dependencies

```sh
npm install
```

### Testing

There is a test suite using Jest.

```sh
node --run test
```

### Linting

There is linting using ESLint

```sh
# Run linting
node --run lint

# Fix linting errors
node --run fix
```
