import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
  spring,
  useVideoConfig,
} from 'remotion';

// ─── Types ───────────────────────────────────────

interface Country {
  name: string;
  slug: string;
  code: string;
}

interface Indicator {
  name: string;
  valueA: number | null;
  valueB: number | null;
  format: string;
  label: string;
}

export interface VideoProps {
  countryA: Country;
  countryB: Country;
  indicators: Indicator[];
  audioDurationInFrames: number;
}

// ─── Constants ───────────────────────────────────

const COLOR_A = '#4ecdc4';
const COLOR_B = '#ff6b6b';
const BG_DARK = '#0a0a2e';
const BG_CARD = '#12123a';
const TEXT_WHITE = '#ffffff';
const TEXT_DIM = '#8888aa';
const ACCENT = '#ffd93d';

// ─── Helpers ─────────────────────────────────────

function formatValue(value: number | null, format: string): string {
  if (value === null) return 'N/A';
  switch (format) {
    case 'billions': {
      const b = value / 1e9;
      if (b >= 1000) return `$${(b / 1000).toFixed(1)}T`;
      return `$${b.toFixed(0)}B`;
    }
    case 'millions': {
      const m = value / 1e6;
      if (m >= 1000) return `${(m / 1000).toFixed(2)}B`;
      return `${m.toFixed(0)}M`;
    }
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'years':
      return `${value.toFixed(1)} yrs`;
    default:
      return String(value);
  }
}

function getCountryFlag(code: string): string {
  if (code.length !== 2) return '';
  const offset = 0x1f1e6;
  const a = code.toUpperCase().charCodeAt(0) - 65 + offset;
  const b = code.toUpperCase().charCodeAt(1) - 65 + offset;
  return String.fromCodePoint(a) + String.fromCodePoint(b);
}

// ─── Animated Number ─────────────────────────────

const AnimatedNumber: React.FC<{
  value: number | null;
  format: string;
  delay?: number;
}> = ({ value, format, delay = 0 }) => {
  const frame = useCurrentFrame();
  if (value === null) return <span>N/A</span>;

  const progress = interpolate(frame - delay, [0, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const current = value * progress;
  return <span>{formatValue(current, format)}</span>;
};

// ─── Title Scene ─────────────────────────────────

const TitleScene: React.FC<{
  countryA: Country;
  countryB: Country;
}> = ({ countryA, countryB }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(frame, [0, 20], [60, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const vsScale = spring({ frame: frame - 15, fps, config: { damping: 12 } });

  const subtitleOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, #1a1a4e 0%, ${BG_DARK} 70%)`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 60,
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 80 }}>{getCountryFlag(countryA.code)}</div>
          <div style={{ fontSize: 52, fontWeight: 'bold', color: COLOR_A, marginTop: 10 }}>
            {countryA.name}
          </div>
        </div>

        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: ACCENT,
            transform: `scale(${vsScale})`,
          }}
        >
          VS
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 80 }}>{getCountryFlag(countryB.code)}</div>
          <div style={{ fontSize: 52, fontWeight: 'bold', color: COLOR_B, marginTop: 10 }}>
            {countryB.name}
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 28,
          color: TEXT_DIM,
          marginTop: 40,
          opacity: subtitleOpacity,
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}
      >
        Economic Comparison 2024
      </div>
    </AbsoluteFill>
  );
};

// ─── Bar Comparison Scene ────────────────────────

const BarCompareScene: React.FC<{
  countryA: Country;
  countryB: Country;
  indicator: Indicator;
}> = ({ countryA, countryB, indicator }) => {
  const frame = useCurrentFrame();
  const { valueA, valueB, format, label } = indicator;

  const maxVal = Math.max(Math.abs(valueA || 0), Math.abs(valueB || 0), 1);
  const MAX_BAR_WIDTH = 900;

  const barProgress = interpolate(frame, [10, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const labelOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const widthA = ((Math.abs(valueA || 0) / maxVal) * MAX_BAR_WIDTH) * barProgress;
  const widthB = ((Math.abs(valueB || 0) / maxVal) * MAX_BAR_WIDTH) * barProgress;

  return (
    <AbsoluteFill
      style={{
        background: BG_DARK,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: 48,
          fontWeight: 'bold',
          color: ACCENT,
          marginBottom: 60,
          opacity: labelOpacity,
          textTransform: 'uppercase',
          letterSpacing: 3,
        }}
      >
        {label}
      </div>

      {/* Country A Bar */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30, width: 1400 }}>
        <div
          style={{
            width: 280,
            textAlign: 'right',
            paddingRight: 20,
            fontSize: 28,
            fontWeight: 'bold',
            color: COLOR_A,
          }}
        >
          {getCountryFlag(countryA.code)} {countryA.name}
        </div>
        <div
          style={{
            height: 70,
            width: widthA,
            backgroundColor: COLOR_A,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 16,
            minWidth: widthA > 0 ? 80 : 0,
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 'bold', color: BG_DARK }}>
            <AnimatedNumber value={valueA} format={format} delay={10} />
          </span>
        </div>
      </div>

      {/* Country B Bar */}
      <div style={{ display: 'flex', alignItems: 'center', width: 1400 }}>
        <div
          style={{
            width: 280,
            textAlign: 'right',
            paddingRight: 20,
            fontSize: 28,
            fontWeight: 'bold',
            color: COLOR_B,
          }}
        >
          {getCountryFlag(countryB.code)} {countryB.name}
        </div>
        <div
          style={{
            height: 70,
            width: widthB,
            backgroundColor: COLOR_B,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 16,
            minWidth: widthB > 0 ? 80 : 0,
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 'bold', color: BG_DARK }}>
            <AnimatedNumber value={valueB} format={format} delay={10} />
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Summary Table Scene ─────────────────────────

const SummaryScene: React.FC<{
  countryA: Country;
  countryB: Country;
  indicators: Indicator[];
}> = ({ countryA, countryB, indicators }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: BG_DARK,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 42,
          fontWeight: 'bold',
          color: ACCENT,
          marginBottom: 40,
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}
      >
        Summary
      </div>

      <div
        style={{
          background: BG_CARD,
          borderRadius: 20,
          padding: '30px 60px',
          border: '1px solid #2a2a5e',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            borderBottom: '2px solid #2a2a5e',
            paddingBottom: 16,
            marginBottom: 12,
          }}
        >
          <div style={{ width: 260, fontSize: 22, color: TEXT_DIM }}>Indicator</div>
          <div style={{ width: 240, fontSize: 22, color: COLOR_A, fontWeight: 'bold', textAlign: 'center' }}>
            {getCountryFlag(countryA.code)} {countryA.name}
          </div>
          <div style={{ width: 240, fontSize: 22, color: COLOR_B, fontWeight: 'bold', textAlign: 'center' }}>
            {getCountryFlag(countryB.code)} {countryB.name}
          </div>
        </div>

        {/* Rows */}
        {indicators.map((ind, i) => {
          const rowOpacity = interpolate(frame, [10 + i * 8, 20 + i * 8], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const rowY = interpolate(frame, [10 + i * 8, 20 + i * 8], [20, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          });

          // Determine winner
          const aWins = (ind.valueA || 0) > (ind.valueB || 0);
          // For unemployment and inflation, lower is better
          const lowerIsBetter = ind.name === 'unemployment rate' || ind.name === 'inflation rate';
          const aHighlight = lowerIsBetter ? !aWins : aWins;

          return (
            <div
              key={ind.name}
              style={{
                display: 'flex',
                padding: '14px 0',
                borderBottom: i < indicators.length - 1 ? '1px solid #1e1e4e' : 'none',
                opacity: rowOpacity,
                transform: `translateY(${rowY}px)`,
              }}
            >
              <div style={{ width: 260, fontSize: 24, color: TEXT_WHITE, fontWeight: 500 }}>
                {ind.label}
              </div>
              <div
                style={{
                  width: 240,
                  fontSize: 26,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: aHighlight ? COLOR_A : TEXT_WHITE,
                }}
              >
                {formatValue(ind.valueA, ind.format)}
              </div>
              <div
                style={{
                  width: 240,
                  fontSize: 26,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: !aHighlight ? COLOR_B : TEXT_WHITE,
                }}
              >
                {formatValue(ind.valueB, ind.format)}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── CTA Scene ───────────────────────────────────

const CTAScene: React.FC<{
  countryA: Country;
  countryB: Country;
}> = ({ countryA, countryB }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12 } });
  const urlOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, #1a1a4e 0%, ${BG_DARK} 70%)`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div style={{ transform: `scale(${scale})`, textAlign: 'center' }}>
        <div style={{ fontSize: 44, color: TEXT_WHITE, fontWeight: 'bold', marginBottom: 20 }}>
          Full Interactive Comparison
        </div>
        <div style={{ fontSize: 32, color: TEXT_DIM, marginBottom: 40 }}>
          50+ indicators &bull; Charts &bull; PDF Reports
        </div>
      </div>

      <div
        style={{
          opacity: urlOpacity,
          background: 'linear-gradient(135deg, #4ecdc4, #44a8a0)',
          padding: '20px 50px',
          borderRadius: 16,
          marginTop: 10,
        }}
      >
        <span style={{ fontSize: 40, fontWeight: 'bold', color: BG_DARK }}>
          country-compare.com
        </span>
      </div>

      <div
        style={{
          opacity: urlOpacity,
          fontSize: 22,
          color: TEXT_DIM,
          marginTop: 30,
        }}
      >
        Subscribe for weekly country comparisons!
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Composition ────────────────────────────

export const CountryVideo: React.FC<VideoProps> = ({
  countryA,
  countryB,
  indicators,
  audioDurationInFrames,
}) => {
  const fps = 30;

  // Scene timing (in seconds)
  const TITLE_DUR = 5;
  const INDICATOR_DUR = 9;
  const SUMMARY_DUR = 10;
  const CTA_DUR = 7;

  let currentFrame = 0;

  const titleStart = currentFrame;
  currentFrame += TITLE_DUR * fps;

  const indicatorStarts = indicators.map((_, i) => {
    const start = currentFrame;
    currentFrame += INDICATOR_DUR * fps;
    return start;
  });

  const summaryStart = currentFrame;
  currentFrame += SUMMARY_DUR * fps;

  const ctaStart = currentFrame;

  const indicatorLabels = ['GDP', 'Population', 'Unemployment', 'Inflation', 'Life Expectancy'];

  return (
    <AbsoluteFill style={{ backgroundColor: BG_DARK }}>
      {/* Audio narration */}
      <Audio src={staticFile('audio.mp3')} />

      {/* Title */}
      <Sequence from={titleStart} durationInFrames={TITLE_DUR * fps}>
        <TitleScene countryA={countryA} countryB={countryB} />
      </Sequence>

      {/* Individual indicator comparisons */}
      {indicators.map((ind, i) => (
        <Sequence key={ind.name} from={indicatorStarts[i]} durationInFrames={INDICATOR_DUR * fps}>
          <BarCompareScene
            countryA={countryA}
            countryB={countryB}
            indicator={{ ...ind, label: indicatorLabels[i] || ind.name }}
          />
        </Sequence>
      ))}

      {/* Summary table */}
      <Sequence from={summaryStart} durationInFrames={SUMMARY_DUR * fps}>
        <SummaryScene
          countryA={countryA}
          countryB={countryB}
          indicators={indicators.map((ind, i) => ({
            ...ind,
            label: indicatorLabels[i] || ind.name,
          }))}
        />
      </Sequence>

      {/* CTA */}
      <Sequence from={ctaStart} durationInFrames={CTA_DUR * fps}>
        <CTAScene countryA={countryA} countryB={countryB} />
      </Sequence>
    </AbsoluteFill>
  );
};
