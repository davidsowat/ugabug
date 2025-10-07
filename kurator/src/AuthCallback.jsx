import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthCallback = ({ onTokenReceived }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleAuth = async () => {
            const args = new URLSearchParams(window.location.search);
            const code = args.get('code');
            const codeVerifier = localStorage.getItem('spotify_code_verifier');

            if (code) {
                try {
                    const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
                        client_id: import.meta.env.VITE_CLIENT_ID,
                        grant_type: 'authorization_code',
                        code: code,
                        redirect_uri: `${window.location.origin}/callback`,
                        code_verifier: codeVerifier,
                    }));

                    const { access_token, expires_in } = response.data;
                    onTokenReceived(access_token, expires_in);

                } catch (error) {
                    console.error('Fel vid utbyte av kod mot token:', error);
                    navigate('/');
                }
            } else {
                 navigate('/');
            }
        };
        handleAuth();
    }, [navigate, onTokenReceived]);

    return (
        <div style={{ color: 'white', textAlign: 'center', paddingTop: '5rem' }}>
            <h2>Autentiserar...</h2>
        </div>
    );
};

export default AuthCallback;