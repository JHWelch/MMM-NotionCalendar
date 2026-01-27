# MMM-Notion-Calednar

This is a module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/).

TODO: Add screenshot

## Installation

In ~/MagicMirror/modules

```sh
git clone https://github.com/JHWelch/MMM-Notion-Calendar.git

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
7. In "Access" tab edit access and select your task database.

### Data Source Id

1. Open the page of your Task database.
2. Open the table menu and select "Manage Data Sources"
3. Select the desired data source and "Copy data source ID"
4. Save for use in config (`dataSourceId`)

## Using the module

TODO

## Development

Install dev dependencies

```sh
npm install
```

### Testing

There is a test suite using Jest.

```sh
npm test
```

### Linting

There is linting using ESLint

```sh
# Run linting
npm run lint

# Fix linting errors
npm run fix
```
