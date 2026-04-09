import { useEffect, useMemo, useState } from 'preact/hooks';
import './tool-runner.css';

type InputFieldType = 'text' | 'textarea' | 'select' | 'number';

interface InputField {
  key: string;
  label: string;
  type: InputFieldType;
  placeholder?: string;
  options?: string[];
}

interface ToolRecord {
  id: number;
  name: string;
  slug: string;
  category: string;
  mode: 'L' | 'B' | 'O';
  engine?: string;
  inputSchema?: InputField[];
  valueProposition?: string;
}

interface Props {
  tool: ToolRecord;
}

const csvToRows = (source: string): string[][] => {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((part) => part.trim()));
};

const rowsToCsv = (rows: Array<Array<string | number>>): string => {
  return rows
    .map((row) => row.map((cell) => `${cell}`.replace(/"/g, '""')).map((cell) => `"${cell}"`).join(','))
    .join('\n');
};

const safeJsonParse = (source: string): { ok: true; value: unknown } | { ok: false; error: string } => {
  try {
    return { ok: true, value: JSON.parse(source) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Invalid JSON' };
  }
};

const toNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toNanoId = (): string => {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    return Math.random().toString(36).slice(2, 12);
  }
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  let result = '';
  for (const value of array) {
    result += alphabet[value % alphabet.length];
  }
  return result;
};

const prettyXml = (source: string): string => {
  const cleaned = source.replace(/>\s*</g, '><').trim();
  if (!cleaned) {
    return '';
  }

  const tokens = cleaned.replace(/></g, '>|<').split('|');
  let indent = 0;
  const output: string[] = [];

  for (const token of tokens) {
    if (token.startsWith('</')) {
      indent = Math.max(indent - 1, 0);
    }

    output.push(`${'  '.repeat(indent)}${token}`);

    if (token.startsWith('<') && !token.startsWith('</') && !token.endsWith('/>') && !token.includes('</')) {
      indent += 1;
    }
  }

  return output.join('\n');
};

const frameworkOutput = (tool: ToolRecord, values: Record<string, string>): string => {
  const lines = Object.entries(values)
    .filter(([, value]) => `${value}`.trim().length > 0)
    .map(([key, value]) => `- ${key}: ${value}`);

  const contextBlock = lines.length > 0 ? lines.join('\n') : '- topic: your context here';

  return [
    `${tool.name} - deterministic output`,
    '',
    'Input context',
    contextBlock,
    '',
    'Execution blueprint',
    `1. Clarify objective and scope based on ${tool.name.toLowerCase()}.`,
    '2. Apply the generated structure to your specific workflow.',
    '3. Validate output quality and finalize for publishing or implementation.',
    '',
    'Draft output block',
    `${tool.valueProposition ?? 'Use this framework as a practical starting point.'}`,
    '',
    'Next action',
    'Choose one section, adapt it to your context, and run a quick quality check.',
  ].join('\n');
};

const calculatorOutput = (tool: ToolRecord, values: Record<string, string>): string => {
  const a = toNumber(values.valueA);
  const b = toNumber(values.valueB);
  const c = toNumber(values.valueC);

  const pct = (value: number) => `${value.toFixed(2)}%`;
  const num = (value: number) => `${Number.isFinite(value) ? value.toFixed(2) : '0.00'}`;

  const slug = tool.slug;

  if (slug.includes('roi')) {
    const roi = a === 0 ? 0 : ((b - a) / a) * 100;
    return `ROI result\n\nInvestment: ${num(a)}\nReturn: ${num(b)}\nROI: ${pct(roi)}`;
  }

  if (slug.includes('break-even')) {
    const unitMargin = b - c;
    const breakEvenUnits = unitMargin <= 0 ? 0 : a / unitMargin;
    return `Break-even estimate\n\nFixed cost: ${num(a)}\nUnit price: ${num(b)}\nUnit cost: ${num(c)}\nBreak-even units: ${num(breakEvenUnits)}`;
  }

  if (slug.includes('margin')) {
    const margin = a === 0 ? 0 : ((a - b) / a) * 100;
    return `Margin estimate\n\nRevenue: ${num(a)}\nCost: ${num(b)}\nMargin: ${pct(margin)}`;
  }

  if (slug.includes('markup-markdown')) {
    const markup = a === 0 ? 0 : ((b - a) / a) * 100;
    const margin = b === 0 ? 0 : ((b - a) / b) * 100;
    return `Markup and margin\n\nCost: ${num(a)}\nSelling price: ${num(b)}\nMarkup: ${pct(markup)}\nMargin: ${pct(margin)}`;
  }

  if (slug.includes('revenue-projection')) {
    const projected = a * Math.pow(1 + b / 100, c || 1);
    return `Revenue projection\n\nCurrent revenue: ${num(a)}\nGrowth rate: ${pct(b)}\nPeriods: ${num(c || 1)}\nProjected revenue: ${num(projected)}`;
  }

  if (slug.includes('freelance-rate')) {
    const effectiveRate = b === 0 ? 0 : (a * (1 + c / 100)) / b;
    return `Freelance rate estimate\n\nTarget income: ${num(a)}\nBillable hours: ${num(b)}\nOverhead rate: ${pct(c)}\nRecommended hourly rate: ${num(effectiveRate)}`;
  }

  if (slug.includes('budget-split')) {
    const needs = a * 0.5;
    const growth = a * 0.3;
    const reserve = a * 0.2;
    return `Budget split (50/30/20)\n\nTotal budget: ${num(a)}\nNeeds: ${num(needs)}\nGrowth: ${num(growth)}\nReserve: ${num(reserve)}`;
  }

  if (slug.includes('savings-goal')) {
    const remaining = Math.max(a - b, 0);
    const months = c > 0 ? remaining / c : 0;
    return `Savings plan\n\nGoal: ${num(a)}\nCurrent savings: ${num(b)}\nMonthly contribution: ${num(c)}\nEstimated months: ${num(months)}`;
  }

  if (slug.includes('loan-emi')) {
    const monthlyRate = b / 1200;
    const tenure = Math.max(c, 1);
    const emi = monthlyRate === 0 ? a / tenure : (a * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
    return `Loan EMI estimate\n\nPrincipal: ${num(a)}\nAnnual rate: ${pct(b)}\nTenure (months): ${num(tenure)}\nEstimated EMI: ${num(emi)}`;
  }

  if (slug.includes('cash-flow')) {
    const net = a - b;
    const total = net * (c || 1);
    return `Cash flow estimate\n\nMonthly inflow: ${num(a)}\nMonthly outflow: ${num(b)}\nNet monthly flow: ${num(net)}\nProjected total over periods: ${num(total)}`;
  }

  const score = a + b + c;
  return `Calculated output\n\nPrimary: ${num(a)}\nSecondary: ${num(b)}\nRate/value C: ${num(c)}\nComposite score: ${num(score)}`;
};

const converterOutput = (tool: ToolRecord, values: Record<string, string>): string => {
  const source = `${values.source ?? values.input ?? ''}`.trim();
  const direction = values.direction ?? 'Forward';

  if (!source) {
    return 'Provide source input to run conversion.';
  }

  if (tool.slug.includes('csv-to-json')) {
    const rows = csvToRows(source);
    if (rows.length < 2) {
      return 'CSV to JSON requires a header row and at least one data row.';
    }
    const [headers, ...body] = rows;
    const output = body.map((row) => {
      const entry: Record<string, string> = {};
      headers.forEach((header, index) => {
        entry[header || `col_${index + 1}`] = row[index] ?? '';
      });
      return entry;
    });
    return JSON.stringify(output, null, 2);
  }

  if (tool.slug.includes('json-to-csv')) {
    const parsed = safeJsonParse(source);
    if (!parsed.ok) {
      return `Invalid JSON input\n\n${parsed.error}`;
    }

    const list = Array.isArray(parsed.value) ? parsed.value : [parsed.value];
    const normalized = list.filter((entry) => entry && typeof entry === 'object') as Array<Record<string, unknown>>;
    if (normalized.length === 0) {
      return 'JSON to CSV expects an object or array of objects.';
    }

    const headers = [...new Set(normalized.flatMap((entry) => Object.keys(entry)))];
    const rows: Array<Array<string | number>> = [headers, ...normalized.map((entry) => headers.map((header) => `${entry[header] ?? ''}`))];
    return rowsToCsv(rows);
  }

  if (tool.slug.includes('base64')) {
    if (direction === 'Reverse') {
      try {
        return atob(source);
      } catch {
        return 'Invalid Base64 input for decode operation.';
      }
    }
    return btoa(source);
  }

  if (tool.slug.includes('url-encoder')) {
    return direction === 'Reverse' ? decodeURIComponent(source) : encodeURIComponent(source);
  }

  if (tool.slug.includes('timestamp-converter')) {
    const asNumber = Number(source);
    if (Number.isFinite(asNumber) && source.trim().length > 0) {
      const milliseconds = asNumber < 9999999999 ? asNumber * 1000 : asNumber;
      return `ISO: ${new Date(milliseconds).toISOString()}\nLocal: ${new Date(milliseconds).toString()}`;
    }

    const date = new Date(source);
    if (Number.isNaN(date.getTime())) {
      return 'Invalid timestamp input.';
    }
    return `Unix seconds: ${Math.floor(date.getTime() / 1000)}\nUnix ms: ${date.getTime()}`;
  }

  if (tool.slug.includes('number-base-converter')) {
    const base = Number(values.valueB) || 10;
    const targetBase = Number(values.valueC) || 16;
    const parsed = parseInt(source, base);
    if (Number.isNaN(parsed)) {
      return 'Invalid number for selected source base.';
    }
    return `${parsed.toString(targetBase).toUpperCase()}`;
  }

  return frameworkOutput(tool, values);
};

const formatterOutput = (tool: ToolRecord, values: Record<string, string>): string => {
  const source = `${values.source ?? values.input ?? ''}`.trim();
  if (!source) {
    return 'Provide source content to run formatting.';
  }

  if (tool.slug.includes('json-formatter')) {
    const parsed = safeJsonParse(source);
    if (!parsed.ok) {
      return `Invalid JSON\n\n${parsed.error}`;
    }
    return JSON.stringify(parsed.value, null, 2);
  }

  if (tool.slug.includes('xml-formatter')) {
    return prettyXml(source);
  }

  if (tool.slug.includes('csv-cleaner')) {
    return source
      .split(/\r?\n/)
      .map((line) => line.split(',').map((part) => part.trim()).join(','))
      .filter(Boolean)
      .join('\n');
  }

  if (tool.slug.includes('text-case-transformer')) {
    return [
      `Sentence: ${source.charAt(0).toUpperCase()}${source.slice(1)}`,
      `Upper: ${source.toUpperCase()}`,
      `Lower: ${source.toLowerCase()}`,
      `Title: ${source
        .toLowerCase()
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')}`,
    ].join('\n\n');
  }

  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
};

const analyzerOutput = (tool: ToolRecord, values: Record<string, string>): string => {
  const context = `${values.context ?? values.source ?? ''}`.trim();
  const goal = `${values.goal ?? ''}`.trim();

  const terms = context
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3);
  const uniqueTerms = [...new Set(terms)].slice(0, 12);

  return [
    `${tool.name} - analysis summary`,
    '',
    `Goal: ${goal || 'Not provided'}`,
    `Input length: ${context.length} characters`,
    '',
    'Key terms detected',
    uniqueTerms.length > 0 ? uniqueTerms.map((term, index) => `${index + 1}. ${term}`).join('\n') : 'No significant terms found.',
    '',
    'Recommended next actions',
    '1. Confirm the top intent and primary audience.',
    '2. Remove low-value duplication and tighten headings.',
    '3. Cross-link to two related pages to strengthen coverage.',
  ].join('\n');
};

const technicalOutput = (tool: ToolRecord, values: Record<string, string>): string => {
  const source = `${values.input ?? values.source ?? ''}`.trim();
  const target = `${values.target ?? ''}`.trim();
  const constraints = `${values.constraints ?? ''}`.trim();

  if (tool.slug.includes('uuid-nanoid-utility')) {
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'uuid-not-supported';
    return `UUID: ${uuid}\nNanoID: ${toNanoId()}`;
  }

  if (tool.slug.includes('hash-generator')) {
    return `Input length: ${source.length}\nUse Generate to produce SHA-256 hash.`;
  }

  if (tool.slug.includes('regex-tester')) {
    let expression: RegExp;
    try {
      expression = new RegExp(target || source.split(/\r?\n/)[0] || '.*', 'g');
    } catch {
      return 'Invalid regex pattern in target output field.';
    }
    const matches = source.match(expression) ?? [];
    return `Regex matches: ${matches.length}\n\n${matches.slice(0, 40).join('\n') || 'No matches found.'}`;
  }

  if (tool.slug.includes('markdown-table-builder')) {
    const rows = source
      .split(/\r?\n/)
      .map((line) => line.split(',').map((cell) => cell.trim()))
      .filter((row) => row.some(Boolean));
    if (rows.length === 0) {
      return 'Provide comma-separated rows to generate a markdown table.';
    }
    const header = rows[0];
    const divider = header.map(() => '---');
    const body = rows.slice(1);
    return [
      `| ${header.join(' | ')} |`,
      `| ${divider.join(' | ')} |`,
      ...body.map((row) => `| ${row.join(' | ')} |`),
    ].join('\n');
  }

  if (tool.slug.includes('markdown-toc-builder')) {
    const items = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^#{1,6}\s+/.test(line))
      .map((line) => {
        const level = line.match(/^#+/)?.[0].length ?? 1;
        const title = line.replace(/^#{1,6}\s+/, '');
        const anchor = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        return `${'  '.repeat(Math.max(level - 1, 0))}- [${title}](#${anchor})`;
      });
    return items.length > 0 ? items.join('\n') : 'No markdown headings detected.';
  }

  return [
    `${tool.name} - technical scaffold`,
    '',
    `Target output: ${target || 'Not specified'}`,
    `Constraints: ${constraints || 'None'}`,
    '',
    'Input snapshot',
    source || '(empty input)',
  ].join('\n');
};

const runTool = async (tool: ToolRecord, values: Record<string, string>): Promise<string> => {
  if (tool.slug.includes('hash-generator')) {
    const source = `${values.input ?? values.source ?? ''}`;
    if (!source) {
      return 'Provide input text to hash.';
    }
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      return 'Hash generation is not supported in this browser.';
    }
    const bytes = new TextEncoder().encode(source);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hashHex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return `SHA-256\n\n${hashHex}`;
  }

  switch (tool.engine) {
    case 'calculator':
      return calculatorOutput(tool, values);
    case 'converter':
      return converterOutput(tool, values);
    case 'formatter':
      return formatterOutput(tool, values);
    case 'analyzer':
      return analyzerOutput(tool, values);
    case 'technical':
      return technicalOutput(tool, values);
    case 'planner':
    case 'framework':
    default:
      return frameworkOutput(tool, values);
  }
};

export default function UniversalToolRunner({ tool }: Props) {
  const schema = useMemo<InputField[]>(() => {
    if (tool.inputSchema && tool.inputSchema.length > 0) {
      return tool.inputSchema;
    }
    return [
      { key: 'topic', label: 'Topic', type: 'text', placeholder: 'Topic or workflow context' },
      { key: 'audience', label: 'Audience', type: 'text', placeholder: 'Target audience' },
      { key: 'goal', label: 'Goal', type: 'text', placeholder: 'Desired output' },
    ];
  }, [tool]);

  const initialValues = useMemo(() => {
    const defaults: Record<string, string> = {};
    for (const field of schema) {
      if (field.type === 'select') {
        defaults[field.key] = field.options?.[0] ?? '';
      } else if (field.type === 'number') {
        defaults[field.key] = '';
      } else {
        defaults[field.key] = '';
      }
    }
    return defaults;
  }, [schema]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValues(initialValues);
    setOutput('');
    setCopied(false);
    setLoading(false);
  }, [tool.slug, initialValues]);

  const onFieldChange = (key: string, value: string) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  };

  const onGenerate = async () => {
    setLoading(true);
    setCopied(false);
    const result = await runTool(tool, values);
    setOutput(result);
    setLoading(false);
  };

  const onReset = () => {
    setValues(initialValues);
    setOutput('');
    setCopied(false);
  };

  const onCopy = async () => {
    if (!output || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    await navigator.clipboard.writeText(output);
    setCopied(true);
  };

  return (
    <section className="tool-runner" data-reveal>
      <p className="runner-intro">
        Deterministic local runner for {tool.name}. {tool.mode === 'O' ? 'Optional public-data enhancement is available, but this baseline works without it.' : 'No private API key is required.'}
      </p>

      <div className="tool-form">
        {schema.map((field) => (
          <div className="field" key={field.key}>
            <label htmlFor={field.key}>{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                id={field.key}
                rows={6}
                placeholder={field.placeholder ?? ''}
                value={values[field.key] ?? ''}
                onInput={(event) => onFieldChange(field.key, (event.currentTarget as HTMLTextAreaElement).value)}
              />
            ) : field.type === 'select' ? (
              <select
                id={field.key}
                value={values[field.key] ?? ''}
                onInput={(event) => onFieldChange(field.key, (event.currentTarget as HTMLSelectElement).value)}
              >
                {(field.options ?? []).map((option) => (
                  <option value={option} key={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.key}
                type={field.type === 'number' ? 'number' : 'text'}
                step={field.type === 'number' ? 'any' : undefined}
                placeholder={field.placeholder ?? ''}
                value={values[field.key] ?? ''}
                onInput={(event) => onFieldChange(field.key, (event.currentTarget as HTMLInputElement).value)}
              />
            )}
          </div>
        ))}

        <div className="runner-actions">
          <button type="button" className="generate" onClick={onGenerate}>
            {loading ? 'Generating...' : 'Generate Output'}
          </button>
          <button type="button" className="reset" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>

      {output && (
        <div className="runner-output">
          <div className="runner-output-header">
            <h3>Generated Result</h3>
            <button type="button" onClick={onCopy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre>{output}</pre>
        </div>
      )}

      <p className="runner-note">
        Mode {tool.mode}: {tool.mode === 'L' ? 'Launch-now deterministic client mode.' : tool.mode === 'B' ? 'Build-time capable tool with static output behavior.' : 'Optional public-data enhancement mode with deterministic fallback.'}
      </p>
    </section>
  );
}
