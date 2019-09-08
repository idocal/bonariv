import { Widget } from 'react-chat-widget';
import 'react-chat-widget/lib/styles.css';
import React, { Component } from 'react';
import FlexView from "react-flexview/";
import '../style/Chat.css';
import Loading from './Loading';
import socketIOClient from "socket.io-client";

const socket = socketIOClient("/");

export default class Chat extends Component {
    state = {
        loading: true,
        convId: "",
        partnerId: "",
        partnerName: "",
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
        let wings = ['left', 'right'];
        let wing = wings[Math.floor(Math.random() * wings.length)];
        socket.emit('req_partner', { userId: 'user-30', wing: wing, name: 'Itzik' });
    }

    render() {
        return (
            <FlexView className="chat" column>
                {/*{ !!this.state.loading && (<Loading wing={this.props.wing} />) }*/}
                {/*{ !this.state.loading && (<Widget />)}*/}
                { console.log(this.props.location.state) }
            </FlexView>
        )
    }
}