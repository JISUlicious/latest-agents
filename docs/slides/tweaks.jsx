/* global React, ReactDOM, useTweaks, TweaksPanel, TweakSection, TweakSlider,
   TweakToggle, TweakRadio, TweakColor, TweakSelect */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "palette": "terracotta",
  "typeFamily": "serif-grotesque",
  "diagramStyle": "clean",
  "density": "detailed",
  "scale": 100
}/*EDITMODE-END*/;

const PALETTES = [
  // Terracotta cream (default — option 0 user picked)
  ["#f6f1e8", "#c8553d", "#e8a87c", "#3d5a4c"],
  // Sienna butter
  ["#faf4ec", "#d97706", "#b45309", "#7c2d12"],
  // Clay sage
  ["#f5ede2", "#cc6b49", "#d4a373", "#606c38"],
  // Linen
  ["#efe6d4", "#b85450", "#e6a266", "#4a5c3a"],
];
const PALETTE_KEYS = ["terracotta", "sienna", "claysage", "linen"];

function applyToRoot(t) {
  const r = document.documentElement;
  r.setAttribute("data-mode", t.dark ? "dark" : "light");
  r.setAttribute("data-palette", t.palette);
  r.setAttribute("data-type-family", t.typeFamily);
  r.setAttribute("data-diagram-style", t.diagramStyle);
  r.setAttribute("data-density", t.density);
  r.style.setProperty("--scale", (t.scale / 100).toFixed(2));
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => { applyToRoot(t); }, [t]);

  // Translate the palette swatch array back into the named key.
  const onPalette = (val) => {
    const idx = PALETTES.findIndex(
      (p) => JSON.stringify(p) === JSON.stringify(val)
    );
    if (idx >= 0) setTweak("palette", PALETTE_KEYS[idx]);
  };
  const currentPalette = PALETTES[PALETTE_KEYS.indexOf(t.palette)] || PALETTES[0];

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="테마" />
      <TweakToggle  label="Dark mode" value={t.dark}
                    onChange={(v) => setTweak("dark", v)} />
      <TweakColor   label="색상" value={currentPalette} options={PALETTES}
                    onChange={onPalette} />

      <TweakSection label="타이포그래피" />
      <TweakSelect  label="폰트"
                    value={t.typeFamily}
                    options={[
                      { value: "serif-grotesque", label: "Editorial serif + sans" },
                      { value: "all-serif",       label: "All-serif (literary)" },
                      { value: "modern-sans",     label: "Modern sans" },
                      { value: "mono-accent",     label: "Mono accent" },
                    ]}
                    onChange={(v) => setTweak("typeFamily", v)} />
      <TweakSlider  label="크기" value={t.scale}
                    min={75} max={120} step={5} unit="%"
                    onChange={(v) => setTweak("scale", v)} />

      <TweakSection label="다이어그램" />
      <TweakSelect  label="스타일"
                    value={t.diagramStyle}
                    options={[
                      { value: "clean",     label: "Clean geometric" },
                      { value: "editorial", label: "Editorial (annotated)" },
                      { value: "sketched",  label: "Sketched (italic)" },
                      { value: "blueprint", label: "Blueprint (mono)" },
                    ]}
                    onChange={(v) => setTweak("diagramStyle", v)} />
      <TweakRadio   label="밀도" value={t.density}
                    options={[
                      { value: "minimal",  label: "Minimal" },
                      { value: "detailed", label: "Detailed" },
                    ]}
                    onChange={(v) => setTweak("density", v)} />
    </TweaksPanel>
  );
}

// Apply defaults at boot so first paint matches the stored tweak values, even
// before the panel mounts.
applyToRoot(TWEAK_DEFAULTS);

const root = ReactDOM.createRoot(document.getElementById("tweaks-root"));
root.render(<App />);
