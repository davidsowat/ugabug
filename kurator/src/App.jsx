import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoginPage from './loginpage';
import PlaylistSelector from './PlaylistSelector';
import ResultPage from './ResultPage';
import AuthCallback from './AuthCallback';

const AnalysisOverlay = ({ message }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
    color: 'white', flexDirection: 'column', textAlign: 'center', padding: '1rem'
  }}>
    <div style={{
      border: '4px solid rgba(255, 255, 255, 0.2)',
      borderLeftColor: '#1DB954',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      animation: 'spin 1s linear infinite',
      marginBottom: '1.5rem'
    }}></div>
    <p style={{ fontSize: '1.5rem' }}>{message}</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const App = () => {
    const [accessToken, setAccessToken] = useState(localStorage.getItem('spotify_access_token'));
    const [userId, setUserId] = useState(localStorage.getItem('spotify_user_id'));
    const [sessionExpiry, setSessionExpiry] = useState(localStorage.getItem('spotify_session_expiry'));
    const [generatedResult, setGeneratedResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserId = async () => {
            if (accessToken && !userId) {
                try {
                    const { data } = await axios.get("https://api.spotify.com/v1/me", { headers: { Authorization: `Bearer ${accessToken}` } });
                    setUserId(data.id);
                    localStorage.setItem('spotify_user_id', data.id);
                } catch (error) { console.error("Kunde inte hämta användar-ID", error); }
            }
        };
        fetchUserId();
    }, [accessToken, userId]);

    const handleLogout = useCallback(() => {
        setAccessToken(null); setUserId(null); localStorage.clear(); navigate('/');
    }, [navigate]);

    useEffect(() => {
        if (sessionExpiry && new Date().getTime() > sessionExpiry) { handleLogout(); }
    }, [sessionExpiry, handleLogout]);

    const handleTokenReceived = (token, expiresIn) => {
        setAccessToken(token); localStorage.setItem('spotify_access_token', token);
        const expiryTime = new Date().getTime() + expiresIn * 1000;
        localStorage.setItem('spotify_session_expiry', expiryTime);
        setSessionExpiry(expiryTime);
        setUserId(null); localStorage.removeItem('spotify_user_id'); navigate('/');
    };

    const handleGeneratePlaylist = async (criteria, playlistForGeneration) => {
        if (!playlistForGeneration || !userId) return;
        setIsLoading(true);

        try {
            setLoadingMessage(`Hämtar hela spellistan...`);
            let allTracks = []; let nextUrl = playlistForGeneration.tracks.href;
            while (nextUrl) {
                const tracksResponse = await axios.get(nextUrl, { headers: { 'Authorization': `Bearer ${accessToken}` }});
                allTracks = allTracks.concat(tracksResponse.data.items.filter(item => item.track));
                nextUrl = tracksResponse.data.next;
                setLoadingMessage(`Hämtar... (${allTracks.length} / ${playlistForGeneration.tracks.total} låtar)`);
            }
            
            setLoadingMessage("Analyserar artister...");
            const artistIds = [...new Set(allTracks.flatMap(item => item.track.artists.map(a => a.id)))];
            const artistGenreMap = new Map();
            for (let i = 0; i < artistIds.length; i += 50) {
                const chunk = artistIds.slice(i, i + 50);
                const artistsResponse = await axios.get(`https://api.spotify.com/v1/artists?ids=${chunk.join(',')}`, { headers: { 'Authorization': `Bearer ${accessToken}` }});
                artistsResponse.data.artists.forEach(artist => artistGenreMap.set(artist.id, artist.genres));
            }
            const fullTrackData = allTracks.map(item => ({ name: item.track.name, artist: item.track.artists[0].name, genres: item.track.artists.flatMap(a => artistGenreMap.get(a.id) || []) }));

            const batchSize = 500; const totalBatches = Math.ceil(fullTrackData.length / batchSize);
            for (let i = 0; i < totalBatches; i++) {
                const batchNumber = i + 1; const batch = fullTrackData.slice(i * batchSize, (i + 1) * batchSize);
                setLoadingMessage(`Skickar låtar... (${(i + 1) * batchSize < fullTrackData.length ? (i + 1) * batchSize : fullTrackData.length} / ${fullTrackData.length})`);
                await axios.post('http://localhost:3000/batch', { userId, batchNumber, totalBatches, tracks: batch });
            }

            setLoadingMessage(`Ber AI:n att analysera de ${fullTrackData.length} låtarna...`);
            const backendResponse = await axios.post('http://localhost:3000/analyze', { userId, criteria });
            const aiResult = backendResponse.data;
            
            setLoadingMessage("Hittar rekommenderade låtar...");
            const searchPromises = aiResult.songRecommendations.map(songString => axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(songString)}&type=track&limit=1`, { headers: { 'Authorization': `Bearer ${accessToken}` } }));
            const searchResults = await Promise.allSettled(searchPromises);
            const foundTracks = searchResults.filter(res => res.status === 'fulfilled' && res.value.data.tracks.items.length > 0).map(res => res.value.data.tracks.items[0]);
            
            setGeneratedResult({ ...aiResult, foundTracks, sourcePlaylistUri: playlistForGeneration.uri });
            setIsLoading(false);
            navigate('/result');
        } catch (error) {
           setIsLoading(false);
           console.error("Fel under generering:", error);
           alert("Något gick fel. Kontrollera konsolen.");
        }
    };

    return (
        <>
            {isLoading && <AnalysisOverlay message={loadingMessage} />}
            <Routes>
                <Route path="/callback" element={<AuthCallback onTokenReceived={handleTokenReceived} />} />
                <Route path="/" element={
                    accessToken ?
                        <PlaylistSelector
                            token={accessToken}
                            onLogout={handleLogout}
                            handleGeneratePlaylist={handleGeneratePlaylist}
                        /> :
                        <LoginPage />
                } />
                <Route path="/result" element={
                    <ResultPage
                        resultData={generatedResult}
                        onRestart={() => navigate('/')}
                        accessToken={accessToken}
                    />
                } />
            </Routes>
        </>
    );
};

export default App;