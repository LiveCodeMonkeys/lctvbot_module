#LCTV Bot

##Setup
Create an oject that contains your nickname and passowrd and pass it to the module

config.json
```json
{
    "nickname": "test",
    "password": "test"
}
```

main.js
```js
var lctvbot = require( 'lctvbot' );
var config = require( './config.json' );
var bot = new lctvbot( config );
```

##Events
###online
This event fire when the bot comes online, it get's passed the data variable
```js
bot.on( 'online', function( data ) {
    bot.join( 'channel' );
} );
```

###error
Fired when the xmpp-client throws and error
```js
bot.on( 'error', function( e ) {
    console.error( e );
} );
```

###message
The raw message event, this is available for anyone who wants to parse the raw data.
```js
bot.on( 'message', function( stanza ) {
    console.log( stanza.toString() );
} );
```

###msg
Event fired when a user sends a message
```js
bot.on( 'msg', function( nickname, channel, message, stanza ) {
    console.log( nickname + 'said ' + message + ' in ' + channel );
} );
```

###presence
The raw even for presence
```js
bot.on( 'presence', function( stanza ) {
    console.log( stanza.toString() );
} );
```

###join
Fired when a user join the chat. NOTE: This will fire when the bot joins  a channel for all current users
```js
bot.on( 'join', function( channel, nickname, stanza ) {
    console.log( [ channel, nickname, stanza.toString() ] );
} );
```

###part
Fires when a user leaves the channel
```js
bot.on( 'part', function( channel, nickname, stanza ) {
    bot.message( channel, 'Goodbye' + nickname + '!', 'groupchat' );
} );
```

##Functions
###join
Makes the bot join a channel. This can recieve a raw name from the stanza or just the channel name.
```js
bot.join( 'sean111' );
bot.join( 'sean111@chat.livecoding.tv' );
```

###part
Makes the bot leave a channel
```js
bot.part( 'sean111' );
bot.part( 'sean111@chat.livecoding.tv' );
```

###getMessage
Gets the message from a message stanza
```js
var message = bot.getMessage( stanza );
```

###message
Sends a message to the channel  ( LCTV doesn't currently support user messaging, "chat" type )
```js
bot.message( 'sean111', 'Hello World!', 'groupchat' );
```

###getNickname
Gets the nickname from the stanza
```js
var nickname = bot.getNickname( stanza );
```

###getChannel
Gets the channel from the stanza
```js
var channel = bot.getChannel( stanza );
```

###isMod
Returns if the user is a mod in the channel or not ( true / false )
```js
if( bot.isMod( channel, nickname ) {
    console.log( nickname + " is a mod" );
}
```
