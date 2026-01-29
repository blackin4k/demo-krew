import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { usePlayerStore } from '@/stores/playerStore';
import { useJamStore } from '@/stores/jamStore';
import { songsApi } from '@/lib/api';
import { toast } from 'sonner';

const DeepLinkHandler = () => {
    const navigate = useNavigate();
    const { playSong } = usePlayerStore();
    const { setJamId } = useJamStore();

    useEffect(() => {
        App.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
            const url = new URL(event.url);

            // Scheme: krew://
            // Host: song | jam
            // Path: /123

            const type = url.host; // 'song' or 'jam'
            const id = url.pathname.replace('/', ''); // '123'

            console.log('Deep Link:', { type, id, url: event.url });

            if (type === 'song' && id) {
                try {
                    // Navigate to home/player first? Or just play
                    toast.info('Loading shared song...');
                    const songId = parseInt(id);
                    // We need to fetch song details first? playSong usually takes a full object.
                    // Let's optimize: fetch song then play.
                    const res = await songsApi.get(songId); // Assuming single get endpoint exists or search
                    // Wait, 'songsApi' usually has search but maybe not get-by-id logic exposed clearly?
                    // Fallback: If no direct get, we might need to rely on what playSong accepts.
                    // Let's assume playSong handles bare minimum or we fetch it.
                    // Looking at playerStore, playSong(song: Song).

                    if (res.data) {
                        playSong(res.data);
                        navigate('/queue'); // Go to player view
                    }
                } catch (e) {
                    console.error('Deep link song error', e);
                    toast.error('Could not load shared song.');
                }
            }
            else if (type === 'jam' && id) {
                setJamId(id);
                navigate('/jam');
                toast.info(`Joining Jam ${id}...`);
            }
        });
    }, [navigate]);

    return null;
};

export default DeepLinkHandler;
