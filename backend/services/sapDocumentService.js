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
    const FormData = require('form-data');
    let filedata = new FormData();
    filedata.append('file', fileBuffer, {
        filename: originalname,
        contentType: mimetype
    });
    // filedata.append('options', '{\n  "schemaName": "Common_Schema",\n  "clientId": "default",\n  "documentType": "invoice",\n  "receivedDate": "2020-02-17",\n  "enrichment": {\n    "sender": {\n      "top": 5,\n      "type": "businessEntity",\n      "subtype": "supplier"\n    },\n    "employee": {\n      "type": "employee"\n    }\n  }\n}');
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

    const url = process.env.SAP_DOC_URL || 'https://aiservices-trial-dox.cfapps.us10.hana.ondemand.com/document-information-extraction/v1/document/jobs';

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
}

/**
 * Gets SAP document job details.
 * @param {string} blobName - SAP document job ID.
 * @param {string} accessToken - SAP OAuth access token.
 * @returns {Promise<Object>} - SAP response data.
 */
async function getSAPDocument(blobName, accessToken) {
    const url = `${process.env.SAP_DOC_URL || 'https://aiservices-trial-dox.cfapps.us10.hana.ondemand.com/document-information-extraction/v1/document/jobs'}/${blobName}?returnNullValues=false&extractedValues=true`;

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
}
/**
 * Gets SAP all job details.
 * @param {string} accessToken - SAP OAuth access token.
 * @returns {Promise<Object>} - SAP response data.
 */
async function getSAPDocumentJobs(accessToken) {
    const url = `${process.env.SAP_DOC_URL || 'https://aiservices-trial-dox.cfapps.us10.hana.ondemand.com/document-information-extraction/v1/document/jobs?clientId=default'}`;

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
}

module.exports = { uploadToSAP, getSAPDocument, getSAPDocumentJobs };