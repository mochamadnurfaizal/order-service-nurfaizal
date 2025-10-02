#!/bin/sh
npm run db:migrate && npm run db:push && exec node dist/app.js
