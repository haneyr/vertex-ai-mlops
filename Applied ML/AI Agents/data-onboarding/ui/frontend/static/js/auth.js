/**
 * Auth module — Google Identity Services (GIS) sign-in.
 *
 * When OAUTH_CLIENT_ID is configured on the server, this module:
 * - Shows a login screen with a Google sign-in button
 * - Stores the ID token in localStorage
 * - Provides getToken() for WebSocket and REST calls
 * - Checks token expiry on page load
 *
 * When OAUTH_CLIENT_ID is empty, auth is disabled and the app works normally.
 */

const Auth = {
    enabled: false,
    clientId: '',
    token: null,
    user: null,
    _onReady: null,

    /**
     * Initialize auth. Returns a promise that resolves when either:
     * - Auth is disabled (immediate)
     * - User is authenticated (after login)
     */
    init() {
        return new Promise((resolve) => {
            this._onReady = resolve;
            this._checkConfig();
        });
    },

    async _checkConfig() {
        try {
            const resp = await fetch('/api/config');
            const config = await resp.json();
            this.clientId = config.oauth_client_id || '';
        } catch (e) {
            this.clientId = '';
        }

        if (!this.clientId) {
            this.enabled = false;
            this._onReady();
            return;
        }

        this.enabled = true;

        // Check for stored token
        const stored = localStorage.getItem('id_token');
        if (stored) {
            try {
                const payload = JSON.parse(atob(stored.split('.')[1]));
                if (Date.now() < payload.exp * 1000) {
                    this.token = stored;
                    this.user = {
                        email: payload.email || '',
                        name: payload.name || '',
                        picture: payload.picture || '',
                    };
                    this._showAuthenticated();
                    this._onReady();
                    return;
                }
            } catch (e) { /* invalid token, fall through to login */ }
            localStorage.removeItem('id_token');
        }

        this._showLogin();
    },

    _showLogin() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-container').style.display = 'none';
        document.getElementById('text-input-bar').style.display = 'none';
        document.querySelector('.top-bar').style.display = 'none';

        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.initialize({
                client_id: this.clientId,
                callback: (response) => this._handleCredential(response),
            });
            google.accounts.id.renderButton(
                document.getElementById('gsi-button'),
                { theme: 'outline', size: 'large', text: 'signin_with', width: 300 },
            );
        }
    },

    _handleCredential(response) {
        this.token = response.credential;
        localStorage.setItem('id_token', this.token);

        const payload = JSON.parse(atob(this.token.split('.')[1]));
        this.user = {
            email: payload.email || '',
            name: payload.name || '',
            picture: payload.picture || '',
        };

        this._showAuthenticated();
        this._onReady();
    },

    _showAuthenticated() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-container').style.display = '';
        document.getElementById('text-input-bar').style.display = '';
        document.querySelector('.top-bar').style.display = '';

        // Populate user profile in header
        const profile = document.getElementById('user-profile');
        if (profile) {
            profile.classList.remove('hidden');
            const avatar = document.getElementById('user-avatar');
            const name = document.getElementById('user-name');
            if (avatar && this.user.picture) {
                avatar.src = this.user.picture;
                avatar.style.display = '';
            }
            if (name) {
                name.textContent = this.user.name || this.user.email || '';
            }
        }
    },

    signOut() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('id_token');
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.disableAutoSelect();
        }
        location.reload();
    },

    /** Get the current ID token (or empty string if no auth). */
    getToken() {
        return this.token || '';
    },
};
