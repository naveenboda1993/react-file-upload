const axios = require('axios');

/**
 * Uploads a file to SAP Document Information Extraction.
 * @param {Buffer} fileBuffer - The file buffer.
 * @param {string} originalname - The original file name.
 * @param {string} mimetype - The file MIME type.
 * @param {string} accessToken - SAP OAuth access token.
 * @returns {Promise<Object>} - SAP response data.
 */
async function uploadToSAP(fileBuffer, originalname, mimetype, accessToken) {
    try {
        const FormData = require('form-data');
        let filedata = new FormData();
        filedata.append('file', fileBuffer, {
            filename: originalname,
            contentType: mimetype
        });
        var options = {
            "schemaName": "Common_Schema",
            "clientId": "default",
            "documentType": "invoice",
            "schemaVersion": "2",
            "receivedDate": "2020-02-17",
            "enrichment": {
                "sender": {
                    "top": 5,
                    "type": "businessEntity",
                    "subtype": "supplier"
                },
                "employee": {
                    "type": "employee"
                }
            }
        }
        filedata.append('options', JSON.stringify(options));

        const urlBase = process.env.SAP_DOC_URL || 'https://aiservices-trial-dox.cfapps.us10.hana.ondemand.com/document-information-extraction/v1/';
        const url = urlBase + 'document/jobs';
        const headers = {
            ...filedata.getHeaders(),
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        };

        const response = await axios.post(url, filedata, {
            headers,
            maxBodyLength: Infinity
        });
        return response.data;
    } catch (error) {
        console.error('uploadToSAP error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error config:', error.config);
        }
        throw new Error(error.response?.data?.message || error.message || 'SAP file upload failed');
    }
}

/**
 * Gets SAP document job details.
 * @param {string} blobName - SAP document job ID.
 * @param {string} accessToken - SAP OAuth access token.
 * @returns {Promise<Object>} - SAP response data.
 */
async function getSAPDocument(blobName, accessToken) {
    try {
        const baseUrl = process.env.SAP_DOC_URL || 'https://aiservices-trial-dox.cfapps.us10.hana.ondemand.com/document-information-extraction/v1/';
        const url = `${baseUrl}document/jobs/${blobName}?returnNullValues=false&extractedValues=true`;
        const headers = {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        };

        const response = await axios.get(url, {
            headers,
            maxBodyLength: Infinity
        });
        return response.data;
    } catch (error) {
        console.error('getSAPDocument error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error config:', error.config);
        }
        throw new Error(error.response?.data?.message || error.message || 'SAP get document failed');
    }
}
/**
 * Gets SAP all job details.
 * @param {string} accessToken - SAP OAuth access token.
 * @returns {Promise<Object>} - SAP response data.
 */
async function getSAPDocumentJobs(accessToken) {
    try {
        const urlBase = process.env.SAP_DOC_URL || 'https://aiservices-trial-dox.cfapps.us10.hana.ondemand.com/document-information-extraction/v1/';
        const url = urlBase + 'document/jobs?clientId=default';
        const headers = {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        };

        const response = await axios.get(url, {
            headers,
            maxBodyLength: Infinity
        });
        return response.data;
    } catch (error) {
        console.error('getSAPDocumentJobs error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error config:', error.config);
        }
        throw new Error(error.response?.data?.message || error.message || 'SAP get document jobs failed');
    }
}

module.exports = { uploadToSAP, getSAPDocument, getSAPDocumentJobs };