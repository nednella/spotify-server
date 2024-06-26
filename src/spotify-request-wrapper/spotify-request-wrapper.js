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
     * @param {string} authCode - A code that the authorisation code flow provides within the callback URL.
     * @returns {Promise | undefined} A promise that if successful, resolves into an object containing the
     * access token, refresh token, token type and time to expiration. If rejected, it contains an error object.
     */
    authorisationCodeGrant = (authCode) => {
        return new AuthRequest()
            .setMethod('POST')
            .setPath('/api/token')
            .setHeaders({
                'content-Type': 'application/x-www-form-urlencoded',
                Authorization:
                    'Basic ' +
                    new Buffer.from(this.getClientId() + ':' + this.getClientSecret()).toString(
                        'base64'
                    ),
            })
            .setBodyParams({
                grant_type: 'authorization_code',
                code: authCode,
                redirect_uri: this.getRedirectUri(),
            })
            .build()
            .execute()
    }

    /**
     * Retrieve URL in which the user can sign in with their Spotify account and grant permissions.
     * @param {string} refreshToken - The token provided by Spotify's auth API to request new access tokens with.
     * @returns {Promise | undefined} A promise that if successful, resolves into an object containing the
     * refreshed access token, token type and time to expiration. If rejected, it contains an error object.
     */
    refreshAccessToken = (refreshToken) => {
        return new AuthRequest()
            .setMethod('POST')
            .setPath('/api/token')
            .setHeaders({
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization:
                    'Basic ' +
                    new Buffer.from(this.getClientId() + ':' + this.getClientSecret()).toString(
                        'base64'
                    ),
            })
            .setBodyParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: this.getClientId(),
            })
            .build()
            .execute()
    }

    /*  WEB API ENDPOINT METHODS */

    getMe = (access_token) => {
        return new ApiRequest(access_token).setMethod('GET').setPath('/v1/me').build().execute()
    }
}
