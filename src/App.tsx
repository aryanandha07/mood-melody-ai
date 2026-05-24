import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Music,
  Heart,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Compass,
  Sparkles,
  Radio,
  Check,
  CheckCircle,
  ExternalLink,
  User,
  LogOut,
  ArrowLeft,
  ArrowRight,
  Shuffle,
  Loader2,
  HelpCircle,
  Sliders,
  Globe,
  Search,
  Youtube,
} from "lucide-react";
import { Track, MusicRegion, MoodEmotion, EnergyLevel, MoodPrefState, SpotifyUser } from "./types";

// Static Options Data
const REGIONS: { value: MusicRegion; label: string; desc: string; icon: string }[] = [
  { value: "Indian", label: "Indian Style", desc: "Bollywood, Punjabi beats, Classical fusion & Sufi acoustics", icon: "🇮🇳" },
  { value: "Western", label: "Western Era", desc: "Hip-Hop, Indie Rock, Synthwave & R&B soundscapes", icon: "🇪🇺" },
  { value: "K-pop", label: "K-pop Wave", desc: "Sleek Korean dance-pop, ballads & retro Synth-Pop jams", icon: "🇰🇷" },
  { value: "Global Pop", label: "Global Pop", desc: "Afrobeats, Latin Reggaeton, Europop rhythms & modern J-Pop", icon: "🌐" },
];

const GENRES_BY_REGION: Record<MusicRegion, string[]> = {
  "Indian": ["Bollywood", "Indie Pop", "Punjabi Pop", "Sufi Waves", "Classical Fusion"],
  "Western": ["Hip-Hop", "Pop / Synthwave", "R&B / Soul", "Alternative Rock", "Lo-Fi Beats"],
  "K-pop": ["K-Pop Dance", "Korean R&B", "K-Rock & Indie", "City Pop", "K-HipHop / Rap"],
  "Global Pop": ["Latin Reggaeton", "Afrobeats / Amapiano", "Europop", "J-Pop", "Acoustic Pop"],
};

const EMOTIONS: { value: MoodEmotion; label: string; desc: string; colorClass: string }[] = [
  { value: "Happy", label: "Happy", desc: "Bright, uplifting, instant endorphins", colorClass: "from-amber-400 to-orange-500 shadow-amber-950/20" },
  { value: "Calm", label: "Calm", desc: "Chill, ambient, soothing frequency loops", colorClass: "from-emerald-400 to-teal-500 shadow-teal-950/20" },
  { value: "Motivated", label: "Motivated", desc: "Assertive, driving progress patterns", colorClass: "from-blue-400 to-indigo-600 shadow-indigo-950/20" },
  { value: "Heartbroken", label: "Heartbroken", desc: "Melancholic, healing, deep acoustics", colorClass: "from-rose-500 to-purple-600 shadow-rose-950/20" },
  { value: "Focused", label: "Focused", desc: "Minimal, cognitive binaural noise-pads", colorClass: "from-cyan-400 to-teal-600 shadow-cyan-950/20" },
  { value: "Energetic", label: "Energetic", desc: "Vibrant, high-amplitude club energy", colorClass: "from-fuchsia-500 to-pink-600 shadow-pink-950/20" },
  { value: "Romantic", label: "Romantic", desc: "Intimate, warm, gorgeous melodies", colorClass: "from-rose-400 to-pink-500 shadow-rose-950/25" },
];

const ENERGIES: { value: EnergyLevel; label: string; desc: string; meter: number }[] = [
  { value: "Chill & Low", label: "Chill & Low", desc: "Cozy background states & deep relaxation rhythms", meter: 1 },
  { value: "Steady & Mid", label: "Steady & Mid", desc: "Moderate rhythm levels perfect for casual daily focus", meter: 2 },
  { value: "Vibrant & High", label: "Vibrant & High", desc: "High-voltage tracks triggering max physical momentum", meter: 3 },
];

export default function App() {
  // Navigation Steps
  // 0: Landing Dashboard
  // 1: Region/Style Selection Page
  // 2: Genre Selection Page
  // 3: Emotional Target Selection
  // 4: Audio Energy Level Selection
  // 5: Optional Playlist Customization & Trigger
  // 6: Curated Playlist Results Page
  const [step, setStep] = useState<number>(0);

  // Preference Draft State
  const [prefState, setPrefState] = useState<MoodPrefState>({
    region: "Western",
    genre: "Pop / Synthwave",
    emotion: "Happy",
    energy: "Steady & Mid",
    customPrefs: "",
  });

  // Spotify Authentication State
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(() => {
    try {
      const saved = localStorage.getItem("mood_melody_spotify_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [spotifyToken, setSpotifyToken] = useState<string | null>(() => {
    return localStorage.getItem("mood_melody_spotify_token") || null;
  });

  // Spotify vs YTM client toggles
  const [servicePreference, setServicePreference] = useState<"spotify" | "youtube">("spotify");

  // Playlist Recommendations Outcome
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Audio Playback state (Mode A: 30-sec Preview HTML5 Audio Player)
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Playback Help State
  const [showPlaybackHelp, setShowPlaybackHelp] = useState<boolean>(false);

  // Sync state variables across storage
  useEffect(() => {
    if (spotifyUser) {
      localStorage.setItem("mood_melody_spotify_user", JSON.stringify(spotifyUser));
    } else {
      localStorage.removeItem("mood_melody_spotify_user");
    }
  }, [spotifyUser]);

  useEffect(() => {
    if (spotifyToken) {
      localStorage.setItem("mood_melody_spotify_token", spotifyToken);
    } else {
      localStorage.removeItem("mood_melody_spotify_token");
    }
  }, [spotifyToken]);

  // Create persistent single HTML5 Audio element to prevent autoplay block on track transitions
  useEffect(() => {
    const audioObj = new Audio();
    audioObj.volume = audioVolume;
    audioObj.loop = true;

    const handleOnPlay = () => setIsPlaying(true);
    const handleOnPause = () => setIsPlaying(false);

    audioObj.addEventListener("play", handleOnPlay);
    audioObj.addEventListener("pause", handleOnPause);

    audioRef.current = audioObj;

    return () => {
      audioObj.pause();
      audioObj.removeEventListener("play", handleOnPlay);
      audioObj.removeEventListener("pause", handleOnPause);
    };
  }, []);

  // Audio player src transition setup & state observers
  useEffect(() => {
    if (recommendedTracks.length > 0 && recommendedTracks[currentTrackIndex] && audioRef.current) {
      const track = recommendedTracks[currentTrackIndex];
      
      // Stop current play execution
      audioRef.current.pause();
      
      // Change source dynamically
      if (audioRef.current.src !== track.previewUrl) {
        audioRef.current.src = track.previewUrl;
      }
      
      audioRef.current.volume = audioVolume;

      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.warn("Autoplay transition was blocked by browser policies:", err);
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrackIndex, recommendedTracks]);

  // Observe manual play/pause changes
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Synchronously set track src if empty to ensure it plays
      if (!audioRef.current.src && recommendedTracks.length > 0) {
        audioRef.current.src = recommendedTracks[currentTrackIndex].previewUrl;
      }
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Blocked audio autoplay until direct user play interaction:", err);
        setIsPlaying(false);
      });
    }
  };

  const handleNextTrack = () => {
    if (recommendedTracks.length === 0) return;
    const nextIdx = (currentTrackIndex + 1) % recommendedTracks.length;
    setCurrentTrackIndex(nextIdx);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = recommendedTracks[nextIdx].previewUrl;
      audioRef.current.volume = audioVolume;
      audioRef.current.play().catch((err) => {
        console.warn("Next track play blocked:", err);
      });
    }
  };

  const handlePrevTrack = () => {
    if (recommendedTracks.length === 0) return;
    const prevIdx = (currentTrackIndex - 1 + recommendedTracks.length) % recommendedTracks.length;
    setCurrentTrackIndex(prevIdx);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = recommendedTracks[prevIdx].previewUrl;
      audioRef.current.volume = audioVolume;
      audioRef.current.play().catch((err) => {
        console.warn("Prev track play blocked:", err);
      });
    }
  };

  const handleVolumeChange = (v: number) => {
    setAudioVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  // ---------------------------------------------------------
  // Connect Spotify OAuth Popup trigger (real/simulated)
  // ---------------------------------------------------------
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const handleConnectSpotify = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/auth/spotify/url");
      if (!response.ok) {
        throw new Error("Failed to pull Spotify URL");
      }
      const { url } = await response.json();

      // Open popup exactly aligned with oauth guidelines
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authWindow = window.open(
        url,
        "mood_melody_spotify_connect",
        `width=${width},height=${height},left=${left},top=${top},status=0,resizable=1`
      );

      if (!authWindow) {
        alert("Pop-up blocked. Please enable pop-ups to pair Mood Melody with Spotify.");
        setIsConnecting(false);
      }
    } catch (err) {
      console.error("Connect error:", err);
      alert("Trouble reaching authorization server. Connected with standard fallback.");
      setIsConnecting(false);
    }
  };

  // Listen for iframe / popup event messages securely
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      // Allow relative or Run App sandbox domain matches safely
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        return;
      }

      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        const { user, accessToken } = event.data;
        if (user) {
          setSpotifyUser(user);
        } else {
          // Absolute fallback profile
          setSpotifyUser({
            id: "sim_spotify_user",
            displayName: "VibeSeeker_633",
            imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80",
            product: "premium"
          });
        }
        if (accessToken) {
          setSpotifyToken(accessToken);
        } else {
          setSpotifyToken("simulated_access_token_xyz");
        }
        setIsConnecting(false);
      }
    };

    window.addEventListener("message", handleAuthMessage);
    return () => window.removeEventListener("message", handleAuthMessage);
  }, []);

  const handleLogOutSpotify = () => {
    setSpotifyUser(null);
    setSpotifyToken(null);
    localStorage.removeItem("mood_melody_spotify_user");
    localStorage.removeItem("mood_melody_spotify_token");
  };

  // ---------------------------------------------------------
  // Recommendations generation API pipeline
  // ---------------------------------------------------------
  const generatePlaylist = async () => {
    // Unblock/unlock browser audio autoplay model synchronously under this click event
    if (audioRef.current) {
      audioRef.current.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      audioRef.current.play().catch(() => {});
    }

    setIsGenerating(true);
    setGenerationError(null);
    setStep(6); // Forward straight to results with beautiful loading state

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...prefState, spotifyToken }),
      });

      if (!response.ok) {
        throw new Error("Unable to synthesize audio moodscape.");
      }

      const data = await response.json();
      if (data.songs && data.songs.length > 0) {
        setRecommendedTracks(data.songs);
        setCurrentTrackIndex(0);
        setIsPlaying(true);
      } else {
        throw new Error("No tracks synthesized for requested parameters.");
      }
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Failed to communicate with recommendation core.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper: jump directly to Quick Mood generation
  const handleQuickMoodNow = () => {
    // Retain sensible defaults, ask user directly about mood & energy skips
    setStep(3); // Skip directly to Emotional Target Selection
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050308] text-white font-sans selection:bg-[#1DB954] selection:text-black">
      {/* Immersive radial glow backdrops */}
      <div className="absolute inset-0 bg-glow pointer-events-none z-0" />

      {/* Main Container */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between w-full max-w-7xl mx-auto px-4 sm:px-6">
        {/* TOP HEADER */}
        <header className="py-6 flex flex-col sm:flex-row items-center justify-between border-b border-zinc-900/60 gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStep(0)}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-[#1DB954] to-[#7c3aed] shadow-lg shadow-[#1DB954]/20">
              <svg className="w-5 h-5 text-black fill-current" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tighter uppercase bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                Mood Melody
              </span>
              <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase -mt-1">
                AI Mood Waveguide
              </p>
            </div>
          </div>

          {/* Connected state & Support indicators */}
          <div className="flex items-center gap-3 flex-wrap justify-center font-sans">
            {/* Future support YouTube music quick indicator */}
            <div className="flex bg-white/5 border border-white/10 p-0.5 rounded-full text-xs font-medium">
              <button
                onClick={() => setServicePreference("spotify")}
                className={`px-3 py-1 rounded-full transition-all duration-200 flex items-center gap-1 ${
                  servicePreference === "spotify"
                    ? "bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30 font-bold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" />
                Spotify
              </button>
              <button
                onClick={() => setServicePreference("youtube")}
                className={`px-3 py-1 rounded-full transition-all duration-200 flex items-center gap-1 ${
                  servicePreference === "youtube"
                    ? "bg-red-500/15 text-red-400 border border-red-500/30 font-bold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Integrates secondary YT queries for recommendations!"
              >
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[10px] bg-white/5 text-zinc-400 px-1 py-0.2 rounded font-mono">BETA</span>
              </button>
            </div>

            {/* Spotify Account Connect button */}
            {spotifyUser ? (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1.5 pr-4 text-xs backdrop-blur-lg">
                {spotifyUser.imageUrl ? (
                  <img
                    src={spotifyUser.imageUrl}
                    alt={spotifyUser.displayName}
                    className="w-6 h-6 rounded-full border border-[#1DB954]/30 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#1DB954] flex items-center justify-center text-black font-bold text-xs">
                    {spotifyUser.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left font-sans">
                  <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                    {spotifyUser.displayName}
                    <span className="text-[9px] px-1.5 bg-[#1DB954]/20 text-[#1DB954] rounded font-mono">
                      {spotifyToken?.startsWith("simulated") ? "SIMULATED" : "CONNECTED"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogOutSpotify}
                  className="ml-2 text-zinc-500 hover:text-red-400 transition"
                  title="Disconnect account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectSpotify}
                disabled={isConnecting}
                className="btn-spotify px-6 py-2.5 rounded-full text-sm flex items-center gap-2 tracking-wider font-extrabold cursor-pointer"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    CONNECTING...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.303c-.215.353-.673.465-1.026.25-2.863-1.748-6.467-2.144-10.71-1.173-.404.093-.807-.16-.9-.564-.093-.403.16-.807.564-.9 4.646-1.063 8.618-.614 11.82 1.339.353.214.464.673.25 1.026zm1.467-3.26c-.27.44-.847.58-1.287.31-3.275-2.013-8.267-2.595-12.137-1.418-.497.15-1.023-.13-1.173-.627-.15-.497.13-1.022.627-1.173 4.417-1.34 9.917-.69 13.662 1.61.44.27.58.846.31 1.287zm.127-3.41c-3.928-2.333-10.414-2.55-14.192-1.402-.603.183-1.24-.162-1.423-.765-.183-.603.162-1.24.765-1.423 4.34-1.317 11.51-1.062 16.035 1.623.542.322.72 1.024.398 1.566-.322.542-1.024.72-1.566.398z"/></svg>
                    CONNECT SPOTIFY
                  </>
                )}
              </button>
            )}
          </div>
        </header>

        {/* WIZARD ENGINE & PANELS */}
        <main className="flex-1 flex flex-col justify-center py-8">
          <AnimatePresence mode="wait">
            {/* STEP 0: LANDING DASHBOARD */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35 }}
                className="max-w-4xl mx-auto glass-panel p-8 sm:p-12 rounded-[40px] flex flex-col justify-center items-start relative overflow-hidden shadow-2xl"
              >
                {/* Gen Z visual badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 text-[#1DB954] text-xs rounded-full font-mono mb-6 relative z-10 font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#1DB954] animate-pulse" />
                  GEN-Z PSYCHOLOGY ALIGNMENT CORE
                </span>

                <div className="absolute top-0 right-0 p-8 hidden md:block select-none pointer-events-none z-0">
                  <div className="text-[140px] font-black opacity-[0.03] leading-none tracking-tighter">GEN Z</div>
                </div>

                <h1 className="text-4xl sm:text-7xl font-black mb-6 leading-[0.9] tracking-tight text-left relative z-10">
                  Find the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1DB954] to-[#7c3aed]">vibe</span><br/>for right now.
                </h1>

                <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-lg text-left relative z-10 leading-relaxed font-sans">
                  AI-powered curation mapped to your region, genre preferences, and current emotional target. Sync and play mood loops flawlessly.
                </p>

                {/* Main Hero Buttons Side-by-Side */}
                <div className="flex flex-col sm:flex-row gap-4 w-full mb-10 relative z-10">
                  <button
                    onClick={handleQuickMoodNow}
                    id="listen-mood-now"
                    className="flex-1 bg-white hover:bg-zinc-200 text-black font-extrabold h-16 rounded-2xl text-lg transition duration-250 cursor-pointer flex items-center justify-center gap-2 transform active:scale-98"
                  >
                    <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                    Listen to My Mood Now
                  </button>

                  <button
                    onClick={() => setStep(1)}
                    id="tweak-genre-region"
                    className="flex-1 border border-white/20 bg-white/5 hover:bg-white/10 text-white font-extrabold h-16 rounded-2xl text-lg transition duration-250 cursor-pointer flex items-center justify-center gap-2 transform active:scale-98"
                  >
                    <Sliders className="w-5 h-5 text-[#1DB954]" />
                    Tweak Genre & Region
                  </button>
                </div>

                {/* Quick informational banner explaining preview bypass audio system - Styled like design's pro tip */}
                <div className="w-full glass-panel rounded-[24px] p-5 flex flex-col sm:flex-row items-center gap-4 relative z-10">
                  <div className="w-16 h-16 bg-white/5 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
                    <div className="animate-pulse flex items-end gap-1 h-8">
                      <div className="w-1 h-5 bg-[#1DB954] rounded-full"></div>
                      <div className="w-1 h-8 bg-[#1DB954] rounded-full"></div>
                      <div className="w-1 h-4 bg-[#1DB954] rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#1DB954] mb-1">100% COMPATIBLE: FREE & PREMIUM SUPPORT</h3>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans">
                      Any Spotify account works perfectly! Connect with <span className="text-white font-bold underline decoration-[#1DB954]">either a Spotify Free or Premium account</span> to load personalized mood selections, and listen instantly inside the browser using our high-fidelity synced fallback loops!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 1: REGION/STYLE SELECTION */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="max-w-2xl mx-auto glass-panel p-8 sm:p-10 rounded-[32px] shadow-2xl relative overflow-hidden"
              >
                <div className="text-center mb-8">
                  <span className="text-xs font-mono text-[#1DB954] tracking-widest uppercase font-bold">STAGE 1 OF 5</span>
                  <h2 className="text-3xl font-black mt-1 tracking-tight">Select Your Cultural Sound Space</h2>
                  <p className="text-gray-400 text-xs mt-1 font-sans">Decide the geographic / production origin of your recommended melodic catalog</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {REGIONS.map((item) => {
                    const isSelected = prefState.region === item.value;
                    return (
                      <button
                        key={item.value}
                        onClick={() => {
                          setPrefState((prev) => ({
                            ...prev,
                            region: item.value,
                            genre: GENRES_BY_REGION[item.value][0], // assign first genre of selected region
                          }));
                        }}
                        className={`text-left p-5 rounded-2xl border transition duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-[#1DB954]/10 border-[#1DB954] text-white shadow-lg shadow-[#1DB954]/5 font-bold"
                            : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{item.icon}</span>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#1DB954] text-black flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <h4 className="font-bold text-base text-zinc-100">{item.label}</h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed font-sans">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center border-t border-white/10 pt-6">
                  <button
                    onClick={() => setStep(0)}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition text-xs font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full text-xs font-extrabold transition shadow-md cursor-pointer uppercase tracking-wider"
                  >
                    Next Stage <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: GENRE SELECTION */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="max-w-xl mx-auto glass-panel p-8 sm:p-10 rounded-[32px] shadow-2xl relative overflow-hidden"
              >
                <div className="text-center mb-8">
                  <span className="text-xs font-mono text-[#1DB954] tracking-widest uppercase font-bold">STAGE 2 OF 5</span>
                  <h2 className="text-3xl font-black mt-1 tracking-tight">Lock in Focus Genre</h2>
                  <p className="text-gray-400 text-xs mt-1 font-sans">
                    Refined acoustic selections for the <span className="text-[#1DB954] font-semibold">{prefState.region}</span> region
                  </p>
                </div>

                <div className="space-y-2 mb-8">
                  {GENRES_BY_REGION[prefState.region].map((genreOption) => {
                    const isSelected = prefState.genre === genreOption;
                    return (
                      <button
                        key={genreOption}
                        onClick={() => setPrefState((prev) => ({ ...prev, genre: genreOption }))}
                        className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition duration-250 cursor-pointer ${
                          isSelected
                            ? "bg-[#1DB954]/10 border-[#1DB954] text-white shadow-lg shadow-[#1DB954]/5 font-bold"
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Compass className={`w-4 h-4 ${isSelected ? "text-[#1DB954]" : "text-zinc-400"}`} />
                          <span className="text-sm font-semibold">{genreOption}</span>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#1DB954] text-black flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center border-t border-white/10 pt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition text-xs font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change Region
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full text-xs font-extrabold transition shadow-md cursor-pointer uppercase tracking-wider"
                  >
                    Next Stage <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: EMOTIONAL TARGET SELECTION */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="max-w-2xl mx-auto glass-panel p-8 sm:p-10 rounded-[32px] shadow-2xl relative overflow-hidden"
              >
                <div className="text-center mb-8">
                  <span className="text-xs font-mono text-[#1DB954] tracking-widest uppercase font-bold">STAGE 3 OF 5</span>
                  <h2 className="text-3xl font-black mt-1 tracking-tight">What's the Emotional Target?</h2>
                  <p className="text-gray-400 text-xs mt-1 font-sans">Select the dominant biological mood coordinate to guide wave synthesis</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mb-8">
                  {EMOTIONS.map((item) => {
                    const isSelected = prefState.emotion === item.value;
                    return (
                      <button
                        key={item.value}
                        onClick={() => setPrefState((prev) => ({ ...prev, emotion: item.value }))}
                        className={`text-center p-5 rounded-2xl border transition duration-350 relative overflow-hidden group flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? "bg-white text-black border-transparent shadow-xl font-bold"
                            : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-zinc-300"
                        }`}
                      >
                        {/* Glow indicator on selected border */}
                        {isSelected && (
                          <div className={`absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r ${item.colorClass}`} />
                        )}

                        <div
                          className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center bg-gradient-to-br ${item.colorClass} ${
                            isSelected ? "scale-105" : "opacity-80 group-hover:opacity-100"
                          } transition-all duration-300 text-black font-extrabold shadow-lg`}
                        >
                          <span className={`text-[10px] uppercase tracking-wider font-extrabold ${isSelected ? 'text-black' : 'text-zinc-100'}`}>vibe</span>
                        </div>

                        <span className={`text-sm font-extrabold block ${isSelected ? 'text-black' : 'text-zinc-100'}`}>{item.label}</span>
                        <span className={`text-[10px] block mt-1 leading-snug font-sans ${isSelected ? 'text-black/70' : 'text-zinc-500'}`}>{item.desc}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center border-t border-white/10 pt-6">
                  <button
                    onClick={() => {
                      setStep(2);
                    }}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition text-xs font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change Genre
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full text-xs font-extrabold transition shadow-md cursor-pointer uppercase tracking-wider"
                  >
                    Next Stage <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: AUDIO ENERGY SELECTION */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="max-w-2xl mx-auto glass-panel p-8 sm:p-10 rounded-[32px] shadow-2xl relative overflow-hidden"
              >
                <div className="text-center mb-8">
                  <span className="text-xs font-mono text-[#1DB954] tracking-widest uppercase font-bold">STAGE 4 OF 5</span>
                  <h2 className="text-3xl font-black mt-1 tracking-tight">Audio Energy Level</h2>
                  <p className="text-gray-400 text-xs mt-1 font-sans">Specify sonic amplitude, tempo loops & beat dynamics</p>
                </div>

                <div className="space-y-3 mb-8">
                  {ENERGIES.map((item) => {
                    const isSelected = prefState.energy === item.value;
                    return (
                      <button
                        key={item.value}
                        onClick={() => setPrefState((prev) => ({ ...prev, energy: item.value }))}
                        className={`w-full text-left p-5 rounded-2xl border flex items-center justify-between transition duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-[#1DB954]/10 border-[#1DB954] text-white shadow-md"
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:border-white/20"
                        }`}
                      >
                        <div className="flex-1 pr-4">
                          <h4 className="font-bold text-sm text-zinc-200">{item.label}</h4>
                          <p className="text-xs text-zinc-400 mt-0.5 font-sans">{item.desc}</p>
                        </div>
                        <div className="flex items-center gap-1.5 ml-4">
                          {[1, 2, 3].map((bar) => (
                            <div
                              key={bar}
                              className={`w-2.5 h-6 rounded ${
                                bar <= item.meter
                                  ? isSelected
                                    ? "bg-[#1DB954] scale-105"
                                    : "bg-zinc-600"
                                  : "bg-[#050308] border border-white/10 opacity-30"
                              } transition-all`}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center border-t border-white/10 pt-6">
                  <button
                    onClick={() => setStep(3)}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition text-xs font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change Emotion
                  </button>
                  <button
                    onClick={() => setStep(5)}
                    className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-full text-xs font-extrabold transition shadow-md cursor-pointer uppercase tracking-wider"
                  >
                    Next Stage <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: CUSTOM PREFERENCES INPUT & LAUNCH */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="max-w-xl mx-auto glass-panel p-8 sm:p-10 rounded-[32px] shadow-2xl relative overflow-hidden"
              >
                <div className="text-center mb-6">
                  <span className="text-xs font-mono text-[#1DB954] tracking-widest uppercase font-bold">STAGE 5 OF 5</span>
                  <h2 className="text-3xl font-black mt-1 tracking-tight">Optional Directives</h2>
                  <p className="text-gray-400 text-xs mt-1 font-sans">Specify favorite artists, specific sound preferences, or target lyrics vibe</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wide">
                      Text Customization
                    </label>
                    <textarea
                      value={prefState.customPrefs}
                      onChange={(e) => setPrefState((prev) => ({ ...prev, customPrefs: e.target.value }))}
                      placeholder="e.g. Include some Diljit Dosanjh, atmospheric reverb, soft acoustic guitars, or modern remix aesthetics..."
                      className="w-full h-28 bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none transition resize-none leading-relaxed font-sans"
                    />
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 font-sans text-xs flex flex-wrap gap-x-6 gap-y-2 items-center justify-between">
                    <div>
                      <span className="text-zinc-400 capitalize font-bold">{prefState.region} • {prefState.genre}</span>
                      <p className="font-bold text-zinc-300 mt-0.5">
                        Selected: <span className="text-[#1DB954]">{prefState.emotion}</span> &amp; {prefState.energy}
                      </p>
                    </div>
                    <span className="text-[10px] text-zinc-500 italic font-mono uppercase tracking-wider font-bold">Ready for AI Tuning</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-white/10 pt-6">
                  <button
                    onClick={() => setStep(4)}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition text-xs font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change Energy
                  </button>

                  <button
                    onClick={generatePlaylist}
                    className="group relative flex items-center gap-2 btn-spotify px-6 py-2.5 rounded-full text-xs transition duration-200 transform hover:scale-[1.02] shadow-lg shadow-[#1DB954]/10 cursor-pointer uppercase tracking-wider font-extrabold"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Curated Playlist
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 6: RECOMMENDATION RESULTS PAGE */}
            {step === 6 && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-5xl mx-auto"
              >
                {/* Generation Loading State */}
                {isGenerating ? (
                  <div className="min-h-[440px] flex flex-col items-center justify-center text-center py-20 glass-panel rounded-[40px] p-10 relative overflow-hidden shadow-2xl">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-full border-2 border-white/5 border-t-[#1DB954] animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Music className="w-6 h-6 text-[#1DB954] animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-zinc-100">Consulting Soundscapes...</h3>
                    <p className="text-zinc-400 text-sm mt-1 max-w-sm mx-auto leading-relaxed font-sans">
                      Mood Melody is processing cognitive coordinates with standard neural music guidelines to fetch Spotify vibe-synced record indices...
                    </p>

                    <div className="mt-8 flex gap-1.5 h-6">
                      <div className="w-1 bg-[#1DB954] rounded animate-audio-wave-1" />
                      <div className="w-1 bg-[#7c3aed] rounded animate-audio-wave-2" />
                      <div className="w-1 bg-pink-500 rounded animate-audio-wave-3" />
                      <div className="w-1 bg-[#1DB954] rounded animate-audio-wave-4" />
                      <div className="w-1 bg-[#7c3aed] rounded animate-audio-wave-5" />
                    </div>
                  </div>
                ) : generationError ? (
                  // API Generation Error State
                  <div className="glass-panel rounded-[40px] p-8 text-center max-w-md mx-auto py-12 relative overflow-hidden">
                    <p className="text-red-400 text-base font-extrabold tracking-tight">Recommended Vibe Interrupted</p>
                    <p className="text-zinc-400 text-xs mt-2 mb-6 font-sans">
                      {generationError || "Did not receive structured playlist mapping."}
                    </p>
                    <button
                      onClick={() => setStep(5)}
                      className="bg-white text-black font-extrabold hover:bg-zinc-200 text-xs px-5 py-2.5 rounded-full transition-all uppercase tracking-wider"
                    >
                      Refine Preferences & Retry
                    </button>
                  </div>
                ) : (
                  // SUCCESS PLAYLIST VIEW
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT LIST: generated songs */}
                    <div className="lg:col-span-7 space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-[10px] font-mono text-[#1DB954] tracking-widest uppercase font-bold">
                            MATCH FOUND • {prefState.region} • {prefState.emotion}
                          </span>
                          <h2 className="text-3xl font-black tracking-tight">Your Synthetic Wave</h2>
                        </div>
                        <button
                          onClick={() => setStep(0)}
                          className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1 font-bold"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Start Over
                        </button>
                      </div>

                      {recommendedTracks.map((song, idx) => {
                        const isCurrent = currentTrackIndex === idx;
                        return (
                          <div
                            key={song.id}
                            onClick={() => {
                              setCurrentTrackIndex(idx);
                              setIsPlaying(true);
                              if (audioRef.current) {
                                audioRef.current.pause();
                                audioRef.current.src = song.previewUrl;
                                audioRef.current.volume = audioVolume;
                                audioRef.current.play().catch((err) => {
                                  console.warn("Manual select play transition blocked:", err);
                                });
                              }
                            }}
                            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition duration-200 cursor-pointer ${
                              isCurrent
                                ? "bg-[#1DB954]/10 border-[#1DB954] shadow-md text-white font-bold"
                                : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:border-white/20"
                            }`}
                          >
                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10">
                                <img
                                  src={song.imageUrl}
                                  alt={song.title}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                {isCurrent && isPlaying ? (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <div className="flex gap-1 h-3 items-end">
                                      <div className="w-0.5 bg-[#1DB954] rounded animate-audio-wave-1" />
                                      <div className="w-0.5 bg-[#1DB954] rounded animate-audio-wave-2" />
                                      <div className="w-0.5 bg-[#1DB954] rounded animate-audio-wave-3" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                                    <Play className="w-4 h-4 text-white fill-white" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-sm truncate">{song.title}</h4>
                                <p className="text-xs text-zinc-400 truncate -mt-0.5 font-sans">{song.artist}</p>
                                <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-mono">Album: {song.album}</p>
                              </div>
                            </div>

                            {/* Direct Listen / Meta block */}
                            <div className="flex items-center gap-2">
                              {isCurrent && (
                                <span className="text-[9px] bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30 px-2 py-0.5 rounded font-mono uppercase font-bold tracking-wider">
                                  ACTIVE
                                </span>
                              )}
                              <a
                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(song.title + " " + song.artist)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 rounded-xl bg-white/5 text-red-400 hover:text-red-300 border border-white/10 hover:border-red-500/20 transition flex items-center justify-center gap-1.5"
                                title="Search and Listen on YouTube"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Youtube className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                              </a>
                              <a
                                href={song.spotifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 rounded-xl bg-[#1DB954]/10 text-[#1DB954] hover:bg-[#1DB954] hover:text-black border border-[#1DB954]/20 transition flex items-center justify-center gap-1.5 font-bold text-xs"
                                title="Open in Spotify App"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Spotify</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}

                      {/* Info diagnostics disclaimer panel */}
                      <div className="p-5 glass-panel rounded-[24px] space-y-2 mt-4">
                        <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-xs uppercase tracking-wider">
                          <HelpCircle className="w-4 h-4 text-[#1DB954]" />
                          <span>Playback Compatibility (Free & Premium Support)</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans">
                          No Spotify Premium subscription? No problem! Connect <span className="text-white font-bold">any standard Spotify Free profile</span>. You get the full 30-second high-fidelity synced previews, official Spotify Embed controllers, plus direct YouTube video sync shortcuts for an immersive premium acoustic experience!
                        </p>
                      </div>
                    </div>

                    {/* RIGHT LIST: detailed controller preview */}
                    <div className="lg:col-span-5 sticky top-6 space-y-4">
                      {/* Live Audio Custom Player Container */}
                      <div className="glass-panel rounded-[32px] p-6 overflow-hidden relative shadow-2xl">
                        {/* Dynamic backdrop shadow colored to emotion */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#1DB954] to-[#7c3aed]" />

                        <div className="flex flex-col items-center text-center mt-2">
                          <div className="relative w-40 h-40 rounded-2xl overflow-hidden mb-4 shadow-2xl shadow-black/80 group bg-white/5 border border-white/10">
                            <img
                              src={recommendedTracks[currentTrackIndex]?.imageUrl}
                              alt={recommendedTracks[currentTrackIndex]?.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {/* Spinning representation */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center animate-spin">
                                <Radio className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          </div>

                          <h3 className="font-extrabold text-lg text-zinc-100 truncate w-full px-2">
                            {recommendedTracks[currentTrackIndex]?.title}
                          </h3>
                          <p className="text-xs text-zinc-400 truncate w-full -mt-0.5 font-sans">
                            {recommendedTracks[currentTrackIndex]?.artist}
                          </p>

                          <div className="p-3 bg-white/5 rounded-xl text-xs text-zinc-400 font-sans leading-relaxed mt-4 mb-5 border border-white/10 border-dashed">
                            💡 <span className="text-[#1DB954] font-semibold font-mono">Neural Insights:</span> "{recommendedTracks[currentTrackIndex]?.reason}"
                          </div>

                          {/* Mode A: syncd custom HTML5 loops visualizer */}
                          <div className="w-full space-y-3 p-4 bg-white/5 rounded-2xl border border-white/10 mb-4">
                            <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase font-mono tracking-widest font-bold">
                              <span>30s Wave Preview</span>
                              <span className="text-[#1DB954] flex items-center gap-1 font-bold">
                                <Radio className="w-3 h-3 animate-ping" /> Synchronized
                              </span>
                            </div>

                            {/* Custom interactive waves represent audio */}
                            <div className="flex items-end justify-center gap-1.5 h-10 py-1">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((bar) => {
                                const activeHeights = [0.2, 0.4, 0.6, 0.8, 1.0, 0.5, 0.3, 0.7, 0.9, 0.4, 0.6, 0.8, 0.3, 0.7, 0.5, 0.9, 0.2, 0.6, 0.8, 0.4];
                                const currentH = activeHeights[bar % activeHeights.length];
                                return (
                                  <div
                                    key={bar}
                                    style={{
                                      height: isPlaying ? `${currentH * 100}%` : "15%",
                                    }}
                                    className={`w-1 rounded transition-all duration-300 ${
                                      isPlaying ? "bg-[#1DB954]" : "bg-zinc-700"
                                    } ${isPlaying ? (bar % 3 === 0 ? "animate-audio-wave-1" : bar % 2 === 0 ? "animate-audio-wave-2" : "animate-audio-wave-3") : ""}`}
                                  />
                                );
                              })}
                            </div>

                            {/* Core Player Trigger Actions */}
                            <div className="flex items-center justify-center gap-4 py-2">
                              <button
                                onClick={handlePrevTrack}
                                className="p-2.5 rounded-full hover:bg-white/5 transition text-zinc-400 hover:text-white"
                                title="Previous song"
                              >
                                <SkipBack className="w-5 h-5 fill-current" />
                              </button>
                              <button
                                onClick={togglePlay}
                                className="w-12 h-12 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black flex items-center justify-center transition hover:scale-105 shadow-md active:scale-95 cursor-pointer"
                                title={isPlaying ? "Pause Preview Loop" : "Play Preview Loop"}
                              >
                                {isPlaying ? (
                                  <Pause className="w-5 h-5 fill-current stroke-[3]" />
                                ) : (
                                  <Play className="w-5 h-5 fill-current stroke-[3] ml-0.5" />
                                )}
                              </button>
                              <button
                                onClick={handleNextTrack}
                                className="p-2.5 rounded-full hover:bg-white/5 transition text-zinc-400 hover:text-white"
                                title="Next song"
                              >
                                <SkipForward className="w-5 h-5 fill-current" />
                              </button>
                            </div>

                            {/* Volume controls */}
                            <div className="flex items-center gap-3">
                              <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={audioVolume}
                                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                className="flex-1 accent-[#1DB954] bg-zinc-800 h-1 rounded-lg cursor-pointer"
                              />
                              <span className="text-[9px] font-mono text-zinc-400">
                                {Math.round(audioVolume * 100)}%
                              </span>
                            </div>
                          </div>

                          {/* MODE B: OFFICIAL EMBED PLAYER IFRAME */}
                          {recommendedTracks[currentTrackIndex]?.id && (
                            <div className="w-full space-y-2 mt-4 pt-4 border-t border-white/10">
                              <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase font-mono tracking-widest pl-1 font-bold">
                                <span>Official Spotify Player</span>
                                <span className="text-zinc-500">(Interactive Connect)</span>
                              </div>
                              <iframe
                                src={`https://open.spotify.com/embed/track/${recommendedTracks[currentTrackIndex].id}?utm_source=generator&theme=0`}
                                width="100%"
                                height="80"
                                frameBorder="0"
                                allowFullScreen={false}
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy"
                                className="rounded-2xl border border-white/5 hover:border-white/10 transition duration-305 shadow bg-black"
                              />
                            </div>
                          )}

                          {/* Direct External Player Triggers */}
                          <div className="flex flex-col sm:flex-row gap-2 w-full mt-4">
                            <a
                              href={recommendedTracks[currentTrackIndex]?.spotifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-98"
                            >
                              <ExternalLink className="w-4 h-4 text-black" />
                              OPEN IN SPOTIFY
                            </a>
                            <a
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                                (recommendedTracks[currentTrackIndex]?.title || "") + " " + (recommendedTracks[currentTrackIndex]?.artist || "")
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 bg-red-600/20 hover:bg-red-600/35 border border-red-500/20 text-red-400 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              <Youtube className="w-4 h-4 text-red-500 animate-pulse" />
                              YOUTUBE FALLBACK
                            </a>
                          </div>

                          {/* Quick Regenerate triggers */}
                          <div className="grid grid-cols-2 gap-2 w-full mt-4">
                            <button
                              onClick={generatePlaylist}
                              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-100 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                            >
                              <Shuffle className="w-3.5 h-3.5" /> Shuf Vibe
                            </button>
                            <button
                              onClick={() => setStep(5)}
                              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-100 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                            >
                              <Sliders className="w-3.5 h-3.5" /> Adjust Fine
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* STEP INDEX DOTS INDICATOR */}
        <div className="flex justify-center items-center gap-2 my-10">
          {[0, 1, 2, 3, 4, 5, 6].map((num) => {
            const isActive = step === num;
            return (
              <div
                key={num}
                className={`step-dot w-2 h-2 rounded-full transition-all duration-500 ${
                  isActive
                    ? "active bg-[#1DB954] shadow-[0_0_10px_#1DB954] scale-125"
                    : "bg-white/20"
                }`}
              />
            );
          })}
        </div>

        {/* BRUTALIST & MINIMAL FOOTER */}
        <footer className="py-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
          <p>© 2026 Mood Melody. Crafted with Google GenAI &amp; Spotify Proxy.</p>
          <div className="flex items-center gap-4">
            <span>Server Side API: Verified</span>
            <span>Local Handshake: Online</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
