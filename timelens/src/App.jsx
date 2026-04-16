import React, { useState, useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float, MeshDistortMaterial, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import { Scan, ArrowLeft, Heart, Clock, Smartphone, SmartphoneNfc, PlusCircle, Map, Lock, CheckCircle2, Save, MessageCircle, Send, User, Nfc, X } from 'lucide-react';

// --- Initial sample data ---
const INITIAL_MEMORIES = {
  "watch_1985": {
    id: "watch_1985",
    title: "Grandfather's Pocket Watch",
    year: "1985",
    story: "This watch witnessed three overseas journeys in our family. Grandfather used to say that time does not simply pass; it stays inside the gears as memory.",
    unlocked: false,
    color: "#fcd34d",
    author: "grandpa",
    messages: []
  },
  "photo_1992": {
    id: "photo_1992",
    title: "Faded Family Photo",
    year: "1992",
    story: "This was the last family photo before we moved away. Even though the colors have faded, the warmth of that sunlight still seems to remain on the paper.",
    unlocked: false,
    color: "#fb923c",
    author: "grandma",
    messages: []
  }
};

const DEMO_MESSAGES = [
  {
    id: "msg_demo_1",
    text: "Grandpa, why do you always keep this watch inside the wooden box?",
    from: "grandchild",
    timestamp: "Apr 6, 2:20 PM"
  },
  {
    id: "msg_demo_2",
    text: "I carried it when I traveled by ship in my youth. It reminds me that no matter how far I go, I should never forget home.",
    from: "grandparent",
    timestamp: "Apr 6, 2:22 PM"
  }
];

const EMPTY_ENTRY = { title: '', story: '', year: '2024', color: '#6366f1' }; // 默认为蓝紫色

const VIDEO_CREATE_ENTRY = {
  title: "Grandma's Sewing Box",
  year: '1978',
  story: 'This small box stayed with Grandma when she was young. Every needle inside helped her mend our winter clothes.'
};

const QUICK_REPLIES = {
  grandchild: [
    'Grandpa, why has this watch always stayed in the wooden box?',
    'I would love to hear more about that journey.',
    'Could you show me the other keepsakes next time too?'
  ],
  grandparent: [
    'When you come home, I will let you look at it more closely.',
    'This watch reminds me to remember home no matter how far I travel.',
    'If you want, I can tell you more about that trip by ship.'
  ]
};

function getUserLabel(user) {
  return user === 'grandchild' ? 'Grandchild' : 'Grandparent';
}

function getUserRoleText(user) {
  return user === 'grandchild' ? 'Grandchild' : 'Grandparent';
}

function getMemoryStatusText(memory) {
  return memory?.unlocked ? 'Unlocked' : 'Ready to Tap';
}

function getMessageCountText(count = 0) {
  return `${count} messages`;
}

function getMemoryPreview(story = '') {
  if (!story) return 'A family memory waiting to be told.';
  return story.length > 42 ? `${story.slice(0, 42)}...` : story;
}

function buildMemoryTagValue(memoryId) {
  if (typeof window === 'undefined') {
    return `timelens://memory/${memoryId}`;
  }
  return `${window.location.origin}${window.location.pathname}?nfc=${memoryId}`;
}

function extractMemoryIdFromScan(value, memories) {
  if (!value) return null;
  const trimmed = value.trim();
  if (memories[trimmed]) {
    return trimmed;
  }

  if (trimmed.startsWith('timelens://memory/')) {
    const memoryId = trimmed.replace('timelens://memory/', '');
    return memories[memoryId] ? memoryId : null;
  }

  try {
    const parsed = new URL(trimmed);
    const memoryId = parsed.searchParams.get('nfc') || parsed.searchParams.get('tag') || parsed.searchParams.get('memory');
    return memoryId && memories[memoryId] ? memoryId : null;
  } catch {
    return null;
  }
}

function isWebNfcSupported() {
  return typeof window !== 'undefined' && window.isSecureContext && 'NDEFReader' in window;
}

function decodeNdefPayload(record) {
  if (!record?.data) return '';
  try {
    const decoder = new TextDecoder(record.encoding || 'utf-8');
    return decoder.decode(record.data);
  } catch {
    try {
      const decoder = new TextDecoder();
      return decoder.decode(record.data);
    } catch {
      return '';
    }
  }
}

function extractMemoryIdFromNdefMessage(message, memories) {
  if (!message?.records) return null;

  for (const record of message.records) {
    const payload = decodeNdefPayload(record);
    const memoryId = extractMemoryIdFromScan(payload, memories) || extractMemoryIdFromScan(record.id || '', memories);
    if (memoryId) return memoryId;
  }

  return null;
}

function buildMemoryNfcWriteMessage(memoryId) {
  const url = buildMemoryTagValue(memoryId);
  return {
    records: [
      { recordType: 'url', data: url },
      { recordType: 'text', lang: 'en', data: memoryId }
    ]
  };
}

const VIDEO_SCENES = [
  {
    key: 'cover',
    section: 'Opening',
    title: 'TimeLens',
    subtitle: 'A playful intergenerational memory portal',
    bullets: [
      'Group B4-1',
      'Parents & Children; Grandparents & Children',
      'Mobile XR, Tangible, Hybrid'
    ],
    overlayMode: 'full',
    view: 'scan',
    activeId: 'watch_1985',
    currentUser: 'grandchild',
    unlockAll: true,
    durationMs: 7000
  },
  {
    key: 'hook',
    section: 'The Hook',
    title: 'Family stories stay hidden inside everyday objects',
    bullets: [
      'Children can see the keepsake, but not the memory behind it.',
      'Many existing tools feel archival and text-heavy.',
      'TimeLens turns a physical object into a playful story portal.'
    ],
    overlayMode: 'full',
    view: 'scan',
    activeId: 'watch_1985',
    currentUser: 'grandchild',
    unlockAll: true,
    durationMs: 8000
  },
  {
    key: 'concept',
    section: 'The Concept',
    title: 'Object -> Reveal -> Reply',
    bullets: [
      'Tap an NFC-tagged family keepsake',
      'Unlock a visual memory reveal',
      'Leave a lightweight reply across generations'
    ],
    overlayMode: 'full',
    view: 'scan',
    activeId: 'watch_1985',
    currentUser: 'grandchild',
    unlockAll: true,
    durationMs: 8000
  },
  {
    key: 'scan',
    section: 'Walkthrough 1',
    title: 'Tap the NFC object',
    caption: 'The interaction starts from a real keepsake and an NFC touch rather than a menu.',
    overlayMode: 'caption',
    view: 'scan',
    activeId: 'watch_1985',
    currentUser: 'grandchild',
    unlockAll: false,
    durationMs: 7000
  },
  {
    key: 'reveal',
    section: 'Walkthrough 2',
    title: 'See the memory come alive',
    caption: 'A 3D reveal makes family history feel discoverable and playful.',
    overlayMode: 'caption',
    view: 'memory',
    activeId: 'watch_1985',
    currentUser: 'grandchild',
    showMessages: false,
    unlockAll: true,
    durationMs: 7000
  },
  {
    key: 'dialogue',
    section: 'Walkthrough 3',
    title: 'Continue the story through messages',
    caption: 'Grandparents and children can keep the memory going with short replies.',
    overlayMode: 'caption',
    view: 'memory',
    activeId: 'watch_1985',
    currentUser: 'grandchild',
    showMessages: true,
    unlockAll: true,
    durationMs: 8000
  },
  {
    key: 'map',
    section: 'Walkthrough 4',
    title: 'Revisit memories from the map',
    caption: 'Unlocked keepsakes turn into a growing family collection.',
    overlayMode: 'caption',
    view: 'hunt',
    activeId: 'watch_1985',
    currentUser: 'grandchild',
    unlockAll: true,
    durationMs: 7000
  },
  {
    key: 'create',
    section: 'Walkthrough 5',
    title: 'Record a new family object',
    caption: 'The archive can grow as different generations add more keepsakes.',
    overlayMode: 'caption',
    view: 'create',
    activeId: 'watch_1985',
    currentUser: 'grandparent',
    unlockAll: true,
    newEntry: VIDEO_CREATE_ENTRY,
    durationMs: 8000
  },
  {
    key: 'impact',
    section: 'Impact',
    title: 'Why the design matters',
    bullets: [
      'It starts from real objects already present in family life.',
      'It gives younger users a playful entry point into family memory.',
      'It supports reciprocal exchange instead of one-way archiving.'
    ],
    overlayMode: 'full',
    view: 'memory',
    activeId: 'watch_1985',
    currentUser: 'grandparent',
    showMessages: true,
    unlockAll: true,
    durationMs: 7000
  },
  {
    key: 'credits',
    section: 'Closing',
    title: 'TimeLens',
    subtitle: 'From keepsake to conversation',
    bullets: [
      'Web-based prototype prepared for CPT208',
      'Replace this slide with final student IDs and real testing credits',
      'Use NFC tags on supported phones for the final live demo'
    ],
    overlayMode: 'full',
    view: 'scan',
    activeId: 'watch_1985',
    currentUser: 'grandchild',
    unlockAll: true,
    durationMs: 6000
  }
];

const VIDEO_SCENE_LOOKUP = Object.fromEntries(VIDEO_SCENES.map((scene) => [scene.key, scene]));

// LocalStorage key
const STORAGE_KEY = 'timelens_memories_v1';
const STORAGE_USER = 'timelens_current_user';

function getDemoConfig() {
  if (typeof window === 'undefined') {
    return { enabled: false };
  }

  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo');
  if (!demo) {
    return { enabled: false };
  }

  if (demo === 'video') {
    const scene = params.get('scene') || 'cover';
    return {
      enabled: true,
      video: true,
      scene: VIDEO_SCENE_LOOKUP[scene] ? scene : 'cover',
      autoplay: params.get('autoplay') === '1',
      hideDirector: params.get('ui') === '0',
      captionsVisible: params.get('captions') !== '0'
    };
  }

  const requestedView = demo === 'map' ? 'hunt' : demo === 'messages' ? 'memory' : demo;
  const currentUser = params.get('user') === 'grandparent' ? 'grandparent' : 'grandchild';

  return {
    enabled: true,
    video: false,
    view: ['scan', 'scanning', 'memory', 'hunt', 'create'].includes(requestedView) ? requestedView : 'scan',
    activeId: params.get('memory') || 'watch_1985',
    showMessages: demo === 'messages' || params.get('messages') === '1',
    currentUser,
    unlockAll: params.get('unlock') === 'all' || requestedView === 'hunt'
  };
}

const DEMO_CONFIG = getDemoConfig();

function getInitialOverlayPanel() {
  if (typeof window === 'undefined') {
    return null;
  }
  const panel = new URLSearchParams(window.location.search).get('panel');
  if (panel === 'scanner' || panel === 'tags') {
    return 'nfc';
  }
  return panel === 'nfc' ? 'nfc' : null;
}

const INITIAL_OVERLAY_PANEL = getInitialOverlayPanel();

function getVideoSceneState(sceneKey) {
  const scene = VIDEO_SCENE_LOOKUP[sceneKey] || VIDEO_SCENE_LOOKUP.cover;
  const memories = buildDemoMemories({
    activeId: scene.activeId || 'watch_1985',
    unlockAll: scene.unlockAll ?? true
  });

  return {
    scene,
    view: scene.view,
    activeId: scene.activeId || 'watch_1985',
    currentUser: scene.currentUser || 'grandchild',
    showMessages: Boolean(scene.showMessages),
    newEntry: scene.newEntry ? { ...scene.newEntry } : { ...EMPTY_ENTRY },
    memories
  };
}

function buildDemoMemories(config) {
  const memories = {
    watch_1985: {
      ...INITIAL_MEMORIES.watch_1985,
      unlocked: true,
      messages: DEMO_MESSAGES
    },
    photo_1992: {
      ...INITIAL_MEMORIES.photo_1992,
      unlocked: config.unlockAll
    }
  };

  if (config.activeId && memories[config.activeId]) {
    memories[config.activeId] = {
      ...memories[config.activeId],
      unlocked: true,
      messages: memories[config.activeId].messages?.length
        ? memories[config.activeId].messages
        : DEMO_MESSAGES
    };
  }

  return memories;
}

function hydrateSavedMemories(savedMemories) {
  const baseMemories = Object.fromEntries(
    Object.entries(INITIAL_MEMORIES).map(([id, memory]) => {
      const savedMemory = savedMemories[id];
      if (!savedMemory) {
        return [id, memory];
      }

      return [
        id,
        {
          ...memory,
          unlocked: Boolean(savedMemory.unlocked),
          messages: Array.isArray(savedMemory.messages) ? savedMemory.messages : []
        }
      ];
    })
  );

  const customMemories = Object.fromEntries(
    Object.entries(savedMemories).filter(([id]) => !INITIAL_MEMORIES[id])
  );

  return {
    ...baseMemories,
    ...customMemories
  };
}

/**
 * 得物风格：高精细度 3D 记忆对象
 * 模拟一个带有金属光泽、玻璃质感和内部光效的“传家宝挂坠”
 */
function HighEndHeirloom({ data }) {
  const groupRef = useRef();
  
  // 基础自转和轻微晃动，增加动态感
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t / 4) / 4;
      groupRef.current.rotation.z = Math.sin(t / 2) / 10; // 增加 z 轴微动，更显灵动
      groupRef.current.position.y = Math.sin(t / 1.5) / 10;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. 外层金色金属环 (模拟高级外壳) - 升级为 MeshPhysicalMaterial */}
      <mesh castShadow>
        <torusGeometry args={[1.2, 0.06, 24, 100]} />
        <meshPhysicalMaterial 
          color="#D4AF37" 
          metalness={1} 
          roughness={0.1} 
          clearcoat={1} 
          clearcoatRoughness={0.1} 
        />
      </mesh>

      {/* 2. 内部多面体核心 (发光记忆体) - 优化发光和质感 */}
      <Float speed={2.5} rotationIntensity={1.2} floatIntensity={1.2}>
        <mesh castShadow>
          <octahedronGeometry args={[0.8, 0]} />
          <MeshDistortMaterial
            color={data.color || "#FFD700"}
            speed={4}
            distort={0.3}
            radius={1}
            metalness={0.9}
            roughness={0.05}
            emissive={data.color || "#FFD700"}
            emissiveIntensity={0.8}
          />
        </mesh>
      </Float>

      {/* 3. 辅助装饰环 (增加精密感) - 增加细节 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.05, 64]} />
        <meshStandardMaterial color="#B8860B" metalness={1} transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <ringGeometry args={[1.25, 1.3, 64]} />
        <meshStandardMaterial color="#D4AF37" metalness={1} transparent opacity={0.3} />
      </mesh>

      {/* 4. 浮动故事卡片：优化了比例适配 10:19.5 屏幕 */}
      <Html distanceFactor={10} position={[0, -2.6, 0]} center>
        <div className="w-[260px] scale-[0.8] bg-white/95 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-white/50 animate-in fade-in zoom-in duration-700 pointer-events-none origin-center text-center">
          <div className="flex items-center justify-center gap-2 mb-3 text-indigo-600">
            <Clock size={12} strokeWidth={3} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Recorded in {data.year}</span>
          </div>
          <h3 className="text-xl font-serif font-black text-slate-900 mb-2 italic tracking-tight">{data.title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-light px-2 opacity-80 italic italic">"{data.story}"</p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center">
            <Heart size={20} className="text-rose-500 fill-rose-500" />
          </div>
        </div>
      </Html>
    </group>
  );
}

function VideoSceneOverlay({ scene, currentIndex, total, captionsVisible, autoPlay, onPrev, onNext, onToggleAuto, onToggleCaptions, onSceneAction, hideDirector }) {
  return (
    <>
      {!hideDirector && (
        <div className="absolute inset-x-4 top-4 z-[120] flex items-start justify-between gap-3">
          <div className="rounded-[1.4rem] bg-slate-950/85 border border-white/10 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-300">
              Video Demo Mode
            </div>
            <div className="mt-1 text-sm font-black">{scene.title}</div>
            <div className="text-[10px] text-slate-300">{`${currentIndex + 1}/${total} · ${scene.section}`}</div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={onToggleCaptions} className="rounded-full bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 shadow-lg">
              {captionsVisible ? 'Hide captions' : 'Show captions'}
            </button>
            {scene.key === 'scan' && (
              <button onClick={onSceneAction} className="rounded-full bg-indigo-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg">
                Trigger NFC tap
              </button>
            )}
            {scene.key === 'dialogue' && (
              <button onClick={onSceneAction} className="rounded-full bg-indigo-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg">
                Send demo reply
              </button>
            )}
            {scene.key === 'create' && (
              <button onClick={onSceneAction} className="rounded-full bg-indigo-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg">
                Save sample story
              </button>
            )}
            <button onClick={onPrev} className="rounded-full bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 shadow-lg">
              Prev
            </button>
            <button onClick={onToggleAuto} className="rounded-full bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 shadow-lg">
              {autoPlay ? 'Auto on' : 'Auto off'}
            </button>
            <button onClick={onNext} className="rounded-full bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 shadow-lg">
              Next
            </button>
          </div>
        </div>
      )}

      {captionsVisible && scene.overlayMode === 'full' && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-8 backdrop-blur-[2px] pointer-events-none">
          <div className="w-full max-w-[320px] rounded-[2.4rem] border border-white/10 bg-slate-950/80 p-7 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">
              {scene.section}
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight">{scene.title}</h2>
            {scene.subtitle && <p className="mt-3 text-sm text-slate-200">{scene.subtitle}</p>}
            {scene.bullets && (
              <ul className="mt-5 space-y-3 pl-5 text-sm text-slate-100">
                {scene.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {captionsVisible && scene.overlayMode === 'caption' && (
        <div className="absolute left-4 right-4 top-28 z-[110] pointer-events-none">
          <div className="max-w-[300px] rounded-[1.8rem] border border-white/10 bg-slate-950/82 px-5 py-4 text-white shadow-2xl backdrop-blur-xl">
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-300">
              {scene.section}
            </div>
            <div className="mt-2 text-lg font-black tracking-tight">{scene.title}</div>
            <p className="mt-2 text-xs leading-relaxed text-slate-200">{scene.caption}</p>
          </div>
        </div>
      )}
    </>
  );
}

function NfcToolsModal({ memories, onDetected, onClose }) {
  const readerRef = useRef(null);
  const abortRef = useRef(null);
  const [status, setStatus] = useState('Prepare an NFC tag, then choose whether to read or write.');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [writingId, setWritingId] = useState('');
  const supportWebNfc = isWebNfcSupported();
  const secureContext = typeof window !== 'undefined' ? window.isSecureContext : false;

  const stopScanning = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    readerRef.current = null;
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startNfcScan = async () => {
    if (!supportWebNfc) {
      setError('Web NFC is not available here. Use Chrome on Android with NFC enabled, or use the demo buttons below.');
      return;
    }

    try {
      stopScanning();
      setError('');
      setStatus('Tap your phone on an NFC tag linked to a TimeLens memory.');
      const abortController = new AbortController();
      abortRef.current = abortController;
      const reader = new window.NDEFReader();
      readerRef.current = reader;
      await reader.scan({ signal: abortController.signal });
      setIsScanning(true);
      reader.onreadingerror = () => {
        setError('The NFC tag was detected, but its content could not be read.');
      };
      reader.onreading = (event) => {
        const memoryId = extractMemoryIdFromNdefMessage(event.message, memories);
        if (!memoryId) {
          setError('This NFC tag is not linked to a TimeLens memory.');
          return;
        }
        stopScanning();
        onDetected(memoryId);
      };
    } catch {
      setError('Unable to start NFC scanning. Make sure NFC is enabled and use a supported mobile browser.');
      stopScanning();
    }
  };

  const writeMemoryToNfcTag = async (memory) => {
    if (!supportWebNfc) {
      setError('Web NFC writing is not available here. For unsupported devices, pre-write the tag using an NFC tool app.');
      return;
    }

    try {
      stopScanning();
      setError('');
      setWritingId(memory.id);
      setStatus(`Touch a writable NFC tag to program ${memory.title}.`);
      const writer = new window.NDEFReader();
      await writer.write(buildMemoryNfcWriteMessage(memory.id));
      setStatus(`NFC tag written for ${memory.title}. You can now tap it to open the memory.`);
    } catch {
      setError('Failed to write the NFC tag. Use a writable NDEF tag and keep NFC enabled on the phone.');
    } finally {
      setWritingId('');
    }
  };

  return (
    <div className="absolute inset-0 z-[140] overflow-y-auto bg-slate-950/88 p-4 text-white backdrop-blur-xl md:p-5">
      <div className="mx-auto w-full max-w-[920px]">
        <div className="sticky top-0 z-10 mb-4 flex items-center justify-between rounded-[1.6rem] bg-slate-950/92 px-4 py-3 backdrop-blur-xl">
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-300">NFC tools</div>
            <div className="mt-1 text-base font-black md:text-lg">Read or prepare a TimeLens NFC tag</div>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/10 p-3 text-white active:scale-95 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 rounded-[1.8rem] border border-white/10 bg-white/8 p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className={`mt-1 rounded-full p-2 ${supportWebNfc ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
              <SmartphoneNfc size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-base font-black">{supportWebNfc ? 'Web NFC available' : 'Web NFC not available on this device'}</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                {supportWebNfc
                  ? 'You can scan NFC tags and write new ones from this screen.'
                  : secureContext
                    ? 'For real NFC tap demos, use Chrome on Android with NFC enabled. You can still use the fallback buttons below for presentation.'
                    : 'This page is not running in a secure context. For real Web NFC, open the prototype on HTTPS or localhost with a supported Android browser.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/8 p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={startNfcScan}
                className="rounded-full bg-indigo-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-white active:scale-95 transition-all"
              >
                Start NFC scan
              </button>
              <button
                type="button"
                onClick={stopScanning}
                className="rounded-full bg-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-white active:scale-95 transition-all"
              >
                Stop scan
              </button>
              {isScanning && <span className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">Scanning active</span>}
            </div>
            <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-slate-950/35 px-4 py-3 text-sm leading-relaxed text-slate-200">
              {error || status}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/10 bg-white/8 p-4 text-sm leading-relaxed text-slate-200 md:p-5">
            <div className="text-[9px] font-black uppercase tracking-[0.28em] text-indigo-300">Live demo notes</div>
            <p className="mt-3">Use one NFC sticker per keepsake. Program the sticker, place it beside the object, and tap the phone to the tag during the demo.</p>
            <p className="mt-3">If the classroom device does not support Web NFC, use the fallback “Open memory now” button and explain that the final tangible trigger is NFC.</p>
            <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-slate-950/35 px-4 py-3">
              <div className="text-[9px] font-black uppercase tracking-[0.24em] text-indigo-300">Best setup</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">Recommended live setup: Android phone + Chrome + writable NDEF NFC sticker + one physical keepsake.</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {Object.values(memories).map((memory) => (
            <div key={memory.id} className="rounded-[1.8rem] bg-white p-4 shadow-2xl md:rounded-[2rem] md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-indigo-500">NFC memory</div>
                  <div className="mt-2 text-lg font-black leading-tight text-slate-900 md:text-xl">{memory.title}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span>{memory.year}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-600">{getUserRoleText(memory.author)}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-600">{memory.id}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[1.6rem] border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">NFC payload</div>
                <div className="mt-2 break-all text-xs leading-relaxed text-slate-500">{buildMemoryTagValue(memory.id)}</div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => writeMemoryToNfcTag(memory)}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white active:scale-95 transition-all disabled:opacity-50"
                  disabled={Boolean(writingId && writingId !== memory.id)}
                >
                  {writingId === memory.id ? 'Writing tag...' : 'Write NFC tag'}
                </button>
                <button
                  type="button"
                  onClick={() => onDetected(memory.id)}
                  className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 active:scale-95 transition-all"
                >
                  Open memory now
                </button>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                Attach the programmed NFC sticker to the keepsake or its label card, then tap a supported phone to trigger this memory.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const initialVideoState = DEMO_CONFIG.video ? getVideoSceneState(DEMO_CONFIG.scene) : null;
  const [view, setView] = useState(initialVideoState ? initialVideoState.view : DEMO_CONFIG.enabled ? DEMO_CONFIG.view : 'scan');
  const [activeId, setActiveId] = useState(initialVideoState ? initialVideoState.activeId : DEMO_CONFIG.enabled ? DEMO_CONFIG.activeId : null);
  const [newEntry, setNewEntry] = useState(initialVideoState ? initialVideoState.newEntry : { ...EMPTY_ENTRY });
  const [memories, setMemories] = useState(initialVideoState ? initialVideoState.memories : DEMO_CONFIG.enabled ? buildDemoMemories(DEMO_CONFIG) : INITIAL_MEMORIES);
  const [currentUser, setCurrentUser] = useState(initialVideoState ? initialVideoState.currentUser : DEMO_CONFIG.enabled ? DEMO_CONFIG.currentUser : 'grandchild'); // 'grandparent' | 'grandchild'
  const [newMessage, setNewMessage] = useState('');
  const [showMessages, setShowMessages] = useState(initialVideoState ? initialVideoState.showMessages : DEMO_CONFIG.enabled ? DEMO_CONFIG.showMessages : false);
  const [selectedScanId, setSelectedScanId] = useState(initialVideoState ? initialVideoState.activeId : DEMO_CONFIG.enabled ? DEMO_CONFIG.activeId || 'watch_1985' : 'watch_1985');
  const [nfcToolsOpen, setNfcToolsOpen] = useState(INITIAL_OVERLAY_PANEL === 'nfc');
  const [pendingTagId, setPendingTagId] = useState(null); // 新增：保存扫描到的未识别标签 ID
  const [videoSceneKey, setVideoSceneKey] = useState(DEMO_CONFIG.video ? DEMO_CONFIG.scene : null);
  const [videoAutoPlay, setVideoAutoPlay] = useState(Boolean(DEMO_CONFIG.video && DEMO_CONFIG.autoplay));
  const [videoCaptionsVisible, setVideoCaptionsVisible] = useState(DEMO_CONFIG.video ? DEMO_CONFIG.captionsVisible : false);
  const [toast, setToast] = useState('');
  const toastTimerRef = useRef();

  const activeVideoScene = videoSceneKey ? VIDEO_SCENE_LOOKUP[videoSceneKey] || VIDEO_SCENE_LOOKUP.cover : null;
  const videoSceneIndex = activeVideoScene ? VIDEO_SCENES.findIndex((scene) => scene.key === activeVideoScene.key) : -1;
  const memoryList = Object.values(memories);
  const selectedMemory = memories[selectedScanId] || memoryList[0];
  const unlockedCount = memoryList.filter((memory) => memory.unlocked).length;
  const lockedCount = memoryList.length - unlockedCount;

  const showToast = (message) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToast('');
    }, 2200);
  };

  const triggerHapticSuccess = () => {
    // 物理反馈：震动 (Member B - 硬件优化)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    // 听觉反馈：扫描成功提示音 (Member B - 硬件优化)
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch {
      // 忽略音频播放错误
    }
  };

  // Load from LocalStorage on mount
  useEffect(() => {
    if (DEMO_CONFIG.enabled) {
      return;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    const savedUser = localStorage.getItem(STORAGE_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = hydrateSavedMemories(parsed);
        setMemories(merged);
      } catch {
        console.log('Failed to parse saved memories');
      }
    }
    if (savedUser) setCurrentUser(savedUser);
  }, []);

  // Save to LocalStorage when memories change
  useEffect(() => {
    if (DEMO_CONFIG.enabled) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    if (DEMO_CONFIG.enabled) {
      return;
    }
    localStorage.setItem(STORAGE_USER, currentUser);
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!DEMO_CONFIG.video || !videoSceneKey) {
      return;
    }

    const sceneState = getVideoSceneState(videoSceneKey);
    setView(sceneState.view);
    setActiveId(sceneState.activeId);
    setSelectedScanId(sceneState.activeId);
    setMemories(sceneState.memories);
    setCurrentUser(sceneState.currentUser);
    setShowMessages(sceneState.showMessages);
    setNewEntry(sceneState.newEntry);
    setNewMessage('');
  }, [videoSceneKey]);

  useEffect(() => {
    if (!DEMO_CONFIG.video || typeof window === 'undefined' || !videoSceneKey) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.set('demo', 'video');
    params.set('scene', videoSceneKey);
    if (videoAutoPlay) {
      params.set('autoplay', '1');
    } else {
      params.delete('autoplay');
    }
    if (DEMO_CONFIG.hideDirector) {
      params.set('ui', '0');
    }
    if (!videoCaptionsVisible) {
      params.set('captions', '0');
    } else {
      params.delete('captions');
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [videoSceneKey, videoAutoPlay, videoCaptionsVisible]);

  useEffect(() => {
    if (DEMO_CONFIG.video || typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const memoryId = params.get('nfc') || params.get('tag');
    if (!memoryId || !memories[memoryId]) {
      return;
    }

    setSelectedScanId(memoryId);
    setMemories((prev) => ({
      ...prev,
      [memoryId]: {
        ...prev[memoryId],
        unlocked: true
      }
    }));
    setActiveId(memoryId);
    setShowMessages(false);
    setView('memory');
    showToast(`Opened from NFC tag: ${memories[memoryId].title}`);
  }, []);

  useEffect(() => {
    if (!DEMO_CONFIG.video || !videoAutoPlay || !activeVideoScene) {
      return;
    }

    const timer = window.setTimeout(() => {
      setVideoSceneKey((currentKey) => {
        const currentIndex = VIDEO_SCENES.findIndex((scene) => scene.key === currentKey);
        const nextIndex = Math.min(currentIndex + 1, VIDEO_SCENES.length - 1);
        if (nextIndex === currentIndex) {
          setVideoAutoPlay(false);
          return currentKey;
        }
        return VIDEO_SCENES[nextIndex].key;
      });
    }, activeVideoScene.durationMs || 7000);

    return () => window.clearTimeout(timer);
  }, [videoAutoPlay, activeVideoScene]);

  useEffect(() => {
    if (!DEMO_CONFIG.video) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        setVideoSceneKey((currentKey) => {
          const currentIndex = VIDEO_SCENES.findIndex((scene) => scene.key === currentKey);
          const nextIndex = Math.min(currentIndex + 1, VIDEO_SCENES.length - 1);
          return VIDEO_SCENES[nextIndex].key;
        });
      }
      if (event.key === 'ArrowLeft') {
        setVideoSceneKey((currentKey) => {
          const currentIndex = VIDEO_SCENES.findIndex((scene) => scene.key === currentKey);
          const nextIndex = Math.max(currentIndex - 1, 0);
          return VIDEO_SCENES[nextIndex].key;
        });
      }
      if (event.key.toLowerCase() === 'c') {
        setVideoCaptionsVisible((visible) => !visible);
      }
      if (event.key === ' ') {
        event.preventDefault();
        setVideoAutoPlay((enabled) => !enabled);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const handleSimulateScan = (targetId = selectedScanId) => {
    if (!targetId || !memories[targetId]) return;
    setView('scanning');
    setTimeout(() => {
      triggerHapticSuccess(); // 触发触感和声效反馈
      const idToUnlock = targetId;
      setMemories(prev => ({
        ...prev,
        [idToUnlock]: { ...prev[idToUnlock], unlocked: true }
      }));
      setActiveId(idToUnlock);
      setSelectedScanId(idToUnlock);
      setView('memory');
      if (DEMO_CONFIG.video && videoSceneKey === 'scan') {
        setVideoSceneKey('reveal');
      }
    }, DEMO_CONFIG.video ? 1200 : 1800);
  };

  const handleSimulateWrite = (e) => {
    e?.preventDefault?.();
    if (!newEntry.title) return;
    
    // 如果是从扫描跳转过来的，优先使用物理标签 ID
    const newId = pendingTagId || `custom_${Date.now()}`;
    
    setMemories(prev => ({
      ...prev,
      [newId]: { 
        ...newEntry, 
        id: newId, 
        unlocked: true, 
        color: newEntry.color || "#a855f7",
        author: currentUser,
        messages: []
      }
    }));
    
    showToast(`${pendingTagId ? 'Physical object linked!' : 'Memory saved.'} ${currentUser === 'grandchild' ? 'Grandparents can now view your story.' : 'The younger generation can now receive this memory.'}`);
    
    setNewEntry({ ...EMPTY_ENTRY });
    setPendingTagId(null); // 清除挂起的标签
    setSelectedScanId(newId);
    setActiveId(newId);
    setShowMessages(false);
    setView('memory');
    
    if (DEMO_CONFIG.video && videoSceneKey === 'create') {
      setVideoSceneKey('impact');
    }
  };

  const appendMessage = (text, from = currentUser) => {
    if (!text.trim() || !activeId) return;

    const message = {
      id: `msg_${Date.now()}`,
      text: text.trim(),
      from,
      timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    };

    setMemories(prev => ({
      ...prev,
      [activeId]: {
        ...prev[activeId],
        messages: [...(prev[activeId].messages || []), message]
      }
    }));
  };

  // Add a message to a memory (inter-generational interaction)
  const handleAddMessage = (e) => {
    e.preventDefault();
    appendMessage(newMessage);
    setNewMessage('');
  };

  const handleSendPresetMessage = (text) => {
    appendMessage(text);
    setNewMessage('');
    showToast('Demo reply sent');
  };

  // Switch user role (for demo/testing)
  const toggleUser = () => {
    const newUser = currentUser === 'grandchild' ? 'grandparent' : 'grandchild';
    setCurrentUser(newUser);
    showToast(`Switched to: ${getUserLabel(newUser)}`);
  };

  const openMemory = (memoryId) => {
    if (!memories[memoryId]) return;
    setActiveId(memoryId);
    setSelectedScanId(memoryId);
    setShowMessages(false);
    setView('memory');
  };

  const routeLockedMemoryToScan = (memoryId) => {
    if (!memories[memoryId]) return;
    setSelectedScanId(memoryId);
    setView('scan');
    showToast(`Selected for NFC tap: ${memories[memoryId].title}`);
  };

  const handleDetectedScan = (memoryId) => {
    setNfcToolsOpen(false);
    
    // 如果是已知记忆，直接打开
    if (memories[memoryId]) {
      setSelectedScanId(memoryId);
      showToast(`Recognized: ${memories[memoryId].title}`);
      handleSimulateScan(memoryId);
      return;
    }

    // 如果是未知标签，引导创建 (Member B 核心需求：扫描即录入)
    setPendingTagId(memoryId);
    triggerHapticSuccess(); // 使用特殊的声音和震动提示
    
    if (window.confirm(`Discovered an unknown family object (ID: ${memoryId}). Would you like to record a new story for it?`)) {
      setNewEntry({ ...EMPTY_ENTRY, title: `Memory of ${memoryId.slice(0, 8)}` });
      setView('create');
    } else {
      setPendingTagId(null);
    }
  };

  const stepVideoScene = (direction) => {
    if (!DEMO_CONFIG.video || !activeVideoScene) return;
    const nextIndex = Math.min(Math.max(videoSceneIndex + direction, 0), VIDEO_SCENES.length - 1);
    setVideoSceneKey(VIDEO_SCENES[nextIndex].key);
  };

  const handleVideoSceneAction = () => {
    if (!activeVideoScene) return;
    if (activeVideoScene.key === 'scan') {
      handleSimulateScan();
      return;
    }
    if (activeVideoScene.key === 'dialogue') {
      const suggested = QUICK_REPLIES[currentUser]?.[0];
      if (suggested) {
        handleSendPresetMessage(suggested);
      }
      return;
    }
    if (activeVideoScene.key === 'create') {
      handleSimulateWrite();
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-slate-950 flex items-center justify-center p-0 md:p-6 font-sans overflow-hidden text-slate-900">
      
      {/* 核心容器：锁定高级的 10:19.5 旗舰机比例 */}
      <div className="relative h-full md:h-[min(844px,92vh)] aspect-[10/19.5] bg-slate-50 md:rounded-[3.5rem] md:shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:border-[10px] border-slate-900 transition-all duration-300">
        
        {DEMO_CONFIG.video && activeVideoScene && (
          <VideoSceneOverlay
            scene={activeVideoScene}
            currentIndex={videoSceneIndex}
            total={VIDEO_SCENES.length}
            captionsVisible={videoCaptionsVisible}
            autoPlay={videoAutoPlay}
            onPrev={() => stepVideoScene(-1)}
            onNext={() => stepVideoScene(1)}
            onToggleAuto={() => setVideoAutoPlay((enabled) => !enabled)}
            onToggleCaptions={() => setVideoCaptionsVisible((visible) => !visible)}
            onSceneAction={handleVideoSceneAction}
            hideDirector={DEMO_CONFIG.hideDirector}
          />
        )}

        {toast && (
          <div className="absolute left-1/2 top-24 z-[130] w-[min(84%,300px)] -translate-x-1/2 rounded-full bg-slate-950/86 px-5 py-3 text-center text-[11px] font-bold text-white shadow-2xl backdrop-blur-xl">
            {toast}
          </div>
        )}

        {nfcToolsOpen && (
          <NfcToolsModal
            memories={memories}
            onDetected={handleDetectedScan}
            onClose={() => setNfcToolsOpen(false)}
          />
        )}

        <main className="relative flex-1 overflow-y-auto no-scrollbar">
          {view === 'scan' && (
            <div className="flex h-full flex-col p-5 text-center animate-in fade-in duration-500 sm:p-8">
              <header className="mb-6 pt-10 sm:mb-8 sm:pt-16">
                <div className="mb-4 inline-flex items-center gap-3 rounded-[1.7rem] bg-indigo-50 px-5 py-4 text-indigo-600 shadow-inner sm:mb-5 sm:rounded-[2rem]">
                  <SmartphoneNfc size={28} />
                  <span className="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-500">NFC Demo Ready</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">TimeLens</h1>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 opacity-60">Memory Portal</p>
              </header>

              <div className="flex flex-1 flex-col items-center justify-start gap-5 sm:justify-center sm:-mt-8">
                <div className="w-full max-w-[360px] rounded-[2.3rem] border border-slate-100 bg-white/95 p-5 text-left shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.28em] text-indigo-500">Selected keepsake</p>
                    <div className="rounded-full px-3 py-2 text-[10px] font-black tracking-[0.18em]" style={{ backgroundColor: `${selectedMemory?.color || '#e2e8f0'}20`, color: selectedMemory?.color || '#475569' }}>
                      {getMemoryStatusText(selectedMemory)}
                    </div>
                  </div>
                  <h3 className="mt-4 text-[1.7rem] font-black leading-[1.02] tracking-tight text-slate-900 sm:text-[1.9rem]">
                    {selectedMemory?.title || 'Family keepsake'}
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    {selectedMemory ? (
                      <>
                        <span>{selectedMemory.year}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-600">{getUserRoleText(selectedMemory.author)}</span>
                      </>
                    ) : (
                      <span>Choose a family keepsake</span>
                    )}
                  </div>
                  <p className="mt-4 text-[12px] leading-relaxed text-slate-500">
                    {selectedMemory ? getMemoryPreview(selectedMemory.story) : 'Choose a family keepsake first, then start the NFC tap flow.'}
                  </p>
                </div>

                <div onClick={() => handleSimulateScan(selectedScanId)} className="relative flex h-44 w-44 cursor-pointer items-center justify-center transition-transform active:scale-90 sm:h-52 sm:w-52">
                  <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping"></div>
                  <div className="relative flex h-36 w-36 flex-col items-center justify-center gap-3 rounded-full border border-slate-50 bg-white shadow-2xl sm:h-40 sm:w-40 sm:gap-4">
                    <Nfc size={38} className="text-indigo-600" />
                    <span className="text-[10px] font-black uppercase leading-none tracking-[0.3em] text-slate-300">Tap to Reveal</span>
                  </div>
                </div>

                <div className="grid w-full max-w-[360px] grid-cols-1 gap-3 sm:grid-cols-2">
                  <button onClick={() => setNfcToolsOpen(true)} className="flex items-center justify-center gap-2 rounded-full border border-slate-100 bg-white px-5 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-slate-700 shadow-sm transition-all active:scale-95">
                    <Nfc size={14} /> NFC Tools
                  </button>
                  <button onClick={() => setView('hunt')} className="flex items-center justify-center gap-2 rounded-full border border-indigo-50 bg-white px-5 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-600 shadow-[0_4px_15px_rgba(79,70,229,0.1)] transition-all active:scale-95">
                    <Map size={14} /> Map
                  </button>
                </div>

                <div className="w-full max-w-[360px]">
                  <p className="mb-3 text-[9px] font-black uppercase tracking-[0.28em] text-slate-400">Choose a keepsake</p>
                  <div className="grid grid-cols-1 gap-3">
                    {memoryList.map((memory) => (
                      <button
                        key={memory.id}
                        type="button"
                        onClick={() => setSelectedScanId(memory.id)}
                        className={`rounded-[1.8rem] border px-4 py-4 text-left transition-all active:scale-[0.98] ${selectedScanId === memory.id ? 'border-indigo-400 bg-indigo-50 shadow-sm' : 'border-slate-100 bg-white'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="break-words text-sm font-black text-slate-900">{memory.title}</div>
                            <div className="mt-1 text-[11px] text-slate-500">{memory.year} · {memory.unlocked ? 'Already added to map' : 'Not tapped yet'}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'scanning' && (
            <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white animate-in fade-in">
              <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <h2 className="text-[10px] font-black tracking-[0.4em] mt-10 uppercase text-indigo-400 animate-pulse leading-none tracking-widest">Syncing Reality</h2>
            </div>
          )}

          {view === 'memory' && activeId && (
            <div className="h-full w-full bg-black relative animate-in fade-in duration-1000 overflow-hidden shadow-inner">
              {/* Top Bar */}
              <div className="absolute left-0 right-0 top-0 z-50 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent p-4 pt-10 sm:p-6 sm:pt-12">
                <button onClick={() => {setView('scan'); setShowMessages(false);}} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-2xl transition-all active:scale-90 sm:px-5">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={toggleUser} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-2xl transition-all active:scale-90 sm:px-4">
                  <User size={14} /> {getUserLabel(currentUser)}
                </button>
              </div>

              {/* 3D Scene */}
              <div className={`transition-all duration-500 ${showMessages ? 'h-[55%]' : 'h-full'}`}>
                <Canvas shadows dpr={[1, 2]} className="bg-slate-950">
                  <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
                  <ambientLight intensity={0.5} />
                  <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
                  <pointLight position={[-10, -10, -10]} color="#4f46e5" intensity={1} />
                  <Suspense fallback={null}>
                    <HighEndHeirloom data={memories[activeId]} />
                    <Environment preset="studio" />
                    <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={15} blur={2.5} far={4} />
                  </Suspense>
                  <OrbitControls 
                    enablePan={false} 
                    enableZoom={false} 
                    enableDamping={true} 
                    dampingFactor={0.05} 
                    rotateSpeed={0.8}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 1.5}
                  />
                </Canvas>
              </div>

              {/* Message Toggle Button */}
              <div className={`absolute left-1/2 z-40 -translate-x-1/2 transition-all duration-500 ${showMessages ? 'bottom-[calc(45%-12px)] mb-2' : 'bottom-20'}`}>
                <button onClick={() => setShowMessages(!showMessages)} className="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white shadow-2xl transition-all active:scale-90 sm:px-6">
                  <MessageCircle size={16} />
                  {showMessages ? 'Hide messages' : `View messages (${memories[activeId]?.messages?.length || 0})`}
                </button>
              </div>

              {/* Messages Panel */}
              <div className={`absolute bottom-0 left-0 right-0 z-30 rounded-t-[2.2rem] bg-white/95 backdrop-blur-2xl transition-all duration-500 ${showMessages ? 'h-[45%] translate-y-0' : 'h-[45%] translate-y-full'} sm:rounded-t-[2.5rem]`}>
                <div className="flex h-full flex-col p-4 sm:p-6">
                  {/* Handle bar */}
                  <button
                    type="button"
                    onClick={() => setShowMessages(false)}
                    className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-300"
                    aria-label="Close messages"
                  />
                  
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-black tracking-wide text-slate-800">
                    <MessageCircle size={16} className="text-indigo-600" />
                    Across-time dialogue
                    <span className="text-[10px] font-normal text-slate-400">
                      {currentUser === 'grandchild' ? 'Leave a message for grandparents' : 'Reply to the younger generation'}
                    </span>
                  </h3>

                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 no-scrollbar">
                    {(!memories[activeId]?.messages || memories[activeId].messages.length === 0) ? (
                      <div className="text-center py-8 text-slate-400">
                        <p className="text-xs">No messages yet</p>
                        <p className="text-[10px] mt-1">Be the first to continue the story.</p>
                      </div>
                    ) : (
                      memories[activeId].messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.from === currentUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[84%] rounded-2xl p-3 text-xs leading-relaxed ${
                            msg.from === 'grandchild' 
                              ? 'bg-indigo-100 text-indigo-900 rounded-br-md' 
                              : 'bg-amber-100 text-amber-900 rounded-bl-md'
                          }`}>
                            <div className="mb-1 flex items-center gap-1 opacity-60">
                              <span className="text-[9px] font-bold">
                                {msg.from === 'grandchild' ? 'Grandchild' : 'Grandparent'}
                              </span>
                              <span className="text-[8px]">· {msg.timestamp}</span>
                            </div>
                            <p>{msg.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
                    {QUICK_REPLIES[currentUser].map((reply) => (
                      <button
                        key={reply}
                        type="button"
                        onClick={() => handleSendPresetMessage(reply)}
                        className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-[10px] font-bold leading-snug text-slate-600 transition-all active:scale-95"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleAddMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder={currentUser === 'grandchild' ? "What would you like to ask or say?" : "Write a reply to the younger generation..."}
                      className="flex-1 rounded-full bg-slate-100 p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button 
                      type="submit" 
                      disabled={!newMessage.trim()}
                      className="rounded-full bg-indigo-600 p-3 text-white transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {view === 'hunt' && (
            <div className="animate-in p-5 slide-in-from-right duration-500 sm:p-8">
              <div className="mb-8 mt-6 flex flex-col gap-3 sm:mb-10 sm:mt-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-3xl font-black leading-none tracking-tight text-slate-900">Map</h2>
                  <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    {lockedCount} Items Remaining
                  </p>
                </div>
                <div className="w-full text-left text-lg font-black italic leading-none tracking-tight text-indigo-600 sm:w-auto sm:text-right sm:text-3xl">
                  {Math.round((unlockedCount / memoryList.length) * 100)}%
                </div>
              </div>

              <div className="mb-5 rounded-[2rem] bg-indigo-50 px-5 py-4 text-left">
                <div className="text-[9px] font-black uppercase tracking-[0.28em] text-indigo-500">Collection status</div>
                <div className="mt-2 text-sm font-bold text-slate-700">
                  {unlockedCount} memories unlocked · {memoryList.reduce((sum, memory) => sum + (memory.messages?.length || 0), 0)} total messages
                </div>
              </div>

              <div className="space-y-4 pb-12">
                {memoryList.map((m) => (
                  <div key={m.id} className={`p-5 rounded-[2.8rem] border-2 transition-all ${m.unlocked ? 'bg-white border-indigo-50 shadow-sm' : 'bg-slate-100 border-transparent opacity-75'}`}>
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between gap-3">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-[1.5rem] shrink-0 ${m.unlocked ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                          {m.unlocked ? <CheckCircle2 size={24} strokeWidth={3} /> : <Lock size={20} />}
                        </div>
                        <div className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${m.unlocked ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                          {m.unlocked ? 'Unlocked' : 'Locked'}
                        </div>
                      </div>

                      <div className="mt-4 min-w-0">
                        <h4 className="text-[1.1rem] font-black leading-tight tracking-tight text-slate-800">
                          {m.unlocked ? m.title : "Mystery"}
                        </h4>
                        <p className="mt-2 text-[11px] font-black leading-snug text-slate-400 opacity-70">
                          {m.unlocked ? `${m.year} · ${getUserRoleText(m.author)} · ${getMessageCountText((m.messages || []).length)}` : "Tap the NFC tag to unlock"}
                        </p>
                        <p
                          className="mt-3 text-sm leading-relaxed text-slate-500"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {m.unlocked ? getMemoryPreview(m.story) : 'A hidden family memory is waiting behind this object.'}
                        </p>
                        <div className="mt-4 grid grid-cols-1 gap-2">
                          {m.unlocked ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openMemory(m.id)}
                                className="w-full rounded-full bg-indigo-600 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all active:scale-95"
                              >
                                View memory
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveId(m.id);
                                  setShowMessages(true);
                                  setView('memory');
                                }}
                                className="w-full rounded-full bg-slate-100 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 transition-all active:scale-95"
                              >
                                Open dialogue
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => routeLockedMemoryToScan(m.id)}
                              className="w-full rounded-full bg-slate-900 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all active:scale-95"
                            >
                              Go to tap
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'create' && (
            <div className="animate-in p-5 slide-in-from-bottom duration-500 sm:p-8">
              <h2 className="mt-6 mb-1 text-3xl font-black leading-none tracking-tight text-slate-900 sm:mt-8">Record</h2>
              <p className="mb-8 text-[9px] font-bold uppercase tracking-[0.3em] text-indigo-600 sm:mb-10">Archive Legacy</p>

              <div className="mb-6 rounded-[2rem] bg-white p-5 shadow-sm border border-slate-100">
                <div className="text-[9px] font-black uppercase tracking-[0.28em] text-indigo-500">Current storyteller</div>
                <div className="mt-2 text-sm font-bold text-slate-700">{getUserLabel(currentUser)}</div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">Use this page to record a new keepsake story. After saving, it becomes available in the demo and can later be connected to a physical tag.</p>
              </div>

              <div className="mb-6">
                <p className="mb-3 text-[9px] font-black uppercase tracking-[0.28em] text-slate-400">Quick fill templates</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {[VIDEO_CREATE_ENTRY, {
                    title: "Dad's Old Train Ticket",
                    year: '2003',
                    story: 'This ticket was kept from the day Dad first left home to start university.'
                  }].map((template) => (
                    <button
                      key={template.title}
                      type="button"
                      onClick={() => setNewEntry(template)}
                      className="shrink-0 rounded-full bg-white px-4 py-3 text-[10px] font-black tracking-[0.08em] text-slate-600 shadow-sm transition-all active:scale-95"
                    >
                      {template.title}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSimulateWrite} className="space-y-6">
                <div>
                  <label className="mb-3 block px-3 text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">Item name</label>
                  <input type="text" value={newEntry.title} onChange={e => setNewEntry({...newEntry, title: e.target.value})} className="w-full rounded-[2rem] border-2 border-slate-100 bg-white p-4 text-sm outline-none transition-all shadow-sm focus:border-indigo-500" placeholder="For example: Grandma's scarf" />
                </div>
                <div>
                  <label className="mb-3 block px-3 text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">Year</label>
                  <input type="text" value={newEntry.year} onChange={e => setNewEntry({...newEntry, year: e.target.value})} className="w-full rounded-[2rem] border-2 border-slate-100 bg-white p-4 text-sm outline-none transition-all shadow-sm focus:border-indigo-500" placeholder="For example: 1980" />
                </div>
                <div>
                  <label className="mb-3 block px-3 text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">The story</label>
                  <textarea rows="4" value={newEntry.story} onChange={e => setNewEntry({...newEntry, story: e.target.value})} className="w-full resize-none rounded-[2rem] border-2 border-slate-100 bg-white p-5 text-sm outline-none transition-all shadow-sm focus:border-indigo-500" placeholder="Write a short family story behind this keepsake..." />
                </div>
                <div>
                  <label className="mb-3 block px-3 text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">Memory Aura Color</label>
                  <div className="flex flex-wrap gap-3 px-2">
                    {['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#a855f7'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewEntry({...newEntry, color})}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${newEntry.color === color ? 'border-slate-900 scale-125' : 'border-transparent opacity-60'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <button type="submit" className="mt-4 w-full rounded-[2.5rem] bg-slate-900 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all active:scale-[0.98]">
                  <Save size={18} className="mr-2 inline" /> Save memory
                </button>
              </form>
            </div>
          )}
        </main>

        <footer className="h-20 bg-white/95 backdrop-blur-2xl border-t border-slate-50 flex items-center justify-around px-10 pb-6 text-slate-300 z-50 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
          <button onClick={() => setView('scan')} className={`flex flex-col items-center gap-2 transition-all ${view === 'scan' || view === 'memory' ? 'text-indigo-600 scale-110' : ''}`}>
            <Scan size={22} strokeWidth={3} />
            <span className="text-[8px] font-black uppercase tracking-widest">Tap</span>
          </button>
          
          <button onClick={() => setView('hunt')} className={`flex flex-col items-center gap-2 transition-all ${view === 'hunt' ? 'text-indigo-600 scale-110' : ''}`}>
            <Map size={22} strokeWidth={3} />
            <span className="text-[8px] font-black uppercase tracking-widest">Map</span>
          </button>

          <button onClick={() => setView('create')} className={`flex flex-col items-center gap-2 transition-all ${view === 'create' ? 'text-indigo-600 scale-110' : ''}`}>
            <PlusCircle size={22} strokeWidth={3} />
            <span className="text-[8px] font-black uppercase tracking-widest">Add</span>
          </button>
        </footer>

      </div>
    </div>
  );
}
