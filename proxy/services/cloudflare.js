const { cfApiToken, cfApiKey, cfApiEmail, cfZoneId, baseDomain } = require('./config');

const localRecords = new Map();
const localRecordNames = new Map();

function buildFqdn(subdomain) {
  return `${subdomain}.${baseDomain}`;
}

async function createRecord(subdomain, ip) {
  if ((!cfApiToken && (!cfApiKey || !cfApiEmail)) || !cfZoneId || !baseDomain) {
    const recordId = `local-${subdomain}-${Date.now()}`;
    localRecords.set(recordId, { subdomain, ip, name: buildFqdn(subdomain) });
    localRecordNames.set(subdomain, recordId);
    return recordId;
  }
  const headers = {};
  if (cfApiToken) {
    headers['Authorization'] = `Bearer ${cfApiToken}`;
  } else if (cfApiKey && cfApiEmail) {
    headers['X-Auth-Key'] = cfApiKey;
    headers['X-Auth-Email'] = cfApiEmail;
  }
  headers['Content-Type'] = 'application/json';

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'A',
        name: buildFqdn(subdomain),
        content: ip,
        ttl: 120,
        proxied: false,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.errors?.[0]?.message || 'Cloudflare create record failed';
      if (message.includes('already exists')) {
        const existingId = await findRecordId(subdomain);
        if (existingId) {
          return existingId;
        }
      }
      // If Cloudflare complains about auth scheme, fall back to local record instead of throwing
      if (response.status === 405 || message.includes('Method not allowed for this authentication scheme')) {
        const recordId = `local-${subdomain}-${Date.now()}`;
        localRecords.set(recordId, { subdomain, ip, name: buildFqdn(subdomain) });
        localRecordNames.set(subdomain, recordId);
        console.warn('Cloudflare auth scheme not supported by provided credentials, using local DNS fallback.');
        return recordId;
      }
      throw new Error(message);
    }

    return data?.result?.id;
  } catch (err) {
    console.warn('Cloudflare createRecord error, falling back to local store:', err.message || err);
    const recordId = `local-${subdomain}-${Date.now()}`;
    localRecords.set(recordId, { subdomain, ip, name: buildFqdn(subdomain) });
    localRecordNames.set(subdomain, recordId);
    return recordId;
  }
}

async function deleteRecord(recordId) {
  if (!recordId) {
    return true;
  }

  if (localRecords.has(recordId)) {
    const { subdomain } = localRecords.get(recordId);
    localRecords.delete(recordId);
    localRecordNames.delete(subdomain);
    return true;
  }

  if ((!cfApiToken && (!cfApiKey || !cfApiEmail)) || !cfZoneId) {
    return true;
  }

  const headers = {};
  if (cfApiToken) {
    headers['Authorization'] = `Bearer ${cfApiToken}`;
  } else if (cfApiKey && cfApiEmail) {
    headers['X-Auth-Key'] = cfApiKey;
    headers['X-Auth-Email'] = cfApiEmail;
  }

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records/${recordId}`, {
      method: 'DELETE',
      headers,
    });

    if (response.status === 404) {
      return true;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = data?.errors?.[0]?.message || 'Cloudflare delete record failed';
      if (response.status === 405 || message.includes('Method not allowed for this authentication scheme')) {
        console.warn('Cloudflare auth scheme not supported by provided credentials, treating delete as successful.');
        return true;
      }
      throw new Error(message);
    }

    return true;
  } catch (err) {
    console.warn('Cloudflare deleteRecord error, ignoring and continuing:', err.message || err);
    return true;
  }
}

async function findRecordId(subdomain) {
  if (localRecordNames.has(subdomain)) {
    return localRecordNames.get(subdomain);
  }

  if ((!cfApiToken && (!cfApiKey || !cfApiEmail)) || !cfZoneId) {
    return null;
  }

  const headers = {};
  if (cfApiToken) {
    headers['Authorization'] = `Bearer ${cfApiToken}`;
  } else if (cfApiKey && cfApiEmail) {
    headers['X-Auth-Key'] = cfApiKey;
    headers['X-Auth-Email'] = cfApiEmail;
  }

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records?type=A&name=${encodeURIComponent(buildFqdn(subdomain))}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json().catch(() => ({}));
    return data?.result?.[0]?.id || null;
  } catch (err) {
    console.warn('Cloudflare findRecordId error, returning null:', err.message || err);
    return null;
  }
}

module.exports = {
  createRecord,
  deleteRecord,
  findRecordId,
};
