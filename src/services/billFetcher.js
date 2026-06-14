/**
 * Bill Fetcher Service
 * Fetches electricity bills from provider portals.
 * Real implementations require provider API credentials or BBPS integration.
 */

const https = require('https');
const http = require('http');

// Provider configurations
const PROVIDERS = {
  mppkvvcl: {
    name: 'MPPKVVCL',
    fullName: 'M.P. Poorv Kshetra Vidyut Vitaran Co. Ltd.',
    baseUrl: 'https://www.mppkvvcl.org',
    billPath: '/consumerBillInfo',
    hasApi: false,
    notes: 'Requires CAPTCHA on portal. Recommend BBPS API integration.'
  },
  mpmkvvcl: {
    name: 'MPMKVVCL',
    fullName: 'M.P. Madhya Kshetra Vidyut Vitaran Co. Ltd.',
    baseUrl: 'https://www.mpmkvvcl.org',
    billPath: '/consumerBillInfo',
    hasApi: false,
    notes: 'Requires CAPTCHA on portal. Recommend BBPS API integration.'
  },
  apdcl: {
    name: 'APDCL',
    fullName: 'Assam Power Distribution Company Ltd.',
    baseUrl: 'https://www.apdcl.org',
    hasApi: false,
    notes: 'Portal-based only. Recommend BBPS API integration.'
  }
};

/**
 * Attempt to fetch bill from provider.
 * Returns real data if provider API is available,
 * otherwise returns error with integration instructions.
 */
async function fetchBill(providerCode, consumerNumber) {
  const provider = PROVIDERS[providerCode];
  if (!provider) {
    return {
      success: false,
      error: 'Unknown electricity provider',
      provider: providerCode,
      integrationNote: 'Please select a supported provider or enter bill manually.'
    };
  }

  // Check if BBPS / third-party API is configured
  const bbpsApiKey = process.env.BBPS_API_KEY || process.env.BILL_FETCH_API_KEY;
  const bbpsProvider = process.env.BBPS_PROVIDER;

  if (bbpsApiKey && bbpsProvider) {
    // Real BBPS aggregator fetch would go here
    // This is a placeholder for actual integration
    try {
      const result = await fetchFromBbpsAggregator(bbpsProvider, bbpsApiKey, provider, consumerNumber);
      return result;
    } catch (err) {
      return {
        success: false,
        error: 'BBPS fetch failed: ' + err.message,
        provider: provider.name,
        integrationNote: 'BBPS API error. Please check API credentials.'
      };
    }
  }

  // No BBPS API configured — try direct provider portal (best effort)
  // Government portals typically block automated requests with CAPTCHA
  try {
    const result = await fetchFromProviderPortal(provider, consumerNumber);
    if (result.success) return result;
  } catch (err) {
    // Expected to fail due to CAPTCHA / bot protection
    console.log('[BillFetcher] Portal fetch failed (expected):', err.message);
  }

  // Return informative error with next steps
  return {
    success: false,
    error: `Real-time bill fetch is not available for ${provider.name} through the public portal.`,
    provider: provider.name,
    consumerNumber: consumerNumber,
    integrationNote: 'To enable real bill fetching, integrate with a BBPS aggregator (Setu, Razorpay, Juspay) or enter your bill amount manually.',
    howToIntegrate: [
      'Option 1: Sign up for a BBPS API at docs.setu.co or razorpay.com',
      'Option 2: Use a bill payment aggregator API key',
      'Option 3: Enter your monthly bill amount manually using the "By Monthly Bill" tab'
    ],
    envVarsNeeded: ['BBPS_API_KEY', 'BBPS_PROVIDER']
  };
}

/**
 * Placeholder for BBPS aggregator integration.
 * Implement this when you have a real BBPS API key.
 */
async function fetchFromBbpsAggregator(provider, apiKey, biller, consumerNumber) {
  // Example: Setu Bill Fetch API
  // const response = await fetch('https://api.setu.co/v1/bills/fetch', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${apiKey}` },
  //   body: JSON.stringify({
  //     billerId: biller.billerId,
  //     customerParams: { consumerNumber }
  //   })
  // });
  throw new Error('BBPS integration not yet configured. Add BBPS_API_KEY to environment.');
}

/**
 * Attempt to fetch from provider portal directly.
 * Most government portals block this with CAPTCHA.
 */
async function fetchFromProviderPortal(provider, consumerNumber) {
  return new Promise((resolve, reject) => {
    const url = provider.baseUrl + provider.billPath;
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Government portals return HTML with CAPTCHA
        // We cannot parse a real bill without solving CAPTCHA
        if (data.includes('captcha') || data.includes('CAPTCHA')) {
          reject(new Error('Provider portal requires CAPTCHA'));
        } else {
          reject(new Error('Provider portal does not return structured bill data'));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

module.exports = {
  fetchBill,
  PROVIDERS
};
