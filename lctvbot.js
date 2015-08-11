'use strict'

//Required Modules
var xmpp = require( "node-xmpp-client" );
var ltx = require('node-xmpp-core').ltx;
var util = require( 'util' );
var events = require( 'events' );

var lctvbot = function( config ) {
    this.channels = [];
    this.config = config;
    this.chatDomain = "chat.livecoding.tv";
    this.client = new xmpp( {
        reconnect: true,
        jid: config.nickname + "@livecoding.tv",
        domain: this.chatDomain,
        password: config.password
    } );

    var self = this;

    this.client.on( 'error', function( e ) {
        self.emit( 'error', e );
    } );

    this.client.on( 'online', function( data ) {
        self.emit( 'online', data );
    } );

    this.client.on( 'stanza', function( stanza ) {
        var event;
        switch( stanza.type ) {
            case "error":
                event = 'error';
                break;
            case "result":
                var ns = stanza.getChild('query').attrs.xmlns //From Whisperer, need to test
                event = ns.split('#').pop
                break;
            default:
                event = stanza.name;
                break;
        }

        if( event == 'message' ) {
            var msg = self.getMessage( stanza );
            if( typeof stanza.getChild( 'delay' ) == "undefined") { //If a message has a timestamp it's a replay, ignore it
                if( msg.indexOf( '!' ) == 0 ) {
                    var tmp = msg.split( " " );
                    var command = tmp.shift();
                    var text = tmp.join( " " );
                    // console.log( stanza );
                    var from;
                    if( stanza.type == 'chat' ) {
                        from = stanza.attrs.from;
                    }
                    else {
                        from = stanza.attrs.from.substring(0, stanza.attrs.from.indexOf( '/' ) );
                    }
                    // self.emit( 'command#' + command, from, text, stanza );
                    self.emit( 'command#' + command, self.getChannel( stanza ), text, self.getNickname( stanza ), stanza );
                    console.log( 'command: ' + command );
                }
            }
            if( typeof stanza.getChild( 'delay' ) == "undefined") {
                self.emit( 'msg', self.getNickname( stanza ), self.getChannel( stanza ), msg, stanza );
            }
        }

        if( event == "presence" ) {
            var index;
            var from = stanza.attrs.from;
            var channel = self.getChannel( stanza );
            var nickname = self.getNickname( stanza );
            var affiliation = stanza.getChild( 'x' ).getChild( 'item' ).attrs.affiliation;
            // console.log( [ channel, nickname, affiliation ] );
            if( typeof stanza.attrs.type !== 'undefined' && stanza.attrs.type == 'unavailable' ) {
                index = self.channels[ channel ].users.indexOf( nickname )
                if( index > -1 ) {
                    if( affiliation == 'admin' ) {
                        self.channels[ channel ].mods.splice( index, 1 );
                    }
                    else {
                        self.channels[ channel ].users.splice( index, 1 );
                    }
                    self.emit( 'part', channel, nickname, stanza );
                }
            }
            else {
                if( affiliation == 'admin' ) {
                    self.channels[ channel ].mods.push( nickname );
                }
                else {
                    self.channels[ channel ].users.push( nickname );
                }
                self.emit( 'join', channel, nickname, stanza );
            }
        }
        self.emit( event, stanza );
    } );
};

util.inherits( lctvbot, events.EventEmitter );

//Join a channel
lctvbot.prototype.join = function( channel ) {
    if( channel.indexOf( '@' ) == -1 ) {
        channel += "@" + this.chatDomain;
    }
    var presence = new ltx.Element( 'presence',{
        to: channel + '/' + this.config.nickname,
    } ).c( 'x', { xmlns: 'http://jabber.org/protocol/muc' } );
    this.client.send( presence );
    this.channels[ channel.substring( 0, channel.indexOf( '@' ) ) ] = { users: [], mods: [] };
    // console.log( this.channels );
};

lctvbot.prototype.part = function( channel ) {
    var channelName = channel;
    if( channel.indexOf( '@' ) == -1 ) {
        channel += "@" + this.chatDomain;
    }

    var presence = new ltx.Element( 'presence', {
        to: channel + '/' + this.config.nickname,
        type: "unavailable"
    } ).c( 'x', { xmlns: 'http://jabber.org/protocol/muc' } );
    this.client.send( presence );
    this.channels.splice( this.channels.indexOf( channelName ) );
};

//Set the lctvbots status to available, need to check if LCTV supports this
lctvbot.prototype.setOnline = function() {
    var presence = new ltx.Element( 'presence', { } )
        .c( 'show' ).t( 'chat' ).up()
        .c( 'status' ).t( 'LCTV lctvbot' );
    this.client.send( presence );
};

//Get a message from the stanza
lctvbot.prototype.getMessage = function( stanza ) {
    return stanza.getChild( 'body' ).children.toString();
};

//Sends a message to the server
lctvbot.prototype.message = function( to, message, type ) {
    var stanza;
    if( type == undefined ) {
        type = 'groupchat';
    }
    if( type == 'groupchat' && to.indexOf( '@' ) == -1 ) {
        to += "@" + this.chatDomain;
    }
    // console.log( [ to, message, type ] );
    stanza = new ltx.Element( 'message', { to: to, type: type, from: this.config.jid } );
    // console.log( stanza.root().toString() );
    this.client.send( stanza.c( 'body' ).t( message ) );
};

lctvbot.prototype.say = function( to, message ) {
    this.message( to, message );
};

//I may use this later
// lctvbot.prototype.getTimeStamp = function( stanza ) {
//   return stanza.getChild( 'delay' ).attrs.stamp;
// };

//Get the nickname from the stanza
lctvbot.prototype.getNickname = function( stanza ) {
    var from = stanza.attrs.from;
    return from.substring( from.indexOf( '/' ) + 1, from.length );
};

//Get the channel from the stanza
lctvbot.prototype.getChannel = function( stanza ) {
    var from = stanza.attrs.from;
    return from.substring( 0, from.indexOf( '@' ) );
};

lctvbot.prototype.isMod = function( channel, user ) {
        if( this.channels[ channel ].mods.indexOf( user ) > -1 ) {
            return true;
        }
        return false;
};
module.exports = lctvbot;
