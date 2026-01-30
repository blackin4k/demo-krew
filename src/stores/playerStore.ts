import { create } from 'zustand';
import { songsApi, playerApi, radioApi, API_URL } from '@/lib/api';
import { toast } from 'sonner';

export interface Song {
  id: number;
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  audio?: string;
  genre?: string;
  duration?: number;
  bpm?: number;
}

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  queue: Song[];
  audio: HTMLAudioElement | null; // Legacy ref (points to active)
  analyser: AnalyserNode | null;
  isExpanded: boolean;
  sleepTimerEnd: number | null;
  lyrics: string | null;
  showLyrics: boolean;
  lastPlayStart: number;
  isRemoteUpdate: boolean; // Flag to suppress socket broadcast during sync
  isLoadingNext: boolean; // Flag to prevent "paused" state during transition


  // Visualizer
  visualizerColor: string | null;
  setVisualizerColor: (color: string | null) => void;

  // Lab (EQ & FX)
  eqGains: number[];
  vinylMode: boolean;
  setEqBand: (index: number, gain: number) => void;
  setVinylMode: (enabled: boolean) => void;
  // AI DJ
  aiDjMode: boolean;
  setAiDjMode: (enabled: boolean) => void;

  // Crossfade
  crossfadeDuration: number;
  setCrossfadeDuration: (duration: number) => void;

  // Internal Dual-Audio State
  _audioA: HTMLAudioElement | null;
  _audioB: HTMLAudioElement | null;
  _gainA: GainNode | null;
  _gainB: GainNode | null;
  _activeAudio: 'A' | 'B';
  _isCrossfading: boolean;
  _audioCtx: AudioContext | null;
  _eqNodes: BiquadFilterNode[];
  _vinylNode: BiquadFilterNode | null;
  _vinylNoiseNode: AudioBufferSourceNode | null;
  _vinylNoiseGain: GainNode | null;

  // FX Nodes

  _delayNode: DelayNode | null;
  _delayFeedbackNode: GainNode | null;
  _convolverNode: ConvolverNode | null;
  _reverbGainNode: GainNode | null;

  // FX State
  fxReverbWet: number;
  fxDelayTime: number;
  fxDelayFeedback: number;


  setFxReverb: (wet: number) => void;
  setFxDelay: (time: number, feedback: number) => void;


  // Actions
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
  initAudio: () => void;
  playSong: (song: Song) => Promise<void>;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  toggleShuffle: () => Promise<void>;
  toggleRepeat: () => Promise<void>;
  addToQueue: (song: Song) => void;
  setSleepTimer: (minutes: number) => void;
  cancelSleepTimer: () => void;
  fetchLyrics: () => Promise<void>;
  setShowLyrics: (show: boolean) => void;

  recordPlay: () => Promise<void>;
  playRadio: (seedSongId: number) => Promise<void>;
  reset: () => void;
  _handleCrossfadeAuto: () => Promise<void>;
  _sleepTimeout: NodeJS.Timeout | null;
  updateMediaSession: () => void;
  _logDuration: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  volume: 0.7,
  progress: 0,
  duration: 0,
  shuffle: false,
  repeat: 'off',
  queue: [],
  audio: null,
  analyser: null,
  isExpanded: false,
  sleepTimerEnd: null,
  lyrics: null,
  showLyrics: false,
  lastPlayStart: 0,
  isRemoteUpdate: false,
  isLoadingNext: false,

  visualizerColor: null,
  eqGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  vinylMode: false,
  aiDjMode: true,
  crossfadeDuration: 6, // Optimized for smooth transitions

  _audioA: null,
  _audioB: null,
  _gainA: null,
  _gainB: null,
  _sleepTimeout: null,
  _activeAudio: 'A',
  _isCrossfading: false,
  _audioCtx: null,
  _eqNodes: [],
  _vinylNode: null,
  _vinylNoiseNode: null,
  _vinylNoiseGain: null,

  // FX Nodes Init

  _delayNode: null,
  _delayFeedbackNode: null,
  _convolverNode: null,
  _reverbGainNode: null,

  fxReverbWet: 0,
  fxDelayTime: 0,
  fxDelayFeedback: 0,


  setFxReverb: (wet) => {
    set({ fxReverbWet: wet });
    const { _reverbGainNode } = get();
    if (_reverbGainNode) _reverbGainNode.gain.value = wet;
  },

  setFxDelay: (time, feedback) => {
    set({ fxDelayTime: time, fxDelayFeedback: feedback });
    const { _delayNode, _delayFeedbackNode } = get();
    if (_delayNode) _delayNode.delayTime.value = time;
    if (_delayFeedbackNode) _delayFeedbackNode.gain.value = feedback;
  },

  _logDuration: () => {
    const { currentSong, lastPlayStart } = get();
    if (currentSong && lastPlayStart > 0) {
      const duration = Math.round((Date.now() - lastPlayStart) / 1000);
      if (duration > 2 && localStorage.getItem('token')) {
        songsApi.logPlay(currentSong.id, duration).catch(err => console.error("Log play failed", err));
      }
    }
  },



  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
  setExpanded: (expanded: boolean) => set({ isExpanded: expanded }),

  initAudio: () => {
    if (typeof window !== 'undefined' && !get()._audioA) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();

      const createAudioNode = () => {
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.volume = get().volume;
        return audio;
      };

      const audioA = createAudioNode();
      const audioB = createAudioNode();

      const gainA = ctx.createGain();
      const gainB = ctx.createGain();
      gainA.gain.value = 1;
      gainB.gain.value = 0;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      const bands = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      const eqNodes: BiquadFilterNode[] = [];

      try {
        const eqInput = ctx.createGain();

        // Connect Sources (Common)
        // We use try/catch because sometimes creating source from same element twice throws
        try {
          const sourceA = ctx.createMediaElementSource(audioA);
          const sourceB = ctx.createMediaElementSource(audioB);
          sourceA.connect(gainA);
          sourceB.connect(gainB);
        } catch (e) { console.warn("MediaElementSource already connected?", e); }

        gainA.connect(eqInput);
        gainB.connect(eqInput);

        const isMobile = Capacitor.isNativePlatform();

        if (isMobile) {
          // --- MOBILE PATH (Lightweight) ---
          // Source -> Gain -> Analyser -> Destination
          // We bypass EQ, Delay, Reverb, Vinyl to prevent crackling on low-end devices

          eqInput.connect(analyser); // Connect from Gain sum to Analyser
          analyser.connect(ctx.destination);

          // Events
          const setupEvents = (audio: HTMLAudioElement) => {
            audio.addEventListener('timeupdate', () => {
              const state = get();
              if ((state._audioA === audio && state._activeAudio === 'A') ||
                (state._audioB === audio && state._activeAudio === 'B')) {
                set({ progress: audio.currentTime, duration: audio.duration || 0 });
                const timeLeft = audio.duration - audio.currentTime;
                if (timeLeft > 0 && timeLeft <= state.crossfadeDuration && !state._isCrossfading && state.queue.length > 0) {
                  get()._handleCrossfadeAuto();
                }
              }
            });
            audio.addEventListener('ended', () => {
              if (get()._isCrossfading) return;
              if (get().repeat === 'one') {
                get().recordPlay();
                audio.currentTime = 0;
                audio.play();
                return;
              }

              // CRITICAL FIX: Keep service alive during transition
              // Update notification BEFORE calling next() to prevent service termination
              set({ isLoadingNext: true });
              if (Capacitor.isNativePlatform()) {
                // Keep notification alive with current song but loading state
                updateNativeControls({ ...get(), isPlaying: true }, false);
              }
              get().next();
            });
            audio.addEventListener('play', () => { set({ isPlaying: true, lastPlayStart: Date.now() }); if (ctx.state === 'suspended') ctx.resume(); });
            audio.addEventListener('pause', () => {
              get()._logDuration();
              set({ lastPlayStart: 0 });
              if (!get()._isCrossfading && !get().isLoadingNext) set({ isPlaying: false });
            });
          };
          setupEvents(audioA);
          setupEvents(audioB);

          // Set State (Skip FX nodes)
          set({
            audio: audioA,
            analyser, // Enabled!
            _audioA: audioA,
            _audioB: audioB,
            _gainA: gainA,
            _gainB: gainB,
            _audioCtx: ctx,
            _activeAudio: 'A',
            _eqNodes: [],
            _vinylNode: null,
            _vinylNoiseNode: null,
            _vinylNoiseGain: null,
            _delayNode: null,
            _delayFeedbackNode: null,
            _convolverNode: null,
            _reverbGainNode: null
          });
          return;
        }

        // --- DESKTOP PATH (Full FX) ---
        let lastNode: AudioNode = eqInput;

        bands.forEach((freq, i) => {
          const filter = ctx.createBiquadFilter();
          filter.type = 'peaking';
          filter.frequency.value = freq;
          filter.Q.value = 1;
          filter.gain.value = get().eqGains[i];
          lastNode.connect(filter);
          eqNodes.push(filter);
          lastNode = filter;
        });

        // --- FX NODES ---
        // 1. Bitcrusher (ScriptProcessor)
        // 1. Distortion (WaveShaper) - Native Audio Node

        /* bitCrusherNode.onaudioprocess = (e) => {
          try {
            const depth = get().fxBitCrusher;
            const active = get().fxBitCrusherActive;
            const inputBuffer = e.inputBuffer;
            const outputBuffer = e.outputBuffer;

            // Bypass if inactive or invalid depth
            if (!active || !depth || depth < 1) {
              for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
                outputBuffer.getChannelData(channel).set(inputBuffer.getChannelData(channel));
              }
              return;
            }

            const step = Math.pow(0.5, depth);
            const invStep = 1 / step;

            for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
              const inputData = inputBuffer.getChannelData(channel);
              const outputData = outputBuffer.getChannelData(channel);

              for (let i = 0; i < bufferSize; i++) {
                outputData[i] = Math.round(inputData[i] * invStep) * step;
              }
            }
          } catch (err) {
             console.error(err);
          }
        }; */

        // 2. Delay
        // --- FX NODES (Conditional) ---
        // On Mobile, we skip heavy FX (Reverb, Delay, Vinyl) to prevent audio artifacts ("creaking")
        // On Mobile, we skip heavy FX (Reverb, Delay, Vinyl) to prevent audio artifacts ("creaking")

        // 2. Delay
        const delayNode = ctx.createDelay(5.0);
        const delayFeedback = ctx.createGain();
        delayNode.delayTime.value = 0;
        delayFeedback.gain.value = 0;

        // 3. Reverb
        const convolverNode = ctx.createConvolver();
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * 3; // 3 seconds tail
        const impulse = ctx.createBuffer(2, length, sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const channelData = impulse.getChannelData(channel);
          for (let i = 0; i < length; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
          }
        }
        convolverNode.buffer = impulse;

        const reverbGain = ctx.createGain();
        reverbGain.gain.value = 0;

        const dryGain = ctx.createGain();
        dryGain.gain.value = 1;

        // Vinyl Node
        const vinylFilter = ctx.createBiquadFilter();
        vinylFilter.type = 'lowpass';
        vinylFilter.frequency.value = get().vinylMode ? 2000 : 22000;

        // --- CONNECT FX CHAIN ---
        // EQ Output -> Delay Input (Distortion Removed)
        lastNode.connect(delayNode);

        // Delay Loop
        delayNode.connect(delayFeedback);
        delayFeedback.connect(delayNode);

        // EQ Output -> Reverb Input (Distortion Removed)
        lastNode.connect(convolverNode);

        // Main signal path (Dry)
        lastNode.connect(dryGain);

        // Connect Wet Signals to Summing Point (Vinyl)
        dryGain.connect(vinylFilter);
        delayNode.connect(vinylFilter);
        reverbGain.connect(vinylFilter);
        convolverNode.connect(reverbGain);

        // Update "lastNode" pointer for final connection
        // (Vinyl is now the last processor before destination)
        lastNode = vinylFilter;




        const generateNoise = () => {
          const bufferSize = 2 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            const crackle = Math.random() > 0.999 ? (Math.random() * 2 - 1) * 0.5 : 0;
            output[i] = (white * 0.01) + crackle;
          }
          return noiseBuffer;
        };

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = generateNoise();
        noiseNode.loop = true;
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = get().vinylMode ? 0.2 : 0;
        noiseNode.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseNode.start();

        lastNode.connect(analyser);
        analyser.connect(ctx.destination);

        const setupEvents = (audio: HTMLAudioElement) => {
          audio.addEventListener('timeupdate', () => {
            const state = get();
            if ((state._audioA === audio && state._activeAudio === 'A') ||
              (state._audioB === audio && state._activeAudio === 'B')) {
              set({ progress: audio.currentTime, duration: audio.duration || 0 });

              // --- GUEST MODE LIMIT CHECK ---
              // Check token manually or use store check if available
              // Force pause if no token found
              if (!localStorage.getItem('token') && audio.currentTime > 30) {
                if (!audio.paused) {
                  audio.pause();
                  toast.error("⏱️ Guest Preview Limit Reached. Sign up to hear the full track!", { duration: 5000 });
                  set({ isPlaying: false });
                }
                // Lock time to 30 so they can't scrub past
                if (audio.currentTime > 30.5) {
                  audio.currentTime = 30;
                }
                return;
              }
              // -----------------------------

              const timeLeft = audio.duration - audio.currentTime;
              if (timeLeft > 0 && timeLeft <= state.crossfadeDuration && !state._isCrossfading && state.queue.length > 0) {
                get()._handleCrossfadeAuto();
              }
            }
          });

          audio.addEventListener('ended', () => {
            if (get()._isCrossfading) return;

            // Handle Repeat One
            if (get().repeat === 'one') {
              get().recordPlay();
              audio.currentTime = 0;
              audio.play();
              return;
            }

            // CRITICAL FIX: Keep service alive during transition
            // Set isLoadingNext BEFORE calling next() to prevent service termination
            // Update notification to keep foreground service active
            set({ isLoadingNext: true });
            if (Capacitor.isNativePlatform()) {
              // Keep notification alive with current song info, maintain isPlaying: true
              updateNativeControls({ ...get(), isPlaying: true }, false);
            }
            get().next();
          });

          audio.addEventListener('play', () => {
            set({ isPlaying: true, lastPlayStart: Date.now() });
            if (ctx.state === 'suspended') ctx.resume();
          });

          audio.addEventListener('pause', () => {
            get()._logDuration();
            set({ lastPlayStart: 0 });
            // CRITICAL FIX: Do NOT set IsPlaying False if we are loading next song
            // This prevents the OS from killing the background service
            if (!get()._isCrossfading && !get().isLoadingNext) {
              set({ isPlaying: false });
            }
          });
        };

        setupEvents(audioA);
        setupEvents(audioB);

        set({
          audio: audioA,
          analyser,
          _audioA: audioA,
          _audioB: audioB,
          _gainA: gainA,
          _gainB: gainB,
          _audioCtx: ctx,
          _eqNodes: eqNodes,
          _vinylNode: vinylFilter,
          _vinylNoiseNode: noiseNode,
          _vinylNoiseGain: noiseGain,
          _activeAudio: 'A',

          // FX Node Refs

          _delayNode: delayNode,
          _delayFeedbackNode: delayFeedback,
          _convolverNode: convolverNode,
          _reverbGainNode: reverbGain
        });
      } catch (e) {
        console.error("Audio init error:", e);
      }
    }
  },

  playSong: async (song: Song) => {
    get()._logDuration(); // Log previous song if any
    set({ lastPlayStart: 0 });
    get().recordPlay();
    const { _audioA, initAudio } = get();
    if (!_audioA) initAudio();

    const state = get();
    const ctx = state._audioCtx;
    if (!ctx) return;

    set({ _isCrossfading: false, isLoadingNext: false });
    const active = state._activeAudio;
    const audio = active === 'A' ? state._audioA : state._audioB;
    const oppositeAudio = active === 'A' ? state._audioB : state._audioA;
    const activeGain = active === 'A' ? state._gainA : state._gainB;
    const oppositeGain = active === 'A' ? state._gainB : state._gainA;

    if (!audio || !oppositeAudio) {
      console.error("Audio initialization failed: Missing nodes", { audio, activeGain });
      toast.error("Audio engine failed to initialize. Please restart the app.");
      return;
    }

    try {
      let data;
      const token = localStorage.getItem('token');
      let useBackend = !!token;

      if (useBackend) {
        try {
          const res = await playerApi.play(song.id);
          data = res.data;
        } catch (err: any) {
          // If Auth failed (401/422), fallback to Guest Mode immediately
          if (err.response && (err.response.status === 401 || err.response.status === 422)) {
            console.warn("Backend handshake failed (stale token), playing locally.");
            useBackend = false;
          } else {
            throw err; // Real error (network, 500, etc)
          }
        }
      }

      if (!useBackend) {
        // Guest / Fallback
        data = {
          audio: songsApi.stream(song.id),
          cover: song.cover
        };
      }

      if (activeGain && oppositeGain) {
        activeGain.gain.setValueAtTime(1, ctx.currentTime);
        oppositeGain.gain.setValueAtTime(0, ctx.currentTime);
      }
      oppositeAudio.pause();

      audio.src = data.audio || songsApi.stream(song.id);
      audio.load();
      await audio.play();

      set({
        currentSong: { ...song, cover: data.cover || song.cover, audio: data.audio },
        isPlaying: true,
        audio: audio,
        lyrics: null // Reset lyrics for new song
      });

      // Force notification update immediately after song change
      // This ensures notifications update reliably during auto-advance
      if (Capacitor.isNativePlatform()) {
        updateNativeControls(get(), true);
      }

      // ALWAYS Auto-fetch lyrics for next song so they are ready
      get().fetchLyrics();

      // DISPATCH JAM SYNC (IMPERATIVE)
      if (typeof window !== 'undefined') {
        // This bridges PlayerStore -> JamManager without circular deps
        window.dispatchEvent(new CustomEvent('krew:play', {
          detail: { songId: song.id, position: 0 }
        }));
      }

    } catch (e: any) {
      const isInterruption = e.message?.includes('interrupted by a new load request') || e.name === 'AbortError';
      if (isInterruption) {
        console.warn('Play interrupted by new load (harmless)');
        return;
      }
      console.error('Play failed', e);
      toast.error(`Playback failed: ${e.message || 'Unknown error'}`);
    }
  },

  _handleCrossfadeAuto: async () => {
    if (get()._isCrossfading) return;
    set({ _isCrossfading: true });

    const state = get();
    const duration = state.crossfadeDuration;
    const ctx = state._audioCtx;
    if (!ctx) return;

    let nextSong: Song | null = null;
    try {
      const res = await playerApi.next();
      if (res.data && res.data.id) {
        nextSong = { id: res.data.id, title: res.data.title, artist: res.data.artist, cover: res.data.cover || null, audio: res.data.audio };
      }
    } catch (e) { console.error("Crossfade: next fetch failed", e); }

    if (!nextSong) { set({ _isCrossfading: false }); return; }

    const incoming = state._activeAudio === 'A' ? 'B' : 'A';
    const outgoing = state._activeAudio;
    const incomingAudio = incoming === 'A' ? state._audioA : state._audioB;
    const outgoingAudio = outgoing === 'A' ? state._audioA : state._audioB;
    const incomingGain = incoming === 'A' ? state._gainA : state._gainB;
    const outgoingGain = outgoing === 'A' ? state._gainA : state._gainB;

    if (!incomingAudio || !outgoingAudio) { set({ _isCrossfading: false }); return; }

    // AI DJ BEATMATCH
    let startDelay = 0;
    if (state.aiDjMode) {
      // 1. Ensure BPMs (Mocking for now if not present)
      if (!state.currentSong?.bpm) state.currentSong!.bpm = 120 + Math.floor(Math.random() * 20);
      if (!nextSong.bpm) nextSong.bpm = 120 + Math.floor(Math.random() * 20);

      const bpmA = state.currentSong!.bpm!;
      const bpmB = nextSong.bpm!;

      // 2. Adjust Pitch (Sync tempo)
      incomingAudio.playbackRate = bpmA / bpmB;

      // 3. Phase Alignment (Align to next 4-beat bar)
      const beatDuration = 60 / bpmA;
      const barDuration = beatDuration * 4;
      const progress = outgoingAudio.currentTime;
      const timeInBar = progress % barDuration;
      startDelay = barDuration - timeInBar;

      console.log(`[AI DJ] Syncing ${nextSong.title} to ${state.currentSong?.title}`);
      console.log(`[AI DJ] Pitch: ${incomingAudio.playbackRate.toFixed(2)}x | Offset: ${startDelay.toFixed(2)}s`);

      if (startDelay > 2) startDelay = 0; // Guard against long waits
    } else {
      incomingAudio.playbackRate = 1.0;
    }

    incomingAudio.src = nextSong.audio as string;
    incomingAudio.load();
    if (incomingGain) incomingGain.gain.setValueAtTime(0, ctx.currentTime);

    setTimeout(async () => {
      try {
        await incomingAudio.play();
        const now = ctx.currentTime;
        const fadeEndTime = now + duration;

        // ✨ EQUAL-POWER CROSSFADE: Smooth linear ramps
        // This prevents volume dips in the middle of the transition
        // Outgoing: 1 → 0 (fade out)
        if (outgoingGain) {
          outgoingGain.gain.cancelScheduledValues(now);
          outgoingGain.gain.setValueAtTime(1, now);
          outgoingGain.gain.linearRampToValueAtTime(0, fadeEndTime);
        }

        // Incoming: 0 → 1 (fade in)
        if (incomingGain) {
          incomingGain.gain.cancelScheduledValues(now);
          incomingGain.gain.setValueAtTime(0, now);
          incomingGain.gain.linearRampToValueAtTime(1, fadeEndTime);
        }

        set({ currentSong: nextSong, _activeAudio: incoming, audio: incomingAudio, lyrics: null });

        // ALWAYS Auto-fetch lyrics for next song so they are ready
        get().fetchLyrics();

        setTimeout(() => {
          outgoingAudio.pause();
          outgoingAudio.currentTime = 0;
          set({ _isCrossfading: false });
        }, duration * 1000);
      } catch (e) { console.error("Crossfade playback error", e); set({ _isCrossfading: false }); }
    }, startDelay * 1000);
  },

  togglePlay: () => {
    const { _activeAudio, _audioA, _audioB, currentSong, playSong } = get();
    const audio = _activeAudio === 'A' ? _audioA : _audioB;

    if (!audio) {
      console.warn("togglePlay: Audio element missing (page reload?), restarting song.");
      if (currentSong) {
        toast.info("Resuming session...");
        playSong(currentSong);
      }
      return;
    }

    if (get().isPlaying) audio.pause();
    else audio.play();
  },

  pause: () => {
    const audio = get()._activeAudio === 'A' ? get()._audioA : get()._audioB;
    audio?.pause();
    set({ isPlaying: false });
  },

  resume: () => {
    const audio = get()._activeAudio === 'A' ? get()._audioA : get()._audioB;
    audio?.play();
    set({ isPlaying: true });
  },



  seek: (time: number) => {
    const audio = get()._activeAudio === 'A' ? get()._audioA : get()._audioB;
    if (audio) audio.currentTime = time;
  },

  setVolume: (volume: number) => {
    set({ volume });
    const { _audioA, _audioB } = get();
    if (_audioA) _audioA.volume = volume;
    if (_audioB) _audioB.volume = volume;
    if (window.electronAPI) window.electronAPI.setSystemVolume(Math.round(volume * 100));
  },

  setProgress: (progress: number) => {
    const audio = get()._activeAudio === 'A' ? get()._audioA : get()._audioB;
    if (audio) audio.currentTime = progress;
    set({ progress });
  },

  toggleShuffle: async () => {
    const newShuffle = !get().shuffle;
    try { await playerApi.shuffle(newShuffle); set({ shuffle: newShuffle }); } catch (e) { console.error(e); }
  },

  toggleRepeat: async () => {
    const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
    const nextIdx = (modes.indexOf(get().repeat) + 1) % 3;
    const newMode = modes[nextIdx];
    try { await playerApi.repeat(newMode); set({ repeat: newMode }); } catch (e) { console.error(e); }
  },

  addToQueue: (song: Song) => {
    set((state) => ({ queue: [...state.queue, song] }));
    if (localStorage.getItem('token')) {
      playerApi.addToQueue(song.id).catch(() => { });
    }
  },



  recordPlay: async () => {
    const { currentSong } = get();
    // Guest check
    if (!localStorage.getItem('token')) return;

    if (currentSong) {
      playerApi.recordPlay(currentSong.id).catch((e) => {
        console.error("Record Play Failed", e);
        // Silent fail for guests
      });
    }
  },

  playRadio: async (seedSongId: number) => {
    try {
      const res = await radioApi.song(seedSongId);
      const songs = res.data;
      if (!songs || songs.length === 0) return;

      const isGuest = !localStorage.getItem('token');

      if (!isGuest) {
        await playerApi.modifyQueue('clear', {});
      }

      get().playSong(songs[0]);

      if (!isGuest) {
        for (const s of songs.slice(1)) await playerApi.addToQueue(s.id);
      }

      set({ queue: songs.slice(1) });
    } catch (e) { console.error(e); }
  },

  reset: () => {
    const { _audioA, _audioB } = get();
    if (_audioA) { _audioA.pause(); _audioA.src = ''; }
    if (_audioB) { _audioB.pause(); _audioB.src = ''; }
    set({ currentSong: null, isPlaying: false, progress: 0, duration: 0, queue: [], _isCrossfading: false });
    get().cancelSleepTimer();
  },

  setSleepTimer: (minutes: number) => {
    const { cancelSleepTimer } = get();
    cancelSleepTimer();
    const end = Date.now() + minutes * 60 * 1000;
    const timeout = setTimeout(() => {
      get().pause();
      set({ sleepTimerEnd: null, _sleepTimeout: null });
    }, minutes * 60 * 1000);
    set({ sleepTimerEnd: end, _sleepTimeout: timeout });
  },

  cancelSleepTimer: () => {
    const { _sleepTimeout } = get();
    if (_sleepTimeout) clearTimeout(_sleepTimeout);
    set({ sleepTimerEnd: null, _sleepTimeout: null });
  },

  setVisualizerColor: (color: string | null) => set({ visualizerColor: color }),
  setEqBand: (index: number, gain: number) => {
    const newGains = [...get().eqGains];
    newGains[index] = gain;
    set({ eqGains: newGains });
    const nodes = get()._eqNodes;
    if (nodes[index]) nodes[index].gain.setTargetAtTime(gain, get()._audioCtx?.currentTime || 0, 0.05);
  },
  setVinylMode: (enabled: boolean) => {
    set({ vinylMode: enabled });
    const node = get()._vinylNode;
    const noiseGain = get()._vinylNoiseGain;
    const now = get()._audioCtx?.currentTime || 0;
    if (node) node.frequency.setTargetAtTime(enabled ? 2000 : 22000, now, 0.1);
    if (noiseGain) noiseGain.gain.setTargetAtTime(enabled ? 0.2 : 0, now, 0.2);
  },
  setCrossfadeDuration: (duration: number) => set({ crossfadeDuration: duration }),

  setAiDjMode: (enabled: boolean) => {
    set({ aiDjMode: enabled });
    const { audio } = get();
    if (audio && !enabled) audio.playbackRate = 1.0;
  },

  fetchLyrics: async () => {
    const { currentSong } = get();
    if (!currentSong) return;

    // Only set loading if not already showing something useful to avoid flickering, 
    // or just a subtle indicator. But here we reset.
    set({ lyrics: "Searching for lyrics..." });

    try {
      const query = `${currentSong.title} ${currentSong.artist}`;
      const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const best = data[0];
        set({ lyrics: best.syncedLyrics || best.plainLyrics || "No lyrics found for this track." });
      } else {
        // Fun randomized "no lyrics" messages
        const noLyricsMessages = [
          "Yeah… we looked. Hard. Lyrics said \"nah\".",
          "Lyrics are currently on vacation. No return date.",
          "This song is too mysterious for words apparently.",
          "We searched the database. The database searched back. Nothing.",
          "Lyrics not found. Imagination unlocked 🔓",
          "Even the internet shrugged on this one.",
          "These lyrics are in another universe.",
          "Guess the lyrics today. Winner gets nothing.",
          "Lyrics said \"I'm not feeling it today\".",
          "This song communicates through vibes, not words.",
          "We asked politely. Lyrics ghosted us.",
          "Lyrics unavailable. Start humming.",
          "The lyrics ran away mid-chorus.",
          "This track is instrumental… emotionally.",
          "No lyrics found. Make something up and commit to it.",
          "Lyrics are loading… just kidding.",
          "Somewhere out there, the lyrics exist. Just not here.",
          "The singer forgot the words too, don't worry.",
          "This song speaks in feelings, not sentences.",
          "Lyrics not found. Sing \"la la la\" confidently.",
          "Even Google said \"bro idk\".",
          "The lyrics are shy today.",
          "We checked. Twice. Thrice. Still nope.",
          "These lyrics are classified information.",
          "Lyrics.exe has stopped working.",
          "This song chose silence.",
          "If vibes were words, this would be a novel.",
          "Lyrics missing. Aura present.",
          "Congrats, you unlocked freestyle mode.",
          "No lyrics found — make it deep in your head."
        ];
        const randomMessage = noLyricsMessages[Math.floor(Math.random() * noLyricsMessages.length)];
        set({ lyrics: randomMessage });
      }
    } catch (e) {
      console.error("Lyrics fetch error:", e);
      set({ lyrics: "Failed to connect to lyrics engine." });
    }
  },

  setShowLyrics: (show: boolean) => {
    set({ showLyrics: show });
    if (show && !get().lyrics) {
      get().fetchLyrics();
    }
  },

  next: async () => {
    // Client-side Next Logic
    const { queue, currentSong, shuffle } = get();
    let nextSong: Song | null = null;

    const isGuest = !localStorage.getItem('token');

    // 1. Try local queue first (Priority for everyone)
    if (queue.length > 0) {
      nextSong = queue[0];
      set({ queue: queue.slice(1) });
    }
    // 2. If no queue, try backend for Auth Users
    else if (!isGuest) {
      try {
        const res = await playerApi.next();
        if (res.data && res.data.id) {
          nextSong = { ...res.data, cover: res.data.cover || null, audio: res.data.audio };
        }
      } catch (e) {
        console.warn("Backend next failed", e);
      }
    }

    // 3. Play if found
    if (nextSong) {
      await get().playSong(nextSong);
    } else {
      // Stop if nothing next
      set({ isPlaying: false });
      toast.info("End of queue");
    }
  },

  prev: async () => {
    // Restart song if > 3s
    const audio = get()._activeAudio === 'A' ? get()._audioA : get()._audioB;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    const isGuest = !localStorage.getItem('token');

    if (!isGuest) {
      try {
        await playerApi.prev();
      } catch (e) { console.warn("Backend prev failed", e); }
    }
    // Simple seek 0 for now
    if (audio) audio.currentTime = 0;
  },

  // Helper to update Media Session Metadata
  updateMediaSession: () => {
    if (!('mediaSession' in navigator)) return;
    const { currentSong, isPlaying } = get();
    if (!currentSong) return;

    // Set metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.album || 'Krew Mobile',
      artwork: [
        { src: currentSong.cover ? (currentSong.cover.startsWith('http') ? currentSong.cover : `${API_URL}${API_URL.endsWith('/') ? '' : '/'}/covers/${currentSong.cover.startsWith('/') ? currentSong.cover.slice(1) : currentSong.cover}`) : 'https://via.placeholder.com/512', sizes: '512x512', type: 'image/jpeg' }
      ]
    });

    // Set playback state
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Set handlers (idempotent, can call multiple times)
    navigator.mediaSession.setActionHandler('play', () => {
      get().resume();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      get().pause();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      get().prev();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      get().next();
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime && details.fastSeek === undefined) {
        get().seek(details.seekTime);
        get().setProgress(details.seekTime);
      }
    });
  },

}));

// Subscribe to state changes to update Media Session (Native Plugin Version)
import { Capacitor } from '@capacitor/core';
import { CapacitorMusicControls as MusicControls } from 'capacitor-music-controls-plugin-v3';

let isControlsCreated = false;
let nativePreviousSongId: number | null = null;
let nativePreviousIsPlaying: boolean | null = null;

// Helper to create/update controls
const updateNativeControls = async (state: PlayerState, songChanged: boolean = false) => {
  if (!Capacitor.isNativePlatform() || !state.currentSong) return;

  const { currentSong, isPlaying } = state;

  // Construct robust cover URL
  const coverUrl = currentSong.cover
    ? (currentSong.cover.startsWith('http')
      ? currentSong.cover
      : `${API_URL}${API_URL.endsWith('/') ? '' : '/'}/covers/${currentSong.cover.startsWith('/') ? currentSong.cover.slice(1) : currentSong.cover}`)
    : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=512&h=512&fit=crop';

  try {
    if (!isControlsCreated) {
      await MusicControls.create({
        track: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album || 'Krew Mobile',
        cover: coverUrl,
        isPlaying: isPlaying,
        dismissable: false,
        hasPrev: true,
        hasNext: true,
        hasClose: true,
        playIcon: 'media_play',
        pauseIcon: 'media_pause',
        prevIcon: 'media_prev',
        nextIcon: 'media_next',
        closeIcon: 'media_close',
        notificationIcon: 'notification'
      });
      isControlsCreated = true;

      // Register events ONLY once
      // Register events via document listener (Legacy Plugin Style)
      const onControls = (e: any) => {
        const message = e.message || (e.detail && e.detail.message) || (e.detail);
        const store = usePlayerStore.getState();

        switch (message) {
          case 'music-controls-next':
            store.next();
            break;
          case 'music-controls-previous':
            store.prev();
            break;
          case 'music-controls-pause':
            store.pause();
            break;
          case 'music-controls-play':
            store.resume();
            break;
          case 'music-controls-destroy':
            // User swiped away (if dismissable) or closed
            store.pause();
            break;
          case 'music-controls-toggle-play-pause': // Headset events
            if (store.isPlaying) store.pause();
            else store.resume();
            break;
        }
      };
      document.addEventListener('controlsNotification', onControls);
    } else {
      // Song changed OR playback state changed
      // CRITICAL FIX: Do NOT destroy notification during song change!
      // Destroying causes Android to kill the background service.
      // Instead, call create() again which updates the existing notification.
      if (songChanged) {
        await MusicControls.create({
          track: currentSong.title,
          artist: currentSong.artist,
          album: currentSong.album || 'Krew Mobile',
          cover: coverUrl,
          isPlaying: isPlaying,
          dismissable: false,
          hasPrev: true,
          hasNext: true,
          hasClose: true,
          playIcon: 'media_play',
          pauseIcon: 'media_pause',
          prevIcon: 'media_prev',
          nextIcon: 'media_next',
          closeIcon: 'media_close',
          notificationIcon: 'notification'
        });
      } else {
        // Just playback state changed: Update isPlaying only
        await MusicControls.updateIsPlaying({ isPlaying: isPlaying });
      }
    }
  } catch (e) {
    console.error("Error updating music controls", e);
  }
};

usePlayerStore.subscribe((state) => {
  if (!state.currentSong) return;

  const currentSongId = state.currentSong.id;
  const isPlaying = state.isPlaying;

  // 1. Song Changed -> Update Controls with new metadata
  if (currentSongId !== nativePreviousSongId) {
    nativePreviousSongId = currentSongId;
    updateNativeControls(state, true); // Pass true for songChanged
  }
  // 2. Playback State Changed -> Update isPlaying only
  else if (nativePreviousIsPlaying !== isPlaying) {
    nativePreviousIsPlaying = isPlaying;
    updateNativeControls(state, false); // Pass false for songChanged
  }
});

// Subscribe to state changes to update Media Session (Web API Version)
// We track previous state to avoid redundant updates (especially on progress)
let webPreviousSongId: number | null = null;
let webPreviousIsPlaying: boolean | null = null;

usePlayerStore.subscribe((state) => {
  if (!('mediaSession' in navigator) || !state.currentSong) return;

  const currentSongId = state.currentSong.id;
  const isPlaying = state.isPlaying;

  // 1. Update Metadata Only if Song Changed
  if (currentSongId !== webPreviousSongId) {
    webPreviousSongId = currentSongId;

    // Construct robust cover URL or use a safe internet placeholder
    const coverUrl = state.currentSong.cover
      ? (state.currentSong.cover.startsWith('http')
        ? state.currentSong.cover
        : `${API_URL}${API_URL.endsWith('/') ? '' : '/'}/covers/${state.currentSong.cover.startsWith('/') ? state.currentSong.cover.slice(1) : state.currentSong.cover}`)
      : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=512&h=512&fit=crop'; // Safe placeholder

    // Debug Toast for notification logic (Can remove later)
    // console.log("[MediaSession] Updating Metadata:", state.currentSong.title);

    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.currentSong.title,
      artist: state.currentSong.artist,
      album: state.currentSong.album || 'Krew Mobile',
      artwork: [
        { src: coverUrl, sizes: '512x512', type: 'image/jpeg' },
        { src: coverUrl, sizes: '96x96', type: 'image/jpeg' }
      ]
    });

    // Re-bind actions (Idempotent, safe to do on song change)
    navigator.mediaSession.setActionHandler('play', () => usePlayerStore.getState().resume());
    navigator.mediaSession.setActionHandler('pause', () => usePlayerStore.getState().pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => usePlayerStore.getState().prev());
    navigator.mediaSession.setActionHandler('nexttrack', () => usePlayerStore.getState().next());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime && details.fastSeek === undefined) {
        usePlayerStore.getState().seek(details.seekTime);
        usePlayerStore.getState().setProgress(details.seekTime);
      }
    });
  }

  // 2. Update Playback State Only if Changed
  if (webPreviousIsPlaying !== isPlaying) {
    webPreviousIsPlaying = isPlaying;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Important: Update position state if supported
    if ('setPositionState' in navigator.mediaSession) {
      navigator.mediaSession.setPositionState({
        duration: state.duration || 0,
        playbackRate: 1.0,
        position: state.progress || 0
      });
    }
  }
});
