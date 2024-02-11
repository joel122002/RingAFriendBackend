# Ring A Friend (Backend)

Ring A Friend is an app designed to call make a phone ring, even when it's on silent. It is designed for people who leave their phone on silent or tend to not pick up calls. It rings till the user dismisses the ringer. You can find the client [here](https://github.com/joel122002/RingAFriend)

## Pre-requisites
- [NodeJS](https://nodejs.org/en/download/) (I'm using v16.20.0)
- [PostgreSQL](https://www.postgresql.org/download/) (I'm using v16.1)

## Installation
Clone the app

```bash
  git clone
  cd RingAFriendBackend
```

Download all the required packages with [npm](https://www.npmjs.com/)

```bash
  npm i
```

Create the schemas needed
```bash
  psql -U username -f db.sql
  psql -U username -d ringafriend -f node_modules/connect-pg-simple/table.sql 
```
Run the app
```bash
  node app.js 
```


