const AbiosWS = require('./AbiosWS');

(async () => {
    const credentials = {
        client_id: '',
        client_secret: '',
        grant_type: 'client_credentials'
    }

    let abiosWs = new AbiosWS();
    // Obtain accessToken
    await abiosWs.auth(credentials);

    // Delete active subscriptions, if any 
    await abiosWs.deleteAllActiveSubscriptions();
    
    let subscriptionName = 'test-subscription';
    let subscriptionFilters = [{ channel: 'series' }];
    let subscription = await abiosWs.createSubsciption(subscriptionName, subscriptionFilters);
    
    let socket = await abiosWs.connect(subscription.id);
    
    socket.on('message', onMessage)
    socket.on('error', onError);
    socket.on('close', onClose);
    
    function onMessage(message){
        let data = processMessage(message);
        
    }

    function onError(){
        console.log('Socket error..')
    }

    function onClose(){
        console.log('Socket closed..')
    }
})();

function processMessage(message){
    if(message.type === 'utf8'){
        return JSON.parse(message.utf8Data);
    }
}
