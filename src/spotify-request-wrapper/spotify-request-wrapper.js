import AuthRequest from './auth-request.js'
import ApiRequest from './api-request.js'

export default class spotifyAPI {
    constructor(credentials, scope) {
        this.credentials = Object.assign({}, credentials)
        this.scope = scope
    }

    getClientId = () => {
        return this.credentials.client_id
    }

    getClientSecret = () => {
        return this.credentials.client_secret
    }

    getRedirectUri = () => {
        return this.credentials.redirect_uri
    }

    getScope = () => {
        return this.scope
    }

    /*  AUTHENTICATION API ENDPOINT METHODS */

    /**
     * Retrieve URL in which the user can sign in with their Spotify account and grant permissions.
     * Docs URL: https://developer.spotify.com/documentation/web-api/concepts/authorization
     * @param {string} state - A parameter that you can use to maintain a value between the request and
     * the callback to redirect_uri. It is useful to prevent CSRF exploits.
     * @return {string} The URL where the user can give application permissions.
     */
    createAuthoriseURL = (state) => {
        return new AuthRequest()
            .setPath('/authorize')
            .setQueryParams({
                response_type: 'code',
                client_id: this.getClientId(),
                redirect_uri: this.getRedirectUri(),
                scope: this.scope.join('%20'),
                state: state,
                // TODO: showDialog - require approval for each login rather than auto-redirect
            })
            .build()
            .getURL()
    }

    /**
     * Request an access and refresh token using the authorisation code flow provided by Spotify's API.
     * Docs URL: https://developer.spotify.com/documentation/web-api/tutorials/code-flow
     * @param {string} auth_code - A code that the authorisation code flow provides within the callback URL.
     * @returns {Promise | undefined} A promise that if successful, resolves into an object containing the
     * access token, refresh token, token type and time to expiration. If rejected, it contains an error object.
     */
    authorisationCodeGrant = (auth_code) => {
        return new AuthRequest()
            .setMethod('POST')
            .setPath('/api/token')
            .setHeaders({
                'content-Type': 'application/x-www-form-urlencoded',
                Authorization:
                    'Basic ' + new Buffer.from(this.getClientId() + ':' + this.getClientSecret()).toString('base64'),
            })
            .setBodyParams({
                grant_type: 'authorization_code',
                code: auth_code,
                redirect_uri: this.getRedirectUri(),
            })
            .build()
            .execute()
    }

    /**
     * Retrieve URL in which the user can sign in with their Spotify account and grant permissions.
     * Docs URL: https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens
     * @param {string} refresh_token - The token provided by Spotify's auth API to request new access tokens with.
     * @returns {Promise | undefined} A promise that if successful, resolves into an object containing the
     * refreshed access token, token type and time to expiration. If rejected, it contains an error object.
     */
    refreshAccessToken = (refresh_token) => {
        return new AuthRequest()
            .setMethod('POST')
            .setPath('/api/token')
            .setHeaders({
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization:
                    'Basic ' + new Buffer.from(this.getClientId() + ':' + this.getClientSecret()).toString('base64'),
            })
            .setBodyParams({
                grant_type: 'refresh_token',
                refresh_token: refresh_token,
                client_id: this.getClientId(),
            })
            .build()
            .execute()
    }

    /*  WEB API ENDPOINT METHODS */

    /* USER ENDPOINTS */

    /**
     * Get detailed profile information about the curent user.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile
     * @param {string} access_token - Authenticated user's access token.
     * @returns {Promise} - A promise that if successful, resolves into an object containing the requested information.
     */
    getMe = (access_token) => {
        return new ApiRequest(access_token).setMethod('GET').setPath('/me').build().execute()
    }

    /**
     * Get the current user's top artists or tracks based on calculated affinity, over a 1y, 6mo or 4 week duration.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
     * @param {*} access_token - Authenticated user's access token.
     * @param {number} limit - Spotify API pagination page limit.
     * @param {number} offset - Spotify API pagination page offset.
     * @param {*} type - The type of entity to return. Valid values: 'artists', 'tracks'.
     * @param {*} time_range - Over what time from the affinities are computed. Valid values: 'long_term', 'medium_term', 'short_term'.
     * @returns - A promise that if successful, resolves into an object containing the requested information.
     */
    getMeTopItems = (access_token, limit, offset, type, time_range, market) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath(`/me/top/${type}`)
            .setQueryParams({
                limit: limit || 20,
                offset: offset || 0,
                time_range: time_range,
                market: market || 'GB',
            })
            .build()
            .execute()
    }

    /**
     * Get a list of the songs saved in the current user's library.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-users-saved-tracks
     * @param {string} access_token - Authenticated user's access token.
     * @param {number} limit - Spotify API pagination page limit.
     * @param {number} offset - Spotify API pagination page offset.
     * @param {string} market - The ISO 3166-1 alpha-2 country code associated with the user. Defaults to GB if not supplied.
     * @returns {Promise} - A promise that if successful, resolves into an object containing the requested information.
     */
    getMeTracks = (access_token, limit, offset, market) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath('/me/tracks')
            .setQueryParams({
                limit: limit || 20,
                offset: offset || 0,
                market: market || 'GB',
            })
            .build()
            .execute()
    }

    /**
     * Get a list of the albums saved in the current Spotify user's 'Your Music' library.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-users-saved-albums
     * @param {string} access_token - Authenticated user's access token.
     * @param {number} limit - Spotify API pagination page limit.
     * @param {number} offset - Spotify API pagination page offset.
     * @returns {Promise} - A promise that if successful, resolves into an object containing the requested information.
     */
    getMeAlbums = (access_token, limit, offset) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath('/me/albums')
            .setQueryParams({
                limit: limit || 20,
                offset: offset || 0,
            })
            .build()
            .execute()
    }

    /**
     * Get a list of the playlists owned or followed by the current Spotify user.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-a-list-of-current-users-playlists
     * @param {string} access_token - Authenticated user's access token.
     * @param {number} limit - Spotify API pagination page limit.
     * @param {number} offset - Spotify API pagination page offset.
     * @returns {Promise} - A promise that if successful, resolves into an object containing the requested information.
     */
    getMePlaylists = (access_token, limit, offset) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath('/me/playlists')
            .setQueryParams({
                limit: limit || 20,
                offset: offset || 0,
            })
            .build()
            .execute()
    }

    /**
     * Get the current user's followed artists.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-followed
     * @param {string} access_token - Authenticated user's access token.
     * @param {number} limit - Spotify API pagination page limit.
     * @param {number} offset - Spotify API pagination page offset.
     * @returns {Promise} - A promise that if successful, resolves into an object containing the requested information.
     */
    getMeArtists = (access_token, limit, after) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath('/me/following')
            .setQueryParams({
                type: 'artist',
                limit: limit || 20,
                after: after || null,
            })
            .build()
            .execute()
    }

    /**
     * Check to see if the current user is following a specified playlist.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/check-if-user-follows-playlist
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} playlist_id - The Spotify ID of the playlist.
     * @returns {Promise} - A promise that if successful, resolves into an array of boolean, containing a single boolean.
     */
    checkMePlaylists = (access_token, playlist_id) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath(`/playlists/${playlist_id}/followers/contains`)
            .build()
            .execute()
    }

    /**
     * Check if one or more albums is already saved in the current Spotify user's 'Your Music' Library.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/check-users-saved-albums
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} album_ids - The Spotify IDs of the albums (maximum: 20).
     * @returns {Promise} - A promise that if successful, resolves into an array of boolean, containing a single boolean.
     */
    checkMeAlbums = (access_token, album_ids) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath('/me/albums/contains')
            .setQueryParams({
                ids: album_ids,
            })
            .build()
            .execute()
    }

    /**
     * Check to see if the current user is following one or more artists.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/check-current-user-follows
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} artist_ids - The Spotify IDs of the artists (maximum: 20).
     * @returns {Promise} - A promise that if successful, resolves into an array of booleans.
     */
    checkMeArtists = (access_token, artist_ids) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath('/me/following/contains')
            .setQueryParams({
                type: 'artist',
                ids: artist_ids,
            })
            .build()
            .execute()
    }

    /**
     * Save one or more tracks to the current user's 'Your Music' library.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/save-tracks-user
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} track_ids - A comma separated list of Spotify ID's for the tracks, maximum of 20.
     * @returns {Promise} - A promise that if successful, resolves into an empty response.
     */
    putMeTracks = (access_token, track_ids) => {
        return new ApiRequest(access_token)
            .setMethod('PUT')
            .setPath('/me/tracks')
            .setQueryParams({
                ids: track_ids,
            })
            .build()
            .execute()
    }

    /**
     * Save one or more albums to the current user's 'Your Music' library.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/save-albums-user
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} album_ids - A comma separated list of Spotify ID's for the albums, maximum of 20.
     * @returns {Promise} - A promise that if successful, resolves into an empty response.
     */
    putMeAlbums = (access_token, album_ids) => {
        return new ApiRequest(access_token)
            .setMethod('PUT')
            .setPath('/me/albums')
            .setQueryParams({
                ids: album_ids,
            })
            .build()
            .execute()
    }

    /**
     * Add the current user as a follower of a playlist.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/follow-playlist
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} playlist_id - The Spotify ID of the playlist.
     * @returns {Promise} - A promise that if successful, resolves into an empty response.
     */
    putMePlaylists = (access_token, playlist_id) => {
        return new ApiRequest(access_token)
            .setMethod('PUT')
            .setPath(`/playlists/${playlist_id}/followers`)
            .build()
            .execute()
    }

    /**
     * Add the current user as a follower of one or more artists or other Spotify users.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/follow-artists-users
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} type - The Spotify ID type. Allowed values: 'artist', 'user'.
     * @param {string} ids - A comma separated list of Spotify ID's for the artists and/or users, maximum of 50.
     * @returns {Promise} - A promise that if successful, resolves into an empty response.
     */
    putMeFollowing = (access_token, type, ids) => {
        return new ApiRequest(access_token)
            .setMethod('PUT')
            .setPath('/me/following')
            .setQueryParams({
                type: type,
                ids: ids,
            })
            .build()
            .execute()
    }

    /**
     * Remove one or more tracks to the current user's 'Your Music' library.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/remove-tracks-user
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} track_ids - A comma separated list of Spotify ID's for the tracks, maximum of 20.
     * @returns {Promise} - A promise that if successful, resolves into an empty response.
     */
    deleteMeTracks = (access_token, track_ids) => {
        return new ApiRequest(access_token)
            .setMethod('DELETE')
            .setPath('/me/tracks')
            .setQueryParams({
                ids: track_ids,
            })
            .build()
            .execute()
    }

    /**
     * Remove one or more albums to the current user's 'Your Music' library.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/remove-albums-user
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} album_ids - A comma separated list of Spotify ID's for the albums, maximum of 20.
     * @returns {Promise} - A promise that if successful, resolves into an empty response.
     */
    deleteMeAlbums = (access_token, album_ids) => {
        return new ApiRequest(access_token)
            .setMethod('DELETE')
            .setPath('/me/albums')
            .setQueryParams({
                ids: album_ids,
            })
            .build()
            .execute()
    }

    /**
     * Remove the current user as a follower of a playlist.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/unfollow-playlist
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} playlist_id - The Spotify ID of the playlist.
     * @returns {Promise} - A promise that if successful, resolves into an empty response.
     */
    deleteMePlaylists = (access_token, playlist_id) => {
        return new ApiRequest(access_token)
            .setMethod('DELETE')
            .setPath(`/playlists/${playlist_id}/followers`)
            .build()
            .execute()
    }

    /**
     * Remove the current user as a follower of one or more artists or other Spotify users.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/unfollow-artists-users
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} type - The Spotify ID type. Allowed values: 'artist', 'user'.
     * @param {string} ids - A comma separated list of Spotify ID's for the artists and/or users, maximum of 50.
     * @returns {Promise} - A promise that if successful, resolves into an empty response.
     */
    deleteMeFollowing = (access_token, type, ids) => {
        return new ApiRequest(access_token)
            .setMethod('DELETE')
            .setPath('/me/following')
            .setQueryParams({
                type: type,
                ids: ids,
            })
            .build()
            .execute()
    }

    /**
     * Create a Spotify playlist for the current user.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/create-playlist
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} name - The Spotify playlist name (required.)
     * @param {string} description - The Spotify playlist description (not required.)
     * @returns {Promise} - A promise that if successful, resolves into an object containing the created playlist.
     */
    createMePlaylist = (access_token, name, description) => {
        return new ApiRequest(access_token)
            .setMethod('POST')
            .setPath(`/me/playlists`)
            .setBodyParams({
                name: name,
                description: description,
            })
            .build()
            .execute()
    }

    /**
     * Change a playlist's name and description (the user must own the playlist.)
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/change-playlist-details
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} playlist_id - The Spotify ID of the playlist.
     * @param {string} name - The Spotify playlist name (required.)
     * @param {string} description - The Spotify playlist description (not required.)
     * @returns {Promise} - A promise that if successful, resolves into an empty response.
     */
    updateMePlaylist = (access_token, playlist_id, name, description) => {
        return new ApiRequest(access_token)
            .setMethod('PUT')
            .setPath(`/playlists/${playlist_id}`)
            .setBodyParams({
                name: name,
                description: description,
            })
            .build()
            .execute()
    }

    /* MISC ENDPOINTS */
    // TODO: add check if user is following X among other misc calls

    /* ARTIST ENDPOINTS */

    /**
     * Get Spotify catalog information for a single artist.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-an-artist
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} artist_id - Unique artist Spotify ID.
     * @returns {Promise} - A promise that if successful, resolves into an object containing the requested information.
     */
    getArtist = (access_token, artist_id) => {
        return new ApiRequest(access_token).setMethod('GET').setPath(`/artists/${artist_id}`).build().execute()
    }

    /**
     * Get Spotify catalog information about an artist's top tracks by country. [country not provided -- defaults to user's specified country]
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-an-artists-top-tracks
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} artist_id - Unique artist Spotify ID.
     * @returns {Promise} - A promise that if successful, resolves into an object containing the requested information.
     */
    getArtistTopTracks = (access_token, artist_id) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath(`/artists/${artist_id}/top-tracks`)
            .build()
            .execute()
    }

    /**
     * Get Spotify catalog information about an artist's albums.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-an-artists-albums
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} artist_id - Unique artist Spotify ID.
     * @param {*} include_groups - A comma-separated list of keywords used to filter the response. Valid values: album, single, appears_on, compilation
     * @param {number} limit - Spotify API pagination page limit.
     * @param {number} offset - Spotify API pagination page offset.
     * @returns {Promise} - A promise that if successful, resolves into an object containing the requested information.
     */
    getArtistAlbums = (access_token, artist_id, limit, offset, include_groups) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath(`/artists/${artist_id}/albums`)
            .setQueryParams({
                limit: limit || 20,
                offset: offset || 0,
                include_groups: include_groups,
            })
            .build()
            .execute()
    }

    /**
     * Get Spotify catalog information about artists similar to a given artist. Similarity based on analysis of Spotify community's listening history.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-an-artists-related-artists
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} artist_id - Unique artist Spotify ID.
     * @returns {Promise} - A promise that if successful, resolves into an object containing the requested information.
     */
    getArtistRelatedArtists = (access_token, artist_id) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath(`/artists/${artist_id}/related-artists`)
            .build()
            .execute()
    }

    /* ALBUM ENDPOINTS */

    /**
     * Get Spotify catalog information for a single album.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-an-album
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} album_id - Unique album Spotify ID.
     * @param {string} market - The ISO 3166-1 alpha-2 country code associated with the user. Defaults to GB if not supplied.
     * @returns - A promise that if successful, resolves into an object containing the requested information.
     */
    getAlbum = (access_token, album_id, market) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath(`/albums/${album_id}`)
            .setQueryParams({
                market: market || 'GB',
            })
            .build()
            .execute()
    }

    /**
     * Get Spotify catalog information about an album's tracks.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-an-albums-tracks
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} album_id - Unique album Spotify ID.
     * @param {number} limit - Spotify API pagination page limit.
     * @param {number} offset - Spotify API pagination page offset.
     * @param {string} market - The ISO 3166-1 alpha-2 country code associated with the user. Defaults to GB if not supplied.
     * @returns - A promise that if successful, resolves into an object containing the requested information.
     */
    getAlbumTracks = (access_token, album_id, limit, offset, market) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath(`/albums/${album_id}/tracks`)
            .setQueryParams({
                limit: limit || 20,
                offset: offset || 0,
                market: market || 'GB',
            })
            .build()
            .execute()
    }

    /**
     * Get a list of new album releases featured in Spotify.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-new-releases
     * @param {string} access_token - Authenticated user's access token.
     * @param {number} limit - Spotify API pagination page limit.
     * @param {number} offset - Spotify API pagination page offset.
     * @returns - A promise that if successful, resolves into an object containing the requested information.
     */
    getAlbumReleases = (access_token, limit, offset) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath('/browse/new-releases')
            .setQueryParams({
                limit: limit || 20,
                offset: offset || 0,
            })
            .build()
            .execute()
    }

    /* PLAYLIST ENDPOINTS */

    /**
     * Get a playlist owned by a Spotify user.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-playlist
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} playlist_id - Unique playlist Spotify ID.
     * @returns - A promise that if successful, resolves into an object containing the requested information.
     */
    getPlaylist = (access_token, playlist_id) => {
        return new ApiRequest(access_token).setMethod('GET').setPath(`/playlists/${playlist_id}`).build().execute()
    }

    /**
     * Get a list of Spotify featured playlists.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-featured-playlists
     * @param {string} access_token - Authenticated user's access token.
     * @param {number} limit - Spotify API pagination page limit.
     * @param {number} offset - Spotify API pagination page offset.
     * @param {string} locale - The ISO 3166-1 alpha-2 country code associated with the user. Defaults to GB if not supplied.
     * @returns - A promise that if successful, resolves into an object containing the requested information.
     */
    getFeaturedPlaylists = (access_token, limit, offset, locale) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath('/browse/featured-playlists')
            .setQueryParams({
                limit: limit || 20,
                offset: offset || 0,
                locale: locale || 'GB',
            })
            .build()
            .execute()
    }

    /**
     * Get full details of the items of a playlist owned by a Spotify user.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-playlists-tracks
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} playlist_id - Unique playlist Spotify ID.
     * @param {number} limit - Spotify API pagination page limit.
     * @param {number} offset - Spotify API pagination page offset.
     * @param {string} market - The ISO 3166-1 alpha-2 country code associated with the user. Defaults to GB if not supplied.
     * @returns - A promise that if successful, resolves into an object containing the requested information.
     */
    getPlaylistTracks = (access_token, playlist_id, limit, offset, market) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath(`/playlists/${playlist_id}/tracks`)
            .setQueryParams({
                limit: limit || 20,
                offset: offset || 0,
                market: market || 'GB',
            })
            .build()
            .execute()
    }

    /**
     * Add one or more items to a user's playlist.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/add-tracks-to-playlist
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} playlist_id - The Spotify ID of the playlist.
     * @param {string} tracks - A comma-separated list of spotify URI's to add. Can be track or episode URI's.
     * @returns {Promise} - A promise that if successful, resolves into a snapshot id of the playlist.
     */
    addPlaylistTracks = (access_token, playlist_id, tracks) => {
        return new ApiRequest(access_token)
            .setMethod('POST')
            .setPath(`/playlists/${playlist_id}/tracks`)
            .setBodyParams({
                uris: tracks,
            })
            .build()
            .execute()
    }

    /**
     * Remove one or more items from a user's playlist.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/remove-tracks-playlist
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} playlist_id - The Spotify ID of the playlist.
     * @param {string[]} tracks - Array of spotify URI's of the tracks of episodes to remove.
     * @returns {Promise} - A promise that if successful, resolves into a snapshot id of the playlist.
     */
    removePlaylistTracks = (access_token, playlist_id, tracks) => {
        return new ApiRequest(access_token)
            .setMethod('DELETE')
            .setPath(`/playlists/${playlist_id}/tracks`)
            .setBodyParams({
                tracks: tracks,
            })
            .build()
            .execute()
    }

    /* BROWSE ENDPOINTS */

    /**
     * Get Spotify catalog information about albums, artists, playlists, tracks, shows, episodes, or audiobooks that match a keyword string.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/search
     * @param {string} access_token - Authenticated user's access token.
     * @param {*} search_query - The search query.
     * @param {*} type - A comma-separated string of types to search across. Allowed values: album, artist, playlist, track, show, episode, audiobook.
     * @param {number} limit - Spotify API pagination page limit.
     * @param {number} offset - Spotify API pagination page offset.
     * @returns - A promise that if successful, resolves into an object containing the requested information.
     */
    getSearch = (access_token, limit, offset, search_query, type) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath('/search')
            .setQueryParams({
                q: search_query,
                type: type || 'album,playlist,artist,track',
                limit: limit || 20,
                offset: offset || 0,
            })
            .build()
            .execute()
    }

    /**
     * Get a list of categories used to tag items in Spotify.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-categories
     * @param {string} access_token - Authenticated user's access token.
     * @param {number} limit - Spotify API pagination page limit.
     * @param {number} offset - Spotify API pagination page offset.
     * @returns - A promise that if successful, resolves into an object containing the requested information.
     */
    getBrowseCategories = (access_token, limit, offset) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath('/browse/categories')
            .setQueryParams({
                limit: limit || 20,
                offset: offset || 0,
            })
            .build()
            .execute()
    }

    /**
     * Get a list of Spotify playlists tagged with a particular category.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-a-categories-playlists
     * @param {string} access_token - Authenticated user's access token.
     * @param {*} category_id - The Spotify Category ID.
     * @param {number} limit - Spotify API pagination page limit.
     * @param {number} offset - Spotify API pagination page offset.
     * @returns - A promise that if successful, resolves into an object containing the requested information.
     */
    getCategoryPlaylists = (access_token, limit, offset, category_id) => {
        return new ApiRequest(access_token)
            .setMethod('GET')
            .setPath(`/browse/categories/${category_id}/playlists`)
            .setQueryParams({
                limit: limit || 20,
                offset: offset || 0,
            })
            .build()
            .execute()
    }

    /* PLAYER ENDPOINTS - REQUIRES SPOTIFY PREMIUM FOR AUTHENTICATED USER */

    /**
     * Get information about a user's available Spotify Connect devices.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-a-users-available-devices
     * @param {string} access_token - Authenticated user's access token.
     * @returns - A promise that if successful, resolves into an object containing the requested information.
     */
    getAvailableDevices = (access_token) => {
        return new ApiRequest(access_token).setMethod('GET').setPath('/me/player/devices').build().execute()
    }

    /**
     * Transfer playback to a new device and optionally begin playback.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/transfer-a-users-playback
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} device_id - the ID of the device on which the playback should be transferred.
     * @returns - A promise that if successful, resolves into the string 'Playback transferred'.
     */
    setActiveDevice = (access_token, device_id) => {
        return new ApiRequest(access_token)
            .setMethod('PUT')
            .setPath('/me/player')
            .setBodyParams({
                device_ids: [device_id],
                play: false,
            })
            .build()
            .execute()
    }

    /**
     * Start a new context, or resume current playback, on the user's active device.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} device_id - (OPTIONAL) The id of the device the command is targeting. If not supplied, the currently active device is targeted.
     * @returns - A promise that if successful, resolves into the string 'Playback started'.
     */
    play = (access_token, device_id) => {
        return new ApiRequest(access_token)
            .setMethod('PUT')
            .setPath('/me/player/play')
            .setQueryParams({
                device_id: device_id,
            })
            .build()
            .execute()
    }

    /**
     * Start a new context, or resume current playback, on the user's active device.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} device_id - (OPTIONAL) The id of the device the command is targeting. If not supplied, the currently active device is targeted.
     * @param {string} context_uri - (OPTIONAL) Spotify URI context to play. Valid contexts are albums, artists & playlists.
     * @param {integer} offset - (OPTIONAL) Indicates from where in the context playback should start. Only available when context_uri is that of a playlist or album.
     * @returns - A promise that if successful, resolves into the string 'Playback started'.
     */
    playContext = (access_token, device_id, context_uri, offset) => {
        return new ApiRequest(access_token)
            .setMethod('PUT')
            .setPath('/me/player/play')
            .setQueryParams({
                device_id: device_id,
            })
            .setBodyParams({
                context_uri: context_uri,
            })
            .build()
            .execute()
    }

    /**
     * Start a new context, or resume current playback, on the user's active device.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} device_id - (OPTIONAL) The id of the device the command is targeting. If not supplied, the currently active device is targeted.
     * @param {string} track_uris - (OPTIONAL) A JSON array of the Spotify track URIs to play.
     * @returns - A promise that if successful, resolves into the string 'Playback started'.
     */
    playTrack = (access_token, device_id, track_uris) => {
        return new ApiRequest(access_token)
            .setMethod('PUT')
            .setPath('/me/player/play')
            .setQueryParams({
                device_id: device_id,
            })
            .setBodyParams({
                uris: [track_uris],
            })
            .build()
            .execute()
    }

    /**
     * Pause playback on the user's account.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/pause-a-users-playback
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} device_id - (OPTIONAL) The id of the device the command is targeting. If not supplied, the currently active device is targeted.

     */
    pause = (access_token, device_id) => {
        return new ApiRequest(access_token)
            .setMethod('PUT')
            .setPath('/me/player/pause')
            .setQueryParams({
                device_id: device_id || '',
            })
            .build()
            .execute()
    }

    /**
     * Skips to the next track in the user's queue.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/skip-users-playback-to-next-track
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} device_id - (OPTIONAL) The id of the device the command is targeting. If not supplied, the currently active device is targeted.
     * @returns - A promise that if successful, resolves into the string 'Command sent'.
     */
    next = (access_token, device_id) => {
        return new ApiRequest(access_token)
            .setMethod('POST')
            .setPath('/me/player/next')
            .setQueryParams({
                device_id: device_id,
            })
            .build()
            .execute()
    }

    /**
     * Skips to the previous track inthe user's queue.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/skip-users-playback-to-previous-track
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} device_id - (OPTIONAL) The id of the device the command is targeting. If not supplied, the currently active device is targeted.
     * @returns - A promise that if successful, resolves into the string 'Command sent'.
     */
    previous = (access_token, device_id) => {
        return new ApiRequest(access_token)
            .setMethod('POST')
            .setPath('/me/player/previous')
            .setQueryParams({
                device_id: device_id,
            })
            .build()
            .execute()
    }

    /**
     * Toggle shuffle on or off for user's playback.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/toggle-shuffle-for-users-playback
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} device_id - (OPTIONAL) The id of the device the command is targeting. If not supplied, the currently active device is targeted.
     * @param {boolean} state - The shuffle state to set. True = shuffle, false = do not shuffle.
     * @returns - A promise that if successful, resolves into the string 'Command sent'.
     */
    shuffle = (access_token, device_id, state) => {
        return new ApiRequest(access_token)
            .setMethod('PUT')
            .setPath('/me/player/shuffle')
            .setQueryParams({
                device_id: device_id,
                state: state,
            })
            .build()
            .execute()
    }

    /**
     * Set the repeat mode for the user's playback.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/set-repeat-mode-on-users-playback
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} device_id - (OPTIONAL) The id of the device the command is targeting. If not supplied, the currently active device is targeted.
     * @param {boolean} state - Available options: 'off',  'context', 'track'.
     * @returns - A promise that if successful, resolves into the string 'Command sent'.
     */
    repeat = (access_token, device_id, state) => {
        return new ApiRequest(access_token)
            .setMethod('PUT')
            .setPath('/me/player/repeat')
            .setQueryParams({
                device_id: device_id,
                state: state,
            })
            .build()
            .execute()
    }

    /**
     * Set the volume for the user's current playback device.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/set-volume-for-users-playback
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} device_id - (OPTIONAL) The id of the device the command is targeting. If not supplied, the currently active device is targeted.
     * @param {number} volume - The volume to set. Must be from 0 to 100 inclusive.
     * @returns - A promise that if successful, resolves into the string 'Command sent'.
     */
    volume = (access_token, device_id, volume) => {
        return new ApiRequest(access_token)
            .setMethod('PUT')
            .setPath('/me/player/volume')
            .setQueryParams({
                device_id: device_id,
                volume_percent: volume,
            })
            .build()
            .execute()
    }

    /**
     * Seeks to the given position in the user's currently playing track.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/seek-to-position-in-currently-playing-track
     * @param {string} access_token - Authenticated user's access token.
     * @param {string} device_id - (OPTIONAL) The id of the device the command is targeting. If not supplied, the currently active device is targeted.
     * @param {number} position - The position to seek in milliseconds. Must be a positive number. If number > length of current track, next track will be played.
     * @returns - A promise that if successful, resolves into the string 'Command sent'.
     */
    seek = (access_token, device_id, position) => {
        return new ApiRequest(access_token)
            .setMethod('PUT')
            .setPath('/me/player/seek')
            .setQueryParams({
                device_id: device_id,
                position_ms: position,
            })
            .build()
            .execute()
    }

    /**
     * Get the list of objects that make up the user's queue.
     * Docs URL: https://developer.spotify.com/documentation/web-api/reference/get-queue
     * @param {string} access_token - Authenticated user's access token.
     * @returns - A promise that if successful, resolves into an object containing the requested information.
     */
    getQueue = (access_token) => {
        return new ApiRequest(access_token).setMethod('GET').setPath('/me/player/queue').build().execute()
    }
}
