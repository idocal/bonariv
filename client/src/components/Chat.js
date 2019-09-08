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
        partnerName: "Itzik",
        socket: {}
    };

    constructor(props) {
        super(props);
        this.state.socket = socketIOClient('http://localhost:5000');
    }

    componentDidMount() {
        this.state.socket.on('partner', match => {
            this.setState({
                loading: false,
                convId: match.convId,
                partnerName: match.partnerName,
                partnerId: match.partnerId,
            });
        });
        this.getChatPartner()
    }

    getChatPartner() {
        let props = this.props.location.state;
        this.state.socket.emit('req_partner', { userId: props.userId, wing: props.wing, name: props.name });
    }

    render() {
        return (
            <FlexView className="chat" column hAlignContent="center" vAlignContent="center">
                { !!this.state.loading && (<Loading wing={this.props.location.state.wing} />) }
                {
                    !this.state.loading &&  (
                        <ChatWindow
                            user={this.props.location.state.name}
                            partnerName={this.state.partnerName}
                            partnerId={this.state.partnerId}
                            socket={this.state.socket}
                        />
                    )
                }
            </FlexView>
        )
    }
}