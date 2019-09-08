import 'react-chat-widget/lib/styles.css';
import React, { Component } from 'react';
import FlexView from "react-flexview/";
import '../style/Chat.css';
import Loading from './Loading';
import socketIOClient from "socket.io-client";
import ChatWindow from "./ChatWindow";

const socket = socketIOClient("/");

export default class Chat extends Component {
    state = {
        loading: true,
        convId: "",
        partnerId: "",
        partnerName: "Itzik",
    };

    componentDidMount() {
        socket.on('partner', match => {
            this.setState({
                loading: false,
                convId: match.convId,
            });
        });
        this.getChatPartner()
    }

    getChatPartner() {
        let props = this.props.location.state;
        socket.emit('req_partner', { userId: props.userId, wing: props.wing, name: props.name });
    }

    render() {
        return (
            <FlexView className="chat" column hAlignContent="center" vAlignContent="center">
                { !!this.state.loading && (<Loading wing={this.props.location.state.wing} />) }
                {
                    !this.state.loading &&  (
                        <ChatWindow user={this.props.location.state.name} partner={this.state.partnerName} />
                    )
                }
            </FlexView>
        )
    }
}