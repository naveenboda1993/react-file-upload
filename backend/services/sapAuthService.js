const axios = require('axios');
const qs = require('qs');
const SAPAuthSchema = require('../models/SAPAuth');

async function fetchSAPAccessToken(userId) {
    // Check if a valid token exists (optional: add expiry check)
    let latestToken = await SAPAuthSchema.findOne({ userId }).sort({ createdAt: -1 });
    if (latestToken && latestToken.access_token) {
        const createdTime = latestToken.createdAt.getTime();
        const expiresInMs = latestToken.expires_in * 1000;
        const now = Date.now();
        if (createdTime + expiresInMs > now) {
            console.log('Using existing SAP Auth token');
            return latestToken.access_token;
        }
        // Token expired, continue to fetch new token
    }
    console.log('No valid SAP Auth token found, fetching a new one');
    // Request new token from SAP
    const data = qs.stringify({
        grant_type: 'client_credentials',
        client_id: process.env.SAP_CLIENT_ID,
        client_secret: process.env.SAP_CLIENT_SECRET
    });

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: process.env.SAP_AUTH_URL,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data
    };

    const response = await axios.request(config);

    // Save token to DB
    await SAPAuthSchema.create({
        access_token: response.data.access_token,
        token_type: response.data.token_type,
        expires_in: response.data.expires_in,
        scope: response.data.scope,
        jti: response.data.jti,
        userId
    });

    return response.data.access_token;
}

module.exports = { fetchSAPAccessToken };