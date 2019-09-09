import React, { Component } from 'react';
import FlexView from "react-flexview/";
import '../style/ChatWindow.css';
import { Input, Button } from 'semantic-ui-react'
import moment from 'moment';

function Message(props) {
    return (
        <div className="message">
            <FlexView>
                <div className="pic">
                    {
                        props.avatar !== undefined ?
                            (<img src={"/avatars/" + props.avatar + ".png"} alt={props.avatar} />) :
                            (<img src={"/avatars/default.png"} alt={props.user} />)
                    }
                </div>

                <FlexView column>
                    <FlexView className="sender" vAlignContent="center">

                        <FlexView className="user" vAlignContent="center">
                            { props.user }
                        </FlexView>

                        <FlexView className="time" vAlignContent="center">
                            { props.time.format("HH:mm") }
                        </FlexView>
                    </FlexView>
                    <FlexView className="content">
                        <span style={{wordBreak: "break-all"}}>
                            { props.content }
                        </span>
                    </FlexView>
                </FlexView>

            </FlexView>

        </div>
    )
}

export default class ChatWindow extends Component {

    constructor(props) {
        super(props);
        this.handleType = this.handleType.bind(this);
        this.handleSend = this.handleSend.bind(this);
        this.handleIncoming = this.handleIncoming.bind(this);
        this.messagesRef = React.createRef();
    }

    state = {
        messages: [],
        currentMessage: ""
    };

    componentDidMount() {
        let socket = this.props.socket;
        socket.on('newMessage', async message => {
            await this.handleIncoming(message);
        });
    }

    async handleType(e) {
        await this.setState({currentMessage: e.target.value})
    }

    async handleSend() {
        let time = moment();
        let content = this.state.currentMessage;
        let to = this.props.partnerId;
        await this.setState(prevState => {
            let messages = prevState.messages;
            content = prevState.currentMessage;
            let message = {
                content,
                time,
                local: true
            };
            messages.push(message);
            return {
                messages,
                currentMessage: ""
            }

        });
        this.scrollToBottom();
        this.props.socket.emit('newMessage', {content, time: time.format(), to})
    }

    async handleIncoming(incMsg) {
        await this.setState(prevState => {
            let messages = prevState.messages;
            let message = {
                content: incMsg.content,
                time: moment(incMsg.time),
                local: false
            };
            messages.push(message);
            return {messages}
        });
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.messagesEnd.scrollIntoView({ behavior: "smooth" });
    }

    render() {
        return (
            <FlexView className="chat-window" column>
                <FlexView className="messages" column>
                    {
                        this.state.messages.map((message, i) => {
                            let userName = message.local ? this.props.user : this.props.partnerName;
                            let avatar = message.local ? this.props.userAvatar : this.props.partnerAvatar;
                            return (
                                <Message content={message.content}
                                         user={userName}
                                         time={message.time}
                                         avatar={avatar}
                                         key={i}
                                />
                            )
                        })
                    }
                    <div style={{ float:"left", clear: "both" }}
                         ref={(el) => { this.messagesEnd = el; }}>
                    </div>
                </FlexView>
                <FlexView className="type-message">
                    <FlexView grow>
                        <Input className="message-input"
                               placeholder="הקלד/י הודעה..."
                               value={this.state.currentMessage}
                               onChange={this.handleType}
                        />
                    </FlexView>
                    <FlexView>
                        <Button color="red" onClick={this.handleSend} disabled={!this.state.currentMessage.length}>שלח</Button>
                    </FlexView>
                </FlexView>
            </FlexView>
        )
    }
}
