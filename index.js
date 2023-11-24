const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const winston = require('winston');
const morgan = require('morgan');
const ClickHouse = require('@apla/clickhouse');

const config = require('./config');

const fields = fs.readFileSync('./fields.txt', { encoding: 'utf8' })
                 .split('\n')
                 .filter(Boolean);

const app = express();

const ch = new ClickHouse(config.ch);

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

app.use(morgan('combined'));
// stream: fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })

app.use(bodyParser.urlencoded({ extended: true }));

const event = (dbTable, optFields) => (req, res) => {
    const allFields = [ ...optFields, ...fields ];
    const qs = { ...req.query };

    for (const k in Object.keys(qs)) {
        if (!allFields.indexOf(k) < 0) {
            console.error(`Incorrect field: ${k}`);
            delete qs[k];
        }
    }

    // Build the query based on the known parameters
    const columns = Object.keys(qs).join(', ');
    const values = Object.values(qs).map(
        val => `'${val.replace(/'/g, "\\'")}'`
    ).join(', ');

    ch.query(`INSERT INTO ${dbTable} (${columns}) VALUES (${values})`, (err, result) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.send('OK');
        }
    });
};

const sql = (dbTable, optFields) => (req, res) => {
    const db = config.ch.queryOptions.database;

    res.send(`
<pre>
CREATE DATABASE ${db};
USE ${db};

CREATE TABLE ${dbTable} (
    id UUID DEFAULT generateUUIDv4(),
    date DateTime DEFAULT now(),

    ${optFields.map((f) =>
        `${f} String DEFAULT ''`
    ).join(',\n    ')},

    ${fields.map((f) =>
        `${f} String DEFAULT ''`
    ).join(',\n    ')}
)
ENGINE = MergeTree()
PRIMARY KEY id
ORDER BY (id, date)
</pre>`);
};

const url = (dbTable) => (req, res) => {
    const base = `${config.server.host}:${config.server.port}`
    const q = fields.map((f) => `${f}={${f}}`).join('&amp;');
    res.send(`<pre style="white-space: pre-wrap">${base}/${dbTable}?${q}</pre>`);
};

for (const t of Object.keys(config.tables)) {
    console.log(t);
    app.get(`/${t}`, event(t, config.tables[t]));
    app.get(`/${t}/sql`, sql(t, config.tables[t]));
    app.get(`/${t}/url`, url(t));
}

app.listen(config.server.port, () => {
    console.log(`Server is running on ${config.server.host}:${config.server.port}/`);
});
