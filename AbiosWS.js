const request = require('async-request');
const WebSocketClient = require('websocket').client;

const ABIOS_API_HTTP_URL = 'https://api.abiosgaming.com';
const ABIOS_API_HTTP_VERSION = 'v2';

const ABIOS_API_WS_HTTP_URL = 'https://ws.abiosgaming.com';
const ABIOS_API_WS_SOCKET_URL = 'wss://ws.abiosgaming.com';
const ABIOS_API_WS_VERSION = 'v0';
const ABIOS_API_RATE_LIMIT_DELAY = 700;

class AbiosWS {
    async auth(credentials){
        let response = await request(`${ABIOS_API_HTTP_URL}/${ABIOS_API_HTTP_VERSION}/oauth/access_token`, {
            method: 'POST',
            data: credentials,
        });

        const body = this.handleResponse(response);
        this.accessToken = body.access_token;
    }

    setAccessToken(accessToken){
        this.accessToken = accessToken;
    }

    // API Calls
    async createSubsciption(name = 'abios-ws-subscribtion', filters = [{channel: 'series'}, {channel: 'match'}]) {
        return this.handleResponse(await this.doRequest('subscription', { name, filters }, 'POST'));
    }

    async getSubscriptions(){
        return this.handleResponse(await this.doRequest('subscription'));
    }

    async updateSubscription(id, name, filters){
        return this.handleResponse(await this.doRequest(`subscription/${id}`, { name, filters }, 'POST'));
    }

    async deleteSubscription(id){
        return this.handleResponse(await this.doRequest(`subscription/${id}`, {}, 'DELETE'));
    }

    async getConfig(){
        return this.handleResponse(await this.doRequest('config'));
    }

    async deleteAllActiveSubscriptions(){
        const subscriptions = await this.getSubscriptions();
        for(let subscription of subscriptions){
            await this.deleteSubscription(subscription.id);
        }    

        return true;    
    }

    handleResponse(response){
        if(response.statusCode < 200 || response.statusCode > 299){
            throw new Error(`Abios API Error: ${response.body}`);
        }

        return isJSON(response.body) ? 
            JSON.parse(response.body):
            response.body; 
    }

    async doRequest(endpoint, data = {}, method = 'GET', headers = {'Content-Type': 'application/x-www-form-urlencoded'}) {
        let requestUrl = `${ABIOS_API_WS_HTTP_URL}/${ABIOS_API_WS_VERSION}/${endpoint}`;
        
        // Append access token
        requestUrl += `?access_token=${this.accessToken}`; 

        // Pass data via query, if method is GET
        if (method === 'GET') {
            requestUrl += '&' + serialize(data);
        }

        const requestObject = {
            method: method,
            data: JSON.stringify(data),
            headers: headers
        };

        const result = await request(requestUrl, requestObject);
        
        // Sleep after each request
        await sleep(ABIOS_API_RATE_LIMIT_DELAY);

        return result;
    }


    // Websocket implemntation
    connect(id){
        const client = new WebSocketClient();
        const socketUrl = `${ABIOS_API_WS_SOCKET_URL}/${ABIOS_API_WS_VERSION}?access_token=${this.accessToken}&subscription_id=${id}`;

        return new Promise((resolve, reject) => {
            client.on('connectFailed', reject);
            client.on('connect', resolve);
            client.connect(socketUrl);
        });
    }

} 


function isJSON(str){
    try{
        JSON.parse(str);
    }catch(err){
        return false;
    }

    return true;
}

function serialize(obj) {
    var str = [];
    for (var p in obj)
    if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
    return str.join("&");
}

function sleep(msec){
    return new Promise((resolve, reject) => {
        setTimeout(resolve, msec);
    });
}


module.exports = AbiosWS;