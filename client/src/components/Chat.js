import 'react-chat-widget/lib/styles.css';
import React, { Component } from 'react';
import FlexView from "react-flexview/";
import '../style/Chat.css';
import Loading from './Loading';
import socketIOClient from "socket.io-client";
import ChatWindow from "./ChatWindow";


export default class Chat extends Component {
    state = {
        loading: true,
        convId: "",
        partnerId: "",
        partnerName: "",
        partnerAvatar: "",
        socket: {}
    };

    constructor(props) {
        super(props);
        this.state.socket = socketIOClient('/');
    }

    componentDidMount() {
        let p = this.props.location.state;
        let isValid = (!!p && !!p.name && !!p.wing && !!p.userId);
        if (isValid) {
            // Found match
            this.state.socket.on('partner', match => {
                console.log('found partner:', match);
                this.setState({
                    loading: false,
                    convId: match.convId,
                    partnerName: match.partnerName,
                    partnerId: match.partnerId,
                    partnerAvatar: match.partnerAvatar
                });
            });

            // Partner disconnected - back to lobby
            this.state.socket.on('partnerDisconnect', () => {
                this.setState({
                    loading: true,
                    convId: "",
                    partnerId: "",
                    partnerName: "",
                    partnerAvatar: ""
                });
                this.getChatPartner();
            });

            this.getChatPartner()
        } else {
            this.props.history.push("/");
        }
    }

    getChatPartner() {
        let props = this.props.location.state;
        this.state.socket.emit('req_partner', { ...props });
    }

    render() {
        let p = this.props.location.state;
        let isValid = (!!p && !!p.name && !!p.wing && !!p.userId);
        if (isValid) {
            return (
                <FlexView className="chat" column hAlignContent="center" vAlignContent="center">
                    { !!this.state.loading && (<Loading wing={this.props.location.state.wing} />) }
                    {
                        !this.state.loading &&  (
                            <ChatWindow
                                user={this.props.location.state.name}
                                userAvatar={this.props.location.state.avatar}
                                partnerName={this.state.partnerName}
                                partnerId={this.state.partnerId}
                                partnerAvatar={this.state.partnerAvatar}
                                socket={this.state.socket}
                            />
                        )
                    }
                </FlexView>
            )
        } else {
            return null
        }

    }
}