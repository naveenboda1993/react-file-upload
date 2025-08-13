import axios, { AxiosRequestConfig } from 'axios';
import qs from 'qs';

const data = qs.stringify({
    grant_type: 'client_credentials',
    client_id: 'sb-cf0717b7-2c63-4eef-9666-84df36e58d38!b494741|dox-xsuaa-std-trial!b10844',
    client_secret: 'ad62528a-5cb4-4fa0-af37-11d0899e4bb4$ifbMH-cSNstZXnVvyopKaQJp2DiL6hdLPb87kmao4j4='
});

const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://351fa650trial.authentication.us10.hana.ondemand.com/oauth/token',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: data
};

class SAPAuthService {
      async fetchAndSaveSAPAuth(userid) {
        try {
            const response = await axios.request(config);
            const savedData = await SAPAuthSchema.create({
                access_token: response.data.access_token,
                token_type: response.data.token_type,
                expires_in: response.data.expires_in,
                scope: response.data.scope,
                jti: response.data.jti,
                userId: userid
            });
            console.log('SAP Auth token saved successfully');
            return savedData;
        } catch (error) {
            console.error('Error in SAPAuthService:', error);
            throw error;
        }
    }
}
module.exports = new SAPAuthService();
