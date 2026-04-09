import { useMemo, useState } from 'preact/hooks';
import './starter-utility-runner.css';

type Props = {
  toolSlug: string;
};

const lengthFactor: Record<string, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  in: 0.0254,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344,
};

const timeFactor: Record<string, number> = {
  second: 1,
  minute: 60,
  hour: 3600,
  day: 86400,
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const source = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : normalized;

  if (source.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }

  return {
    r: parseInt(source.slice(0, 2), 16),
    g: parseInt(source.slice(2, 4), 16),
    b: parseInt(source.slice(4, 6), 16),
  };
};

const rgbToHsl = (r: number, g: number, b: number) => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case red:
        h = (green - blue) / d + (green < blue ? 6 : 0);
        break;
      case green:
        h = (blue - red) / d + 2;
        break;
      default:
        h = (red - green) / d + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

export default function StarterUtilityRunner({ toolSlug }: Props) {
  const [value, setValue] = useState('1');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('km');

  const [timeValue, setTimeValue] = useState('60');
  const [fromTime, setFromTime] = useState('minute');
  const [toTime, setToTime] = useState('hour');

  const [hex, setHex] = useState('#0a8a82');

  const unitResult = useMemo(() => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 'Enter a numeric value.';
    }

    const baseMeters = parsed * (lengthFactor[fromUnit] ?? 1);
    const converted = baseMeters / (lengthFactor[toUnit] ?? 1);
    return `${converted.toFixed(6)} ${toUnit}`;
  }, [value, fromUnit, toUnit]);

  const timeResult = useMemo(() => {
    const parsed = Number(timeValue);
    if (!Number.isFinite(parsed)) {
      return 'Enter a numeric value.';
    }

    const baseSeconds = parsed * (timeFactor[fromTime] ?? 1);
    const converted = baseSeconds / (timeFactor[toTime] ?? 1);
    return `${converted.toFixed(6)} ${toTime}`;
  }, [timeValue, fromTime, toTime]);

  const colorResult = useMemo(() => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return {
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    };
  }, [hex]);

  if (toolSlug === 'unit-converter') {
    const units = Object.keys(lengthFactor);
    return (
      <section className="starter-runner">
        <h3>Unit Converter Starter</h3>
        <p>Convert common length units instantly in-browser.</p>
        <div className="fields-grid">
          <label>
            Value
            <input type="number" value={value} onInput={(event) => setValue((event.currentTarget as HTMLInputElement).value)} />
          </label>
          <label>
            From
            <select value={fromUnit} onInput={(event) => setFromUnit((event.currentTarget as HTMLSelectElement).value)}>
              {units.map((unit) => (
                <option value={unit}>{unit}</option>
              ))}
            </select>
          </label>
          <label>
            To
            <select value={toUnit} onInput={(event) => setToUnit((event.currentTarget as HTMLSelectElement).value)}>
              {units.map((unit) => (
                <option value={unit}>{unit}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="result">Result: {unitResult}</p>
      </section>
    );
  }

  if (toolSlug === 'time-converter') {
    const units = Object.keys(timeFactor);
    return (
      <section className="starter-runner">
        <h3>Time Converter Starter</h3>
        <p>Convert between seconds, minutes, hours, and days.</p>
        <div className="fields-grid">
          <label>
            Value
            <input
              type="number"
              value={timeValue}
              onInput={(event) => setTimeValue((event.currentTarget as HTMLInputElement).value)}
            />
          </label>
          <label>
            From
            <select value={fromTime} onInput={(event) => setFromTime((event.currentTarget as HTMLSelectElement).value)}>
              {units.map((unit) => (
                <option value={unit}>{unit}</option>
              ))}
            </select>
          </label>
          <label>
            To
            <select value={toTime} onInput={(event) => setToTime((event.currentTarget as HTMLSelectElement).value)}>
              {units.map((unit) => (
                <option value={unit}>{unit}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="result">Result: {timeResult}</p>
      </section>
    );
  }

  if (toolSlug === 'color-picker') {
    return (
      <section className="starter-runner">
        <h3>Color Picker Starter</h3>
        <p>Generate RGB and HSL values from a selected color.</p>
        <div className="color-grid">
          <label>
            Select color
            <input type="color" value={hex} onInput={(event) => setHex((event.currentTarget as HTMLInputElement).value)} />
          </label>
          <label>
            Hex
            <input type="text" value={hex} onInput={(event) => setHex((event.currentTarget as HTMLInputElement).value)} />
          </label>
        </div>
        <div className="preview" style={{ backgroundColor: hex }} />
        <p className="result">{colorResult.rgb}</p>
        <p className="result">{colorResult.hsl}</p>
      </section>
    );
  }

  return (
    <section className="starter-runner scaffold">
      <h3>Implementation wave in progress</h3>
      <p>
        This utility route is active and indexed. Deterministic execution handlers for this tool are scheduled in the next
        implementation waves.
      </p>
    </section>
  );
}