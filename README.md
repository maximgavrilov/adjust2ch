1. Install clickhouse
https://www.digitalocean.com/community/tutorials/how-to-install-and-use-clickhouse-on-ubuntu-20-04

2. Install nodejs & npm

3. Copy config.js.sample to config.js and setup

4. Run `node index.js`

5. `<server>/<table>/sql` – CREATE command for ClickHouse

6. `<server>/<table>/url` – callback url for Adjust

7. Run with pm2
https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-22-04

Reasonable pm2 config:
```
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 0
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD
pm2 set pm2-logrotate:workerInterval 30
pm2 set pm2-logrotate:rotateInterval 0 0 * * *
pm2 set pm2-logrotate:rotateModule true
```
