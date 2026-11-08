import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { flushSync } from 'react-dom';
import { FaithfulPage } from '@/faithful/FaithfulPage';
import { Pill, type Mode } from './Pill';
import { layerStack, usePillStepAside } from './layerStack';
import { buildModeTransition, collectParts } from '@/motion/modeTransition';
import { getLanding } from '@/motion/landing';
import { isReducedMotion } from '@/motion/reduced';
import { registerHook, setLiveTransition } from './testHooks';
import s from './stage.module.scss';

type PaperModule = { PaperApp: ComponentType<PaperAppProps> };
export interface PaperAppProps {
  /** Runs the mode transition back to the original design (the About panel and the palette use it). */
  onViewOriginal: () => void;
  /** True while the stage is animating the arrival, so the view skips its own enter choreography. */
  arriving: boolean;
}

// Brandon's Mode loads behind the pill: preloaded on idle after first paint and on pill hover.
let paperModule: PaperModule | null = null;
let paperPromise: Promise<PaperModule> | null = null;
function preloadPaper(): Promise<PaperModule> {
  if (paperModule) return Promise.resolve(paperModule);
  paperPromise ??= import('@/paper/PaperApp').then((m) => {
    paperModule = m;
    return m;
  });
  return paperPromise;
}

interface Layers {
  faithful: boolean;
  paper: boolean;
}

export function ModeStage() {
  const [mode, setMode] = useState<Mode>('faithful');
  const [layers, setLayers] = useState<Layers>({ faithful: true, paper: false });
  const [transitioning, setTransitioning] = useState(false);
  const [arriving, setArriving] = useState(false);
  const [calm, setCalm] = useState(false);
  const [, setLoaded] = useState(Boolean(paperModule));
  const busy = useRef(false);
  const modeRef = useRef<Mode>('faithful');
  const faithfulLayer = useRef<HTMLDivElement>(null);
  const paperLayer = useRef<HTMLDivElement>(null);
  const dim = useRef<HTMLDivElement>(null);
  const stepAside = usePillStepAside();

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 600));
    idle(() => preloadPaper().then(() => setLoaded(true)));
  }, []);

  const finishInstant = useCallback((to: Mode) => {
    flushSync(() => {
      setLayers({ faithful: to === 'faithful', paper: to === 'paper' });
      setTransitioning(false);
      setArriving(false);
    });
  }, []);

  const go = useCallback(
    async (to: Mode, opts: { instant?: boolean } = {}) => {
      if (busy.current || modeRef.current === to) return;
      busy.current = true;
      modeRef.current = to;
      setMode(to);
      setCalm(true);
      if (to === 'paper' && !paperModule) {
        await preloadPaper();
        setLoaded(true);
      }
      // Anything open in the outgoing mode closes at t = 0, without its exit animation.
      layerStack.closeAll({ instant: true });

      if (opts.instant) {
        finishInstant(to);
        busy.current = false;
        return;
      }

      flushSync(() => {
        setLayers({ faithful: true, paper: true });
        setTransitioning(true);
        setArriving(to === 'paper');
      });

      const outgoing = to === 'paper' ? faithfulLayer.current : paperLayer.current;
      const incoming = to === 'paper' ? paperLayer.current : faithfulLayer.current;
      if (!outgoing || !incoming || !dim.current) {
        finishInstant(to);
        busy.current = false;
        return;
      }
      incoming.scrollTop = 0;
      const parts = collectParts(incoming);
      const tl = buildModeTransition({
        outgoing,
        incoming,
        dim: dim.current,
        parts,
        landing: to === 'paper' ? getLanding() : null,
        reduced: isReducedMotion(),
        onComplete: () => {
          setLiveTransition(null);
          finishInstant(to);
          busy.current = false;
        },
      });
      setLiveTransition({
        pause: () => void tl.pause(),
        seek: (seconds: number) => void tl.seek(seconds, false),
        play: () => void tl.play(),
      });
      tl.play();
    },
    [finishInstant],
  );

  const toggle = useCallback(() => {
    void go(modeRef.current === 'faithful' ? 'paper' : 'faithful');
  }, [go]);

  useEffect(() => {
    registerHook('setMode', (m, opts) => void go(m, opts));
  }, [go]);

  const Paper = paperModule?.PaperApp;
  const stageBg = mode === 'paper' ? s.toPaper : s.toFaithful;

  return (
    <>
      <div className={`${s.stage} ${stageBg}`} data-transitioning={transitioning ? 'true' : undefined}>
        {layers.faithful && (
          <div ref={faithfulLayer} className={s.layer} data-layer="faithful" inert={transitioning && mode === 'paper'}>
            <FaithfulPage />
          </div>
        )}
        {layers.paper && Paper && (
          <div ref={paperLayer} className={`${s.layer} ${s.paperLayer}`} data-layer="paper" inert={transitioning && mode === 'faithful'}>
            <Paper onViewOriginal={() => void go('faithful')} arriving={arriving} />
          </div>
        )}
        <div ref={dim} className={s.dim} aria-hidden="true" />
      </div>
      <Pill
        mode={mode}
        calm={calm}
        stepAside={stepAside}
        isBusy={() => busy.current}
        onToggle={toggle}
        onIntent={() => void preloadPaper().then(() => setLoaded(true))}
      />
    </>
  );
}
