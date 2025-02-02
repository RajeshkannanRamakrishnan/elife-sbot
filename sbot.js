'use strict'

const path = require('path')
const fs = require('fs')
const ssbKeys = require('ssb-keys')
const u = require('@elife/utils')


const createSbot = require('ssb-server')
                   .use(require('ssb-master'))
                   .use(require('ssb-no-auth'))
                   .use(require('ssb-unix-socket'))
                   .use(require('ssb-logging'))

                   .use(require('ssb-gossip'))
                   .use(require('ssb-replicate'))
                   .use(require('ssb-friends'))
                   .use(require('ssb-blobs'))
                   .use(require('ssb-invite'))

                   .use(require('ssb-identities'))

                   .use(require('ssb-links'))
                   .use(require('ssb-ebt'))
module.exports = {
    start: start,
}

/*      understand/
 * This is the "application key" what this means is our app will be
 * isolated from other scuttlebuts on the same network that do not use
 * the same key.
 */
const appKey = new Buffer('P6EGPtCNW7irtdeIk+vRVzVbWOlctUKJuce1IZkO2N4=', 'base64');

/*      outcome/
 * We start scuttlebot using the configuration port and database path
 * provided.
 */
function start(config, cb) {
    let port = config['SSB_PORT']
    let sbotFolder = config["SSB_FOLDER"]

    if(!port) {
        cb(`Set the ssb-port in the configuration`)
        return
    }

    if(!sbotFolder || !(sbotFolder.trim())) {
        cb(`Did not find configuration folder to load data`)
        return
    }

    sbotFolder = path.join(sbotFolder, "__ssb")

    u.ensureExists(sbotFolder, err => {
        if(err) cb(`Failed to create scuttlebot data folder ${err}`)
        else {
            start_sbot_1()
        }
    })

    function start_sbot_1() {
        let secret = path.join(sbotFolder, 'secret')
        let keys = ssbKeys.loadOrCreateSync(secret)

        let cfg = {
            port : port,
            keys: keys,
            path: sbotFolder,
            allowPrivate: true,
            local: false,
            caps: {
                shs: appKey
            },
        }

        let sbot = createSbot(cfg)
        sbot.whoami((err, feed) => {
            if(err) cb(`Failed starting scuttlebot server ${err}`)
            else {
                let manifest = sbot.getManifest()
                let manifestf = path.join(cfg.path, 'manifest.json')
                fs.writeFileSync(manifestf, JSON.stringify(manifest))

                cb(null, sbot, feed)
            }
        })
    }
}
