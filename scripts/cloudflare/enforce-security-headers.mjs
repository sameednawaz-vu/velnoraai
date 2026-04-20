function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

const RULE_DESCRIPTION = 'Velnora security headers baseline';

const RESPONSE_HEADERS = {
  'Strict-Transport-Security': {
    operation: 'set',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  'Content-Security-Policy': {
    operation: 'set',
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://*.workers.dev https://api.formspree.com https://formspree.io; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' https://formspree.io https://api.formspree.com; upgrade-insecure-requests",
  },
  'X-Content-Type-Options': {
    operation: 'set',
    value: 'nosniff',
  },
  'X-Frame-Options': {
    operation: 'set',
    value: 'DENY',
  },
  'Referrer-Policy': {
    operation: 'set',
    value: 'strict-origin-when-cross-origin',
  },
  'Permissions-Policy': {
    operation: 'set',
    value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), browsing-topics=()',
  },
};

async function callCloudflare(path, { method = 'GET', body, token }) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    const message = payload?.errors?.[0]?.message || `HTTP ${response.status}`;
    throw new Error(`Cloudflare API request failed (${method} ${path}): ${message}`);
  }

  return payload.result;
}

function buildRule(expression) {
  return {
    action: 'rewrite',
    expression,
    enabled: true,
    description: RULE_DESCRIPTION,
    action_parameters: {
      headers: RESPONSE_HEADERS,
    },
  };
}

async function main() {
  const zoneId = process.env.CLOUDFLARE_VELNORA_ZONE_ID?.trim() || '';
  const token = process.env.CLOUDFLARE_VELNORA_API_TOKEN?.trim() || '';
  const confirm = hasFlag('--confirm');
  const expression = getArgValue('--expression')?.trim() || 'true';

  console.log('\n=== Cloudflare Response Header Rule Sync ===');
  console.log(`Zone: ${zoneId || '(missing)'}`);
  console.log(`Mode: ${confirm ? 'LIVE' : 'DRY RUN'}`);
  console.log(`Expression: ${expression}`);

  if (!zoneId || !token) {
    if (confirm) {
      throw new Error('Missing CLOUDFLARE_VELNORA_ZONE_ID or CLOUDFLARE_VELNORA_API_TOKEN');
    }

    console.log('Credentials missing. Dry run can only print planned configuration.');
    console.log(JSON.stringify(buildRule(expression), null, 2));
    return;
  }

  const entrypoint = await callCloudflare(
    `/zones/${zoneId}/rulesets/phases/http_response_headers_transform/entrypoint`,
    { token }
  );

  const rulesetId = entrypoint.id;
  const existingRule = (entrypoint.rules || []).find((rule) => rule.description === RULE_DESCRIPTION);
  const plannedRule = buildRule(expression);

  console.log(`Entrypoint ruleset: ${rulesetId}`);
  console.log(`Existing rule: ${existingRule ? existingRule.id : '(none)'}`);

  if (!confirm) {
    console.log('\nPlanned rule payload:');
    console.log(JSON.stringify(plannedRule, null, 2));
    console.log('\nDry run complete. Use --confirm for live rule update.');
    return;
  }

  if (existingRule) {
    const updated = await callCloudflare(
      `/zones/${zoneId}/rulesets/${rulesetId}/rules/${existingRule.id}`,
      {
        method: 'PATCH',
        body: plannedRule,
        token,
      }
    );

    console.log(`Updated rule ${updated.id}.`);
  } else {
    const created = await callCloudflare(
      `/zones/${zoneId}/rulesets/${rulesetId}/rules`,
      {
        method: 'POST',
        body: plannedRule,
        token,
      }
    );

    console.log(`Created rule ${created.id}.`);
  }

  console.log('Cloudflare security header rule sync complete.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
