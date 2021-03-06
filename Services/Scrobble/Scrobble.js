import IsNil from 'lodash-es/isNil';

import Registry from '@radon-extension/framework/Core/Registry';
import ScrobbleService from '@radon-extension/framework/Services/Destination/Scrobble';
import {MediaTypes} from '@radon-extension/framework/Core/Enums';

import Client from '../../Api/Client';
import Log from '../../Core/Logger';
import Plugin from '../../Core/Plugin';


export class Scrobble extends ScrobbleService {
    constructor() {
        super(Plugin, [
            MediaTypes.Music.Track
        ]);
    }

    onStarted(session) {
        let listen = this._createListen(session.item);

        if(IsNil(listen)) {
            Log.warn('Unable to build listen for session:', session);
            return;
        }

        // Update now playing status
        Client.submitListens('playing_now', [listen]).then((response) => {
            Log.info(
                'TODO: Handle "submitListens" (playing_now) response: %o',
                response
            );
        }, (body, statusCode) => {
            Log.info(
                'TODO: Handle "submitListens" (playing_now) error, status code: %o, body: %O',
                statusCode, body
            );
        });
    }

    onStopped(session) {
        if(session.progress < 80) {
            return;
        }

        let listen = this._createListen(session.item);

        if(IsNil(listen)) {
            Log.warn('Unable to build listen for session:', session);
            return;
        }

        // Set `listened_at` timestamp
        listen['listened_at'] = Math.round(Date.now() / 1000);

        // Scrobble track
        Client.submitListens('single', [listen]).then((response) => {
            Log.info(
                'TODO: Handle "submitListens" (single) response: %o',
                response
            );
        }, (body, statusCode) => {
            Log.info(
                'TODO: Handle "submitListens" (single) error, status code: %o, body: %O',
                statusCode, body
            );
        });
    }

    // region Private methods


    _createListen(track) {
        if(track.type !== MediaTypes.Music.Track) {
            return null;
        }

        // Ensure duration is defined (to avoid invalid items)
        if(IsNil(track.duration)) {
            return null;
        }

        // Build request
        let request = {
            'track_metadata': {
                'artist_name': track.artist.title,
                'track_name': track.title
            }
        };

        if(!IsNil(track.album) && !IsNil(track.album.title)) {
            request['track_metadata']['release_name'] = track.album.title;
        }

        // Additional attributes
        let additional = {};

        if(!IsNil(track.number)) {
            additional['tracknumber'] = track.number;
        }

        if(Object.keys(additional).length > 0) {
            request['track_metadata']['additional_info'] = additional;
        }

        return request;
    }

    // endregion
}

// Register service
Registry.registerService(new Scrobble());
