"use client";

import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Crown,
  FileVideo,
  Fullscreen,
  Link2,
  LoaderCircle,
  Play,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
  Wifi,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type View = "home" | "host" | "join" | "room";

type SessionRole = "host" | "viewer";
type Viewer = {
  id: string;
  status: string;
  progress: number;
  received: number;
  total: number;
};
type PeerError = { type?: string; message?: string; [key: string]: unknown };
type DataConnection = {
  peer: string;
  on(event: "open" | "close", handler: () => void): void;
  on(event: "data", handler: (data: unknown) => void): void;
  send(data: unknown): void;
  close(): void;
  dataChannel?: {
    bufferedAmount: number;
    bufferedAmountLowThreshold: number;
    addEventListener(event: "bufferedamountlow", handler: () => void): void;
    removeEventListener(event: "bufferedamountlow", handler: () => void): void;
  };
};
type PeerInstance = {
  id?: string;
  on(event: "open", handler: (id: string) => void): void;
  on(event: "error", handler: (error: PeerError) => void): void;
  on(event: "disconnected", handler: () => void): void;
  on(event: "connection", handler: (connection: DataConnection) => void): void;
  connect(
    id: string,
    options?: { reliable?: boolean; serialization?: "binary" },
  ): DataConnection;
  destroy(): void;
};

type TransferMeta = {
  name: string;
  size: number;
  mime: string;
  totalChunks: number;
  checksum: number;
};
type TransferChunk = { type: "chunk"; index: number; data: ArrayBuffer };
type SyncState = {
  type: "sync";
  playing: boolean;
  time: number;
  sentAt: number;
};
const CHUNK_SIZE = 64 * 1024;
const BUFFER_LIMIT = 1024 * 1024;

const peerOptions = {
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  },
};

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center border-3 border-black bg-[var(--cola)] text-white shadow-[4px_4px_0_0_#000]">
        <Radio className="size-5" />
      </div>
      <span className="font-mono text-sm font-black tracking-[.22em]">
        PARTY NIGHT
      </span>
    </div>
  );
}

function Background() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 bg-[var(--background)]"
    />
  );
}

function Home({ onHost, onJoin }: { onHost: () => void; onJoin: () => void }) {
  return (
    <section className="home-hero flex flex-1 flex-col justify-center py-10 sm:py-14">
      <div className="home-hero-grid">
        <div className="home-copy">
          <div className="home-kicker">
            <span className="home-kicker-mark" />
            PRIVATE WATCH ROOMS / 01
          </div>
          <h1 className="home-title">
            Watch
            <br />
            <span>together.</span>
          </h1>
          <p className="home-description">
            Your video. Your people. One shared moment, directly from the browser.
          </p>
          <div className="home-actions">
            <Button
              onClick={onHost}
              className="brutal-button home-primary-action h-14 w-full text-base sm:w-auto"
            >
              <Crown data-icon="inline-start" /> Create a party
            </Button>
            <Button
              onClick={onJoin}
              variant="outline"
              className="brutal-button home-secondary-action h-14 w-full text-base sm:w-auto"
            >
              <Link2 data-icon="inline-start" /> Join a party
            </Button>
          </div>
          <div className="home-facts" aria-label="Party features">
            <span>NO UPLOAD QUEUE</span>
            <span>NO ACCOUNT REQUIRED</span>
            <span>PEER TO PEER</span>
          </div>
        </div>

        <div className="home-poster-wrap" aria-hidden="true">
          <div className="home-poster">
            <div className="home-poster-topline">
              <span>PARTY NIGHT</span>
              <span>EST. / NOW</span>
            </div>
            <div className="home-poster-art">
              <div className="home-poster-ring" />
              <div className="home-poster-play"><Play className="size-7 fill-current" /></div>
              <span className="home-poster-word home-poster-word-top">SYNC</span>
              <span className="home-poster-word home-poster-word-bottom">READY</span>
            </div>
            <div className="home-poster-footer">
              <span>01 / WATCH</span>
              <span>02 / SHARE</span>
              <span>03 / PLAY</span>
            </div>
          </div>
          <div className="home-poster-caption">A room for the people you&apos;d rather be watching with.</div>
        </div>
      </div>
      <div className="home-marquee marquee-strip">
        <span>ORIGINAL QUALITY / SYNCED IN REAL TIME / MADE FOR LONG-DISTANCE COUCH HANGS / </span>
      </div>
    </section>
  );
}

function HostSetup({
  fileRef,
  fileName,
  onFile,
  onBack,
  onContinue,
}: {
  fileRef: React.RefObject<HTMLInputElement | null>;
  fileName: string;
  onFile: (file: File | undefined) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <section className="host-setup flex flex-1 flex-col justify-center py-10 sm:py-14">
      <button onClick={onBack} className="host-back" aria-label="Back home">
        <span aria-hidden="true">←</span> BACK HOME
      </button>
      <div className="host-setup-grid">
        <div className="host-setup-copy">
          <div className="host-setup-eyebrow"><span>01</span> / HOST SETUP</div>
          <h1 className="host-setup-title">Choose what we&apos;re watching.</h1>
          <p className="host-setup-description">Select a video from your device. We&apos;ll handle the rest.</p>
          <div className="host-setup-rule" />
          <div className="host-setup-note">
            <span className="host-setup-note-number">A</span>
            <span>Your screening starts with one file.</span>
          </div>
        </div>

        <div className={`host-media-object ${fileName ? "is-loaded" : ""}`}>
          <button
            onClick={() => fileRef.current?.click()}
            className="host-dropzone"
            aria-label={fileName ? "Replace selected video" : "Select a video"}
          >
            <span className="host-dropzone-index">MEDIA / 01</span>
            <span className="host-dropzone-symbol" aria-hidden="true"><FileVideo className="size-10" /></span>
            <span className="host-dropzone-title">{fileName ? "Replace video" : "Select video"}</span>
            <span className="host-dropzone-action">{fileName ? "Browse another file" : "Browse your files"}</span>
            <span className="host-dropzone-meta">VIDEO FILES / LOCAL DEVICE</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(event) => onFile(event.target.files?.[0])}
          />
          {fileName ? (
            <div className="host-loaded-ticket">
              <div>
                <span className="host-ticket-label">VIDEO READY</span>
                <span className="host-ticket-name">{fileName}</span>
              </div>
              <span className="host-ticket-status">READY</span>
            </div>
          ) : (
            <div className="host-empty-ticket"><span>DROP FILE HERE</span><span>OR USE THE BROWSE ACTION ABOVE</span></div>
          )}
        </div>
      </div>
      <div className="host-setup-footer">
        <div className="host-setup-footer-meta"><span>SCREENING / PRIVATE ROOM</span><span>02 / CREATE</span></div>
        <Button
          disabled={!fileName}
          onClick={onContinue}
          className="brutal-button host-create-button h-14 w-full sm:w-auto"
        >
          Create party <Play data-icon="inline-end" />
        </Button>
      </div>
    </section>
  );
}

function JoinScreen({
  code,
  setCode,
  onJoin,
  onBack,
  error,
}: {
  code: string;
  setCode: (value: string) => void;
  onJoin: () => void;
  onBack: () => void;
  error: string;
}) {
  return (
    <section className="join-screen flex flex-1 flex-col justify-center py-10 sm:py-14">
      <button onClick={onBack} className="join-back" aria-label="Back home">
        <span aria-hidden="true">←</span> BACK HOME
      </button>
      <div className="join-layout">
        <div className="join-copy">
          <div className="join-eyebrow"><span>02</span> / JOIN</div>
          <h1 className="join-title">What&apos;s the code?</h1>
          <p className="join-description">Enter the screening code you&apos;ve been given.</p>
          <div className="join-rule" />
          <div className="join-note"><span className="join-note-mark">→</span><span>Step into the room when you&apos;re ready.</span></div>
        </div>

        <div className="join-access-panel">
          <div className="join-panel-topline"><span>PRIVATE SCREENING</span><span>ACCESS / 02</span></div>
          <div className="join-code-frame">
            <label htmlFor="party-code" className="join-code-label">SCREENING CODE</label>
            <input
              id="party-code"
              autoFocus
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.nativeEvent.isComposing &&
                  event.keyCode !== 229
                )
                  onJoin();
              }}
              placeholder="PN-XXXXXX"
              className="join-code-input"
            />
            <div className="join-code-underline" />
            <span className="join-code-hint">ENTER THE CODE EXACTLY AS SHOWN</span>
          </div>
          {error && <p className="join-error"><span>ERROR /</span> {error}</p>}
          <Button
            onClick={onJoin}
            className="brutal-button join-submit h-14 w-full"
          >
            Join party <Wifi data-icon="inline-end" />
          </Button>
          <div className="join-panel-footer"><span>NO ACCOUNT REQUIRED</span><span>READY WHEN YOU ARE</span></div>
        </div>
      </div>
    </section>
  );
}

function HostPlayer({
  videoRef,
  src,
  hasVideo,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  src: string | null;
  hasVideo: boolean;
}) {
  return (
    <div className="brutal-player">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          controls={hasVideo}
          className={`h-full w-full object-contain ${hasVideo ? "" : "hidden"}`}
          src={src ?? undefined}
        />
      </div>
    </div>
  );
}

const TETRIS_WIDTH = 10;
const TETRIS_HEIGHT = 20;
const TETRIS_SHAPES = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [0, 1, 1]],
];
type TetrisPiece = { shape: number[][]; x: number; y: number; type: number };
type TetrisAction = "left" | "right" | "down" | "rotate" | "start" | "restart";

function CinemaRun({ progress }: { progress: number }) {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [board, setBoard] = useState<number[][]>(() => Array.from({ length: TETRIS_HEIGHT }, () => Array(TETRIS_WIDTH).fill(0)));
  const [piece, setPiece] = useState<TetrisPiece | null>(null);
  const actionRef = useRef<(action: TetrisAction) => void>(() => undefined);

  useEffect(() => {
    const boardRef = { current: Array.from({ length: TETRIS_HEIGHT }, () => Array(TETRIS_WIDTH).fill(0)) };
    const pieceRef = { current: null as TetrisPiece | null };
    const startedRef = { current: false };
    const gameOverRef = { current: false };
    const scoreRef = { current: 0 };
    let fallTimer: ReturnType<typeof setInterval> | undefined;

    const copyShape = (shape: number[][]) => shape.map((row) => [...row]);
    const makePiece = (): TetrisPiece => {
      const type = Math.floor(Math.random() * TETRIS_SHAPES.length);
      const shape = copyShape(TETRIS_SHAPES[type]);
      return { shape, x: Math.floor((TETRIS_WIDTH - shape[0].length) / 2), y: 0, type: type + 1 };
    };
    const collides = (candidate: TetrisPiece, target = boardRef.current) => candidate.shape.some((row, rowIndex) => row.some((cell, columnIndex) => {
      if (!cell) return false;
      const x = candidate.x + columnIndex;
      const y = candidate.y + rowIndex;
      return x < 0 || x >= TETRIS_WIDTH || y >= TETRIS_HEIGHT || (y >= 0 && target[y][x] !== 0);
    }));
    const render = () => {
      setBoard(boardRef.current.map((row) => [...row]));
      setPiece(pieceRef.current ? { ...pieceRef.current, shape: copyShape(pieceRef.current.shape) } : null);
      setScore(scoreRef.current);
    };
    const spawn = () => {
      const next = makePiece();
      if (collides(next)) {
        gameOverRef.current = true;
        setGameOver(true);
        return;
      }
      pieceRef.current = next;
      render();
    };
    const lock = () => {
      const active = pieceRef.current;
      if (!active) return;
      for (let row = 0; row < active.shape.length; row += 1) for (let column = 0; column < active.shape[row].length; column += 1) {
        if (active.shape[row][column] && active.y + row >= 0) boardRef.current[active.y + row][active.x + column] = active.type;
      }
      const remaining = boardRef.current.filter((row) => row.some((cell) => cell === 0));
      const cleared = TETRIS_HEIGHT - remaining.length;
      while (remaining.length < TETRIS_HEIGHT) remaining.unshift(Array(TETRIS_WIDTH).fill(0));
      boardRef.current = remaining;
      scoreRef.current += [0, 100, 250, 400, 600][cleared] ?? 0;
      spawn();
    };
    const move = (dx: number, dy: number) => {
      const active = pieceRef.current;
      if (!startedRef.current || gameOverRef.current || !active) return;
      const next = { ...active, x: active.x + dx, y: active.y + dy };
      if (!collides(next)) { pieceRef.current = next; render(); } else if (dy > 0) lock();
    };
    const rotate = () => {
      const active = pieceRef.current;
      if (!startedRef.current || gameOverRef.current || !active) return;
      const rotated = active.shape[0].map((_, column) => active.shape.map((row) => row[column]).reverse());
      for (const offset of [0, -1, 1]) {
        const next = { ...active, shape: rotated, x: active.x + offset };
        if (!collides(next)) { pieceRef.current = next; render(); return; }
      }
    };
    const reset = () => {
      boardRef.current = Array.from({ length: TETRIS_HEIGHT }, () => Array(TETRIS_WIDTH).fill(0));
      scoreRef.current = 0;
      gameOverRef.current = false;
      setGameOver(false);
      spawn();
    };
    actionRef.current = (action) => {
      if (action === "start") { startedRef.current = true; setStarted(true); reset(); return; }
      if (action === "restart") { startedRef.current = true; setStarted(true); reset(); return; }
      if (action === "left") move(-1, 0);
      if (action === "right") move(1, 0);
      if (action === "down") move(0, 1);
      if (action === "rotate") rotate();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select")) return;
      if (!startedRef.current || gameOverRef.current) return;
      const actions: Record<string, TetrisAction> = { ArrowLeft: "left", ArrowRight: "right", ArrowDown: "down", ArrowUp: "rotate" };
      const action = actions[event.key];
      if (action) { event.preventDefault(); actionRef.current(action); }
    };
    window.addEventListener("keydown", onKeyDown);
    fallTimer = setInterval(() => move(0, 1), 900);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (fallTimer) clearInterval(fallTimer);
      actionRef.current = () => undefined;
    };
  }, []);

  const displayBoard = board.map((row) => [...row]);
  if (piece) piece.shape.forEach((row, rowIndex) => row.forEach((cell, columnIndex) => {
    if (cell && piece.y + rowIndex >= 0 && piece.y + rowIndex < TETRIS_HEIGHT && piece.x + columnIndex >= 0 && piece.x + columnIndex < TETRIS_WIDTH) displayBoard[piece.y + rowIndex][piece.x + columnIndex] = piece.type;
  }));

  return (
    <div className="mini-tetris" aria-label="Mini Tetris waiting game">
      <div className="mini-tetris-topline"><span>FILE RECEIVING</span><span>RECEIVING {progress}%</span></div>
      {!started ? <div className="mini-tetris-start"><div className="mini-tetris-title">MINI TETRIS</div><button type="button" className="mini-tetris-action" onClick={() => actionRef.current("start")}>START GAME</button></div> : <div className="mini-tetris-play"><div className="mini-tetris-play-head"><span>MINI TETRIS</span><span>SCORE {String(score).padStart(5, "0")}</span></div><div className="mini-tetris-board" role="grid" aria-label="Tetris board">{displayBoard.flatMap((row, rowIndex) => row.map((cell, columnIndex) => <span key={`${rowIndex}-${columnIndex}`} className={`mini-tetris-cell cell-${cell}`} role="gridcell" />))}</div>{gameOver && <div className="mini-tetris-gameover"><strong>GAME OVER</strong><span>SCORE {String(score).padStart(5, "0")}</span><button type="button" className="mini-tetris-action" onClick={() => actionRef.current("restart")}>RESTART</button></div>}</div>}
    </div>
  );
}

function ViewerPlayer({
  src,
  hasVideo,
  fileName,
  progress,
}: {
  src: string | null;
  hasVideo: boolean;
  fileName: string;
  progress: number;
}) {
  return (
    <div className="brutal-player">
      <div className="relative aspect-video bg-black">
        <video
          controls={false}
          className={`h-full w-full object-contain ${hasVideo ? "" : "hidden"}`}
          src={src ?? undefined}
        />
        <div
          className={`absolute inset-0 grid place-items-center bg-[var(--cola)] p-6 text-center text-white ${hasVideo ? "hidden" : ""}`}
        >
          <CinemaRun progress={progress} />
        </div>
      </div>
    </div>
  );
}

function ViewerList({ viewers }: { viewers: Viewer[] }) {
  return (
    <details className="room-viewer-list" open>
      <summary className="room-panel-heading">
        <span>Who&apos;s watching</span>
        <span aria-hidden="true">+</span>
      </summary>
      <div className="room-viewer-items">
        {viewers.length === 0 ? (
          <p className="room-empty-viewers">No viewers yet.</p>
        ) : (
          viewers.map((viewer, index) => (
            <div key={viewer.id} className="room-viewer-item">
              <div className="room-viewer-item-topline">
                <span>Viewer {index + 1}</span>
                <span>{viewer.status}</span>
              </div>
              <div className="room-progress-track">
                <div
                  className="room-progress-fill"
                  style={{ width: `${viewer.progress}%` }}
                />
              </div>
              <p className="room-viewer-progress">{viewer.progress}% transferred</p>
            </div>
          ))
        )}
      </div>
    </details>
  );
}

function Room({
  joined,
  roomCode,
  copied,
  onCopy,
  onLeave,
  sessionRole,
  hostVideoRef,
  videoUrl,
  hostVideoUrl,
  fileName,
  transferProgress,
  connectionStatus,
  connectionError,
  transferError,
  viewerMessage,
  roomViewerCount,
  viewers,
}: {
  joined: boolean;
  roomCode: string;
  copied: boolean;
  onCopy: () => void;
  onLeave: () => void;
  sessionRole: SessionRole;
  hostVideoRef: React.RefObject<HTMLVideoElement | null>;
  videoUrl: string | null;
  hostVideoUrl: string | null;
  fileName: string;
  transferProgress: number;
  connectionStatus: string;
  connectionError: string;
  transferError: string;
  viewerMessage: string;
  roomViewerCount: number;
  viewers: Viewer[];
}) {
  const watching = joined ? roomViewerCount : viewers.length;
  return (
    <section className="room-screen flex-1 py-6 sm:py-8">
      <header className="room-header">
        <div className="room-identity">
          <span className="room-identity-mark" aria-hidden="true" />
          <div>
            <p className="room-identity-name">PARTY NIGHT</p>
            <p className="room-identity-caption">PRIVATE SCREENING / {joined ? "VIEWER" : "HOST"}</p>
          </div>
        </div>
        <div className="room-header-center">
          <span className="room-code-label">PARTY CODE</span>
          <span className="room-code-value">{roomCode}</span>
          <button onClick={onCopy} aria-label="Copy party code" className="room-copy-button">
            {copied ? "COPIED" : <Copy className="size-4" />}
          </button>
        </div>
        <div className="room-header-actions">
          <span className="room-connection-status"><span aria-hidden="true" />{connectionStatus}</span>
          <button onClick={onLeave} aria-label="Leave party" className="room-leave-button"><X className="size-4" /><span>Leave</span></button>
        </div>
      </header>

      <div className="room-intro-row">
        <div>
          <p className="room-eyebrow">SCREENING / {joined ? "02" : "01"}</p>
          <h1 className="room-title">{joined ? "You're in." : "Your party is live."}</h1>
        </div>
        <div className="room-watching"><span aria-hidden="true">●</span> {watching} WATCHING</div>
      </div>

      <div className="room-layout">
        <div className="room-main-column">
          <div className="room-stage">
            <div className="room-stage-label">ON SCREEN / 01</div>
          {sessionRole === "host" ? (
            <HostPlayer
              videoRef={hostVideoRef}
              src={videoUrl}
              hasVideo={Boolean(videoUrl)}
            />
          ) : (
            <ViewerPlayer
              src={videoUrl}
              hasVideo={Boolean(videoUrl)}
              fileName={fileName}
              progress={transferProgress}
            />
          )}
          </div>
          {connectionStatus && (
            <div className="room-status-strip"><span className="room-status-dot" />{connectionStatus}</div>
          )}
          {connectionError && (
            <p className="room-message room-message-error">
              {connectionError}
            </p>
          )}
          {transferError && (
            <p className="room-message room-message-error">
              {transferError}
            </p>
          )}
          {viewerMessage && (
            <p className="room-message room-message-success">
              {viewerMessage}
            </p>
          )}
        </div>
        <aside className="room-side-column">
          <div className="room-side-block">
            <div className="room-side-label">SCREENING STATUS</div>
            <p className="room-side-status">{connectionStatus}</p>
            <p className="room-side-copy">{joined ? "Connected to the host. Waiting for media." : "Keep this tab open while your friends watch."}</p>
          </div>
          <div className="room-side-block room-side-facts">
            <div><span>VIEWERS</span><strong>{watching}</strong></div>
            <div><span>PARTY</span><strong>{roomCode}</strong></div>
          </div>
          {sessionRole === "host" && <ViewerList viewers={viewers} />}
        </aside>
      </div>
    </section>
  );
}

export default function Page() {
  const [view, setView] = useState<View>("home");
  const [code, setCode] = useState("");
  const [roomCode, setRoomCode] = useState("PN-7KQ9M2");
  const [fileName, setFileName] = useState("");
  const [hostVideoUrl, setHostVideoUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [transferProgress, setTransferProgress] = useState(0);
  const [transferError, setTransferError] = useState("");
  const [copied, setCopied] = useState(false);
  const [joined, setJoined] = useState(false);
  const [sessionRole, setSessionRole] = useState<SessionRole | null>(null);
  const [connectionCode, setConnectionCode] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [connectionError, setConnectionError] = useState("");
  const [viewerMessage, setViewerMessage] = useState("");
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [roomViewerCount, setRoomViewerCount] = useState(0);
  const [viewerMuted, setViewerMuted] = useState(false);
  const [viewerVolume, setViewerVolume] = useState(1);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [hostPlaying, setHostPlaying] = useState(false);
  const peerRef = useRef<PeerInstance | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const hostVideoRef = useRef<HTMLVideoElement>(null);
  const viewerVideoRef = useRef<HTMLVideoElement>(null);
  const selectedFileRef = useRef<File | null>(null);
  const connectionsRef = useRef(new Map<string, DataConnection>());
  const sendingViewerIdsRef = useRef(new Set<string>());
  const sendFileRef = useRef<(connection: DataConnection) => void>(
    () => undefined,
  );
  const receivedChunksRef = useRef(new Map<number, ArrayBuffer>());
  const receivedBytesRef = useRef(0);
  const transferMetaRef = useRef<TransferMeta | null>(null);
  const lastProgressSentRef = useRef(0);
  const latestSyncRef = useRef<SyncState | null>(null);

  function broadcastSync(video: HTMLVideoElement | null) {
    if (!video || sessionRole !== "host") return;
    const sync: SyncState = {
      type: "sync",
      playing: !video.paused,
      time: video.currentTime,
      sentAt: Date.now(),
    };
    latestSyncRef.current = sync;
    console.log("[Sync] broadcast", sync);
    for (const connection of connectionsRef.current.values()) {
      console.log("[Sync] host sending", {
        peerId: connection.peer,
        payload: sync,
      });
      connection.send(sync);
    }
  }

  function applyViewerSync(sync: SyncState) {
    latestSyncRef.current = sync;
    const video = viewerVideoRef.current;
    if (!video || !video.readyState) {
      console.log("[Sync] viewer sync deferred", {
        hasVideo: Boolean(video),
        readyState: video?.readyState ?? 0,
        sync,
      });
      return;
    }
    const targetTime = sync.playing
      ? sync.time + (Date.now() - sync.sentAt) / 1000
      : sync.time;
    console.log("[Sync] viewer applying", {
      currentTime: video.currentTime,
      targetTime,
      sync,
    });
    if (Math.abs(video.currentTime - targetTime) > 0.5)
      video.currentTime = targetTime;
    if (sync.playing) {
      setConnectionStatus("Host is playing");
      void video
        .play()
        .then(() => setAutoplayBlocked(false))
        .catch((error) => {
          console.log("[Sync] viewer play rejected", error);
          setAutoplayBlocked(true);
        });
    } else {
      setConnectionStatus("Host paused");
      video.pause();
      setAutoplayBlocked(false);
    }
  }

  useEffect(() => {
    if (!sessionRole || !connectionCode) return;
    const CHUNK_SIZE = 64 * 1024;
    const BUFFER_LIMIT = 1024 * 1024;
    const peerOptions = {
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    };

    let cancelled = false;
    let peer: PeerInstance | null = null;
    let viewerConnection: DataConnection | null = null;
    let connectionOpened = false;
    let connectionTimeout: ReturnType<typeof setTimeout> | undefined;

    function setError(message: string) {
      if (cancelled) return;
      setConnectionError(message);
      setConnectionStatus("Error");
    }

    function isRecord(value: unknown): value is Record<string, unknown> {
      return typeof value === "object" && value !== null;
    }

    function broadcastRoomCount() {
      const count = connectionsRef.current.size;
      for (const connection of connectionsRef.current.values())
        connection.send({ type: "room", count });
    }

    function reportViewerProgress(
      connection: DataConnection,
      received: number,
      total: number,
      force = false,
    ) {
      const now = Date.now();
      if (!force && now - lastProgressSentRef.current < 1000) return;
      lastProgressSentRef.current = now;
      connection.send({ type: "progress", received, total });
    }

    async function waitForBackpressure(connection: DataConnection) {
      const channel = connection.dataChannel;
      if (!channel) return;
      channel.bufferedAmountLowThreshold = BUFFER_LIMIT;
      while (!cancelled && channel.bufferedAmount > BUFFER_LIMIT) {
        await new Promise<void>((resolve) => {
          const onLow = () => {
            channel.removeEventListener("bufferedamountlow", onLow);
            resolve();
          };
          channel.addEventListener("bufferedamountlow", onLow);
          if (channel.bufferedAmount <= BUFFER_LIMIT) {
            channel.removeEventListener("bufferedamountlow", onLow);
            resolve();
          }
        });
      }
    }

    async function sendFileToConnection(connection: DataConnection) {
      const file = selectedFileRef.current;
      if (!file || sendingViewerIdsRef.current.has(connection.peer)) return;
      sendingViewerIdsRef.current.add(connection.peer);
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const meta: TransferMeta = {
        name: file.name,
        size: file.size,
        mime: file.type || "video/mp4",
        totalChunks,
        checksum: file.size,
      };
      setViewers((current) =>
        current.map((viewer) =>
          viewer.id === connection.peer
            ? {
                ...viewer,
                status: "Receiving",
                progress: 0,
                received: 0,
                total: file.size,
              }
            : viewer,
        ),
      );
      console.log("[Transfer] meta", { peerId: connection.peer, meta });
      connection.send({ type: "meta", ...meta });

      try {
        for (let index = 0; index < totalChunks && !cancelled; index += 1) {
          await waitForBackpressure(connection);
          const start = index * CHUNK_SIZE;
          const data = await file
            .slice(start, Math.min(start + CHUNK_SIZE, file.size))
            .arrayBuffer();
          connection.send({
            type: "chunk",
            index,
            data,
          } satisfies TransferChunk);
          if (index % 100 === 0)
            console.log("[Transfer] chunk sent", {
              peerId: connection.peer,
              index,
            });
        }
        if (!cancelled)
          console.log("[Transfer] send complete", {
            peerId: connection.peer,
            size: file.size,
            totalChunks,
          });
      } finally {
        sendingViewerIdsRef.current.delete(connection.peer);
      }
    }

    function registerViewerConnection(connection: DataConnection) {
      console.log("[PeerJS] connection", { viewerId: connection.peer });
      connectionsRef.current.set(connection.peer, connection);
      setViewers((current) => [
        ...current.filter((viewer) => viewer.id !== connection.peer),
        {
          id: connection.peer,
          status: "Connecting",
          progress: 0,
          received: 0,
          total: selectedFileRef.current?.size ?? 0,
        },
      ]);

      connection.on("open", () => {
        if (cancelled) return;
        console.log("[PeerJS] data channel open", { peerId: connection.peer });
        setViewers((current) =>
          current.map((viewer) =>
            viewer.id === connection.peer
              ? {
                  ...viewer,
                  status: selectedFileRef.current ? "Receiving" : "Ready",
                }
              : viewer,
          ),
        );
        connection.send({ type: "hello" });
        broadcastRoomCount();
        if (latestSyncRef.current) connection.send(latestSyncRef.current);
        sendFileToConnection(connection).catch((error) =>
          console.error("[Transfer] send failed", error),
        );
      });
      connection.on("data", (data) => {
        console.log("[PeerJS] message", { peerId: connection.peer, data });
        if (!isRecord(data) || data.type !== "progress") return;
        const received = typeof data.received === "number" ? data.received : 0;
        const total = typeof data.total === "number" ? data.total : 0;
        const progress =
          total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0;
        setViewers((current) =>
          current.map((viewer) =>
            viewer.id === connection.peer
              ? {
                  ...viewer,
                  received,
                  total,
                  progress,
                  status: progress >= 100 ? "Ready" : "Receiving",
                }
              : viewer,
          ),
        );
      });
      connection.on("close", () => {
        console.log("[PeerJS] data channel close", { peerId: connection.peer });
        connectionsRef.current.delete(connection.peer);
        if (!cancelled) {
          setViewers((current) =>
            current.filter((viewer) => viewer.id !== connection.peer),
          );
          broadcastRoomCount();
        }
      });
    }

    sendFileRef.current = sendFileToConnection;

    async function createPeer() {
      setConnectionError("");
      setConnectionStatus("Connecting...");
      const { default: Peer } = await import("peerjs");
      if (cancelled) return;

      peer = new Peer(
        sessionRole === "host" ? connectionCode : undefined,
        peerOptions,
      );
      peerRef.current = peer;

      peer.on("open", (id) => {
        if (cancelled) return;
        console.log("[PeerJS] open", { id });
        if (sessionRole === "host") {
          setConnectionStatus("Ready - waiting for viewers");
          return;
        }

        viewerConnection =
          peer?.connect(connectionCode, {
            reliable: true,
            serialization: "binary",
          }) ?? null;
        if (!viewerConnection) {
          setError("Could not create a connection to the host.");
          return;
        }
        console.log("[PeerJS] connecting to host", { hostId: connectionCode });
        viewerConnection.on("open", () => {
          if (cancelled) return;
          connectionOpened = true;
          if (connectionTimeout) clearTimeout(connectionTimeout);
          console.log("[PeerJS] data channel open", { peerId: connectionCode });
          setConnectionStatus("Connected to host");
        });
        viewerConnection.on("data", (data) => {
          console.log("[PeerJS] message", { peerId: connectionCode, data });
          if (!isRecord(data)) return;
          if (data.type === "hello") {
            setViewerMessage("Host says hello");
            return;
          }
          if (data.type === "room" && typeof data.count === "number") {
            setRoomViewerCount(data.count);
            return;
          }
          if (
            data.type === "sync" &&
            typeof data.playing === "boolean" &&
            typeof data.time === "number" &&
            typeof data.sentAt === "number"
          ) {
            console.log("[Sync] viewer received", data);
            applyViewerSync(data as SyncState);
            return;
          }
          if (data.type === "meta") {
            const meta = data as unknown as TransferMeta;
            transferMetaRef.current = meta;
            receivedChunksRef.current.clear();
            receivedBytesRef.current = 0;
            lastProgressSentRef.current = 0;
            setFileName(meta.name);
            setTransferProgress(0);
            setTransferError("");
            console.log("[Transfer] meta received", { meta });
            return;
          }
          if (data.type !== "chunk" || typeof data.index !== "number") return;
          const rawData = data.data;
          let chunkData: ArrayBuffer | null = null;
          if (rawData instanceof ArrayBuffer) chunkData = rawData;
          else if (rawData instanceof Uint8Array)
            chunkData = rawData.slice().buffer;
          if (!chunkData || receivedChunksRef.current.has(data.index)) return;

          receivedChunksRef.current.set(data.index, chunkData);
          receivedBytesRef.current += chunkData.byteLength;
          const meta = transferMetaRef.current;
          if (!meta) return;
          const progress = Math.min(
            100,
            Math.round((receivedBytesRef.current / meta.size) * 100),
          );
          setTransferProgress(progress);
          reportViewerProgress(
            viewerConnection!,
            receivedBytesRef.current,
            meta.size,
          );
          if (data.index % 100 === 0)
            console.log("[Transfer] chunk received", {
              index: data.index,
              received: receivedBytesRef.current,
            });

          if (receivedChunksRef.current.size !== meta.totalChunks) return;
          reportViewerProgress(
            viewerConnection!,
            receivedBytesRef.current,
            meta.size,
            true,
          );
          if (
            receivedBytesRef.current !== meta.size ||
            meta.checksum !== receivedBytesRef.current
          ) {
            setTransferError(
              `Transfer integrity check failed: received ${receivedBytesRef.current} of ${meta.size} bytes.`,
            );
            return;
          }
          const orderedChunks = Array.from(
            { length: meta.totalChunks },
            (_, index) => receivedChunksRef.current.get(index),
          ).filter((chunk): chunk is ArrayBuffer => Boolean(chunk));
          const nextUrl = URL.createObjectURL(
            new Blob(orderedChunks, { type: meta.mime }),
          );
          setVideoUrl(nextUrl);
          setTransferProgress(100);
          console.log("[Transfer] receive complete", {
            size: receivedBytesRef.current,
            totalChunks: meta.totalChunks,
          });
        });
        viewerConnection.on("close", () => {
          console.log("[PeerJS] data channel close", {
            peerId: connectionCode,
          });
          if (!cancelled) setError("The host connection closed.");
        });
        connectionTimeout = setTimeout(() => {
          if (!cancelled && !connectionOpened) {
            viewerConnection?.close();
            setError("The host could not be found within 10 seconds.");
          }
        }, 10000);
      });
      peer.on("error", (error) => {
        console.log("[PeerJS] error", error);
        if (cancelled) return;
        if (error.type === "peer-unavailable") setError("Host not found.");
        else setError(error.message || "Peer connection error.");
      });
      peer.on("disconnected", () => {
        console.log("[PeerJS] disconnected", { id: peer?.id });
        if (!cancelled) setError("Peer disconnected.");
      });
      peer.on("connection", (connection) => {
        if (!cancelled && sessionRole === "host")
          registerViewerConnection(connection);
      });
    }

    void createPeer();

    return () => {
      cancelled = true;
      if (connectionTimeout) clearTimeout(connectionTimeout);
      viewerConnection?.close();
      sendFileRef.current = () => undefined;
      connectionsRef.current.clear();
      sendingViewerIdsRef.current.clear();
      if (peerRef.current === peer) peerRef.current = null;
      peer?.destroy();
    };
  }, [connectionCode, sessionRole]);

  useEffect(() => {
    if (sessionRole !== "host" || view !== "room") return;
    const video = hostVideoRef.current;
    if (!video) return;

    video.controls = true;
    const sync = () => broadcastSync(video);
    let lastHeartbeatAt = 0;
    const heartbeat = () => {
      if (video.paused) return;
      const now = Date.now();
      if (now - lastHeartbeatAt < 2000) return;
      lastHeartbeatAt = now;
      broadcastSync(video);
    };
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    video.addEventListener("seeked", sync);
    video.addEventListener("ratechange", sync);
    video.addEventListener("timeupdate", heartbeat);
    video.addEventListener("loadedmetadata", sync);
    const heartbeatInterval = window.setInterval(heartbeat, 2000);

    return () => {
      video.removeEventListener("play", sync);
      video.removeEventListener("pause", sync);
      video.removeEventListener("seeked", sync);
      video.removeEventListener("ratechange", sync);
      video.removeEventListener("timeupdate", heartbeat);
      video.removeEventListener("loadedmetadata", sync);
      window.clearInterval(heartbeatInterval);
    };
  }, [sessionRole, view]);

  useEffect(() => {
    return () => {
      if (hostVideoUrl) URL.revokeObjectURL(hostVideoUrl);
    };
  }, [hostVideoUrl]);

  useEffect(() => {
    if (sessionRole === "host") return;
    const video = document.querySelector("video");
    if (!video) return;

    viewerVideoRef.current = video;
    video.controls = false;
    video.controlsList.value = "nodownload noremoteplayback";
    video.disablePictureInPicture = true;
    video.disableRemotePlayback = true;
    video.playsInline = true;
    video.style.pointerEvents = "none";
    const stopContextMenu = (event: Event) => event.preventDefault();
    const applyPendingSync = () => {
      if (latestSyncRef.current) applyViewerSync(latestSyncRef.current);
    };
    video.addEventListener("contextmenu", stopContextMenu);
    video.addEventListener("loadedmetadata", applyPendingSync);

    const controls = document.createElement("div");
    controls.className = "viewer-controls";
    const muteButton = document.createElement("button");
    muteButton.type = "button";
    muteButton.textContent = viewerMuted ? "🔊" : "🔇";
    muteButton.title = viewerMuted ? "Unmute" : "Mute";
    const volume = document.createElement("input");
    volume.type = "range";
    volume.min = "0";
    volume.max = "1";
    volume.step = "0.05";
    volume.value = String(viewerVolume);
    volume.setAttribute("aria-label", "Volume");
    const fullscreenButton = document.createElement("button");
    fullscreenButton.type = "button";
    fullscreenButton.textContent = "⛶";
    fullscreenButton.title = "Fullscreen";
    const joinButton = document.createElement("button");
    joinButton.type = "button";
    joinButton.textContent = "Tap to join playback";
    joinButton.dataset.joinPlayback = "true";
    joinButton.style.display = autoplayBlocked ? "inline-flex" : "none";
    muteButton.onclick = () => {
      video.muted = !video.muted;
      setViewerMuted(video.muted);
      muteButton.textContent = video.muted ? "🔊" : "🔇";
      muteButton.title = video.muted ? "Unmute" : "Mute";
    };
    volume.oninput = () => {
      video.volume = Number(volume.value);
      setViewerVolume(video.volume);
    };
    fullscreenButton.onclick = () =>
      void video.parentElement?.parentElement?.requestFullscreen?.();
    joinButton.onclick = () => {
      if (latestSyncRef.current) applyViewerSync(latestSyncRef.current);
      else
        void video
          .play()
          .then(() => setAutoplayBlocked(false))
          .catch(() => undefined);
    };
    controls.append(muteButton, volume, fullscreenButton, joinButton);
    video.parentElement?.parentElement?.append(controls);
    return () => {
      video.removeEventListener("contextmenu", stopContextMenu);
      video.removeEventListener("loadedmetadata", applyPendingSync);
      controls.remove();
      viewerVideoRef.current = null;
    };
  }, [sessionRole, videoUrl, hostVideoUrl]);

  useEffect(() => {
    const joinButton = document.querySelector<HTMLButtonElement>(
      '[data-join-playback="true"]',
    );
    if (joinButton)
      joinButton.style.display = autoplayBlocked ? "inline-flex" : "none";
  }, [autoplayBlocked]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => {
    if (view !== "home" || !sessionRole) return;
    setSessionRole(null);
    setConnectionCode("");
    setConnectionStatus("Disconnected");
    setViewers([]);
  }, [sessionRole, view]);

  function hostParty() {
    const nextCode = `PN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setRoomCode(nextCode);
    setConnectionCode(nextCode);
    setSessionRole("host");
    setJoined(false);
    setView("host");
  }
  function copyCode() {
    navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  function joinParty() {
    const normalizedCode = code.trim().toUpperCase();
    if (!/^PN-[A-Z0-9]{6}$/.test(normalizedCode)) {
      setConnectionError("Enter a valid party code in the format PN-XXXXXX.");
      return;
    }
    setConnectionCode(normalizedCode);
    setRoomCode(normalizedCode);
    setSessionRole("viewer");
    setJoined(true);
    setView("room");
  }

  function leaveParty() {
    setSessionRole(null);
    setConnectionCode("");
    setConnectionStatus("Disconnected");
    setConnectionError("");
    setViewerMessage("");
    setViewers([]);
    setRoomViewerCount(0);
    setTransferProgress(0);
    setTransferError("");
    setVideoUrl(null);
    setHostVideoUrl(null);
    latestSyncRef.current = null;
    receivedChunksRef.current.clear();
    transferMetaRef.current = null;
    setJoined(false);
    setView("home");
  }

  function handleFileSelect(file: File | undefined) {
    selectedFileRef.current = file ?? null;
    setFileName(file?.name ?? "");
    setVideoUrl(file ? URL.createObjectURL(file) : null);
    setHostVideoUrl(file ? URL.createObjectURL(file) : null);
    latestSyncRef.current = null;
    setHostPlaying(false);
    if (file)
      for (const connection of connectionsRef.current.values())
        sendFileRef.current(connection);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <Background />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 pb-8 sm:px-8">
        <header className="flex items-center justify-between border-b-4 border-black py-6">
          <Logo />
          <div className="font-mono text-xs font-bold uppercase">
            {sessionRole ? connectionStatus : "P2P / PRIVATE BY DESIGN"}
          </div>
        </header>
        {view === "home" && (
          <Home onHost={hostParty} onJoin={() => setView("join")} />
        )}
        {view === "host" && (
          <HostSetup
            fileRef={fileRef}
            fileName={fileName}
            onFile={handleFileSelect}
            onBack={() => setView("home")}
            onContinue={() => setView("room")}
          />
        )}
        {view === "join" && (
          <JoinScreen
            code={code}
            setCode={setCode}
            onJoin={joinParty}
            onBack={() => setView("home")}
            error={connectionError}
          />
        )}
        {view === "room" && (
          <Room
            joined={joined}
            roomCode={roomCode}
            copied={copied}
            onCopy={copyCode}
            onLeave={leaveParty}
            sessionRole={sessionRole!}
            hostVideoRef={hostVideoRef}
            videoUrl={videoUrl}
            hostVideoUrl={hostVideoUrl}
            fileName={fileName}
            transferProgress={transferProgress}
            connectionStatus={connectionStatus}
            connectionError={connectionError}
            transferError={transferError}
            viewerMessage={viewerMessage}
            roomViewerCount={roomViewerCount}
            viewers={viewers}
          />
        )}
        <footer className="mt-auto flex justify-between border-t-4 border-black py-5 text-xs font-black uppercase">
          <span>Built for long-distance couch hangs.</span>
          <span>WebRTC / No uploads</span>
        </footer>
      </div>
    </main>
  );
}
