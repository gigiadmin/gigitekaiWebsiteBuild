/**
 * GoDaddy DNS API Helper
 * Manages DNS records for domains via GoDaddy REST API
 */

import { ENV } from './env';

const GODADDY_API_BASE = 'https://api.godaddy.com/v1';

interface DNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV';
  name: string;
  value: string;
  ttl?: number;
  priority?: number;
  data?: string;
}

interface GoDaddyDNSRecord {
  type: string;
  name: string;
  data: string;
  ttl?: number;
  priority?: number;
}

/**
 * Get authorization headers for GoDaddy API
 */
function getAuthHeaders() {
  const apiKey = ENV.godaddyApiKey;
  const apiSecret = ENV.godaddyApiSecret;

  if (!apiKey || !apiSecret) {
    throw new Error('GoDaddy API credentials not configured');
  }

  return {
    'Authorization': `sso-key ${apiKey}:${apiSecret}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Get all DNS records for a domain
 */
export async function getDNSRecords(domain: string, recordType?: string): Promise<GoDaddyDNSRecord[]> {
  const url = recordType
    ? `${GODADDY_API_BASE}/domains/${domain}/records/${recordType}`
    : `${GODADDY_API_BASE}/domains/${domain}/records`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch DNS records: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Create or update DNS records for a domain
 */
export async function updateDNSRecords(domain: string, records: DNSRecord[]): Promise<void> {
  const godaddyRecords: GoDaddyDNSRecord[] = records.map(record => ({
    type: record.type,
    name: record.name,
    data: record.value || record.data || '',
    ttl: record.ttl || 3600,
    ...(record.priority && { priority: record.priority }),
  }));

  const response = await fetch(`${GODADDY_API_BASE}/domains/${domain}/records`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(godaddyRecords),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update DNS records: ${response.status} ${error}`);
  }
}

/**
 * Add a single DNS record
 */
export async function addDNSRecord(domain: string, record: DNSRecord): Promise<void> {
  const existingRecords = await getDNSRecords(domain);
  const newRecords: DNSRecord[] = [
    ...existingRecords.map(r => ({
      type: r.type as 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV',
      name: r.name,
      value: r.data,
      ttl: r.ttl,
      priority: r.priority,
    })),
    record,
  ];

  await updateDNSRecords(domain, newRecords);
}

/**
 * Delete a DNS record
 */
export async function deleteDNSRecord(domain: string, recordType: string, name: string): Promise<void> {
  const response = await fetch(`${GODADDY_API_BASE}/domains/${domain}/records/${recordType}/${name}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete DNS record: ${response.status} ${error}`);
  }
}

/**
 * Verify domain health by checking DNS propagation
 */
export async function verifyDomainHealth(domain: string): Promise<{
  healthy: boolean;
  checks: {
    aRecords: boolean;
    mxRecords: boolean;
    txtRecords: boolean;
    cnameRecords: boolean;
  };
}> {
  try {
    const records = await getDNSRecords(domain);

    const aRecords = records.some(r => r.type === 'A');
    const mxRecords = records.some(r => r.type === 'MX');
    const txtRecords = records.some(r => r.type === 'TXT');
    const cnameRecords = records.some(r => r.type === 'CNAME');

    return {
      healthy: aRecords && mxRecords && txtRecords,
      checks: {
        aRecords,
        mxRecords,
        txtRecords,
        cnameRecords,
      },
    };
  } catch (error) {
    console.error('[GoDaddy] Domain health check failed:', error);
    return {
      healthy: false,
      checks: {
        aRecords: false,
        mxRecords: false,
        txtRecords: false,
        cnameRecords: false,
      },
    };
  }
}

/**
 * Setup Microsoft 365 DNS records for a domain
 */
export async function setupMicrosoft365DNS(domain: string): Promise<void> {
  const records: DNSRecord[] = [
    {
      type: 'MX',
      name: '@',
      value: `0 ${domain}.mail.protection.outlook.com`,
      priority: 0,
      ttl: 3600,
    },
    {
      type: 'TXT',
      name: '@',
      value: 'v=spf1 include:spf.protection.outlook.com -all',
      ttl: 3600,
    },
    {
      type: 'CNAME',
      name: 'autodiscover',
      value: 'autodiscover.outlook.com',
      ttl: 3600,
    },
    {
      type: 'CNAME',
      name: 'enterpriseregistration',
      value: 'enterpriseregistration.windows.net',
      ttl: 3600,
    },
    {
      type: 'CNAME',
      name: 'enterpriseenrollment',
      value: 'enterpriseenrollment-s.manage.microsoft.com',
      ttl: 3600,
    },
  ];

  await updateDNSRecords(domain, records);
}

/**
 * Get available domains (requires additional GoDaddy API setup)
 */
export async function checkDomainAvailability(domain: string): Promise<boolean> {
  const response = await fetch(`${GODADDY_API_BASE}/domains/available?domain=${domain}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json() as { available: boolean };
  return data.available;
}
