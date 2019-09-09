import React, { Component } from 'react';
import FlexView from "react-flexview/";
import '../style/ChatWindow.css';
import { Input, Button } from 'semantic-ui-react'
import moment from 'moment';
import Countdown from 'react-countdown-now';

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
                        <span style={{wordBreak: "break-all", wordWrap: "break-word"}}>
                            { props.content }
                        </span>
                    </FlexView>
                </FlexView>

            </FlexView>

        </div>
    )
}

class Intro extends Component {

    componentDidMount() {
        setTimeout(() => this.setState({isInitial: false}), 2000);
    }

    state = {
        isInitial: true
    };

    render() {
        return (
            <FlexView column height="100%" width="100%" vAlignContent="center" hAlignContent="center">
                {
                    !!this.state.isInitial ? (
                        <FlexView column className="intro" vAlignContent="center" hAlignContent="center">
                            <FlexView className="intro-pic">
                                {
                                    this.props.userAvatar !== undefined ?
                                        (<img src={"/avatars/" + this.props.userAvatar + ".png"} alt={this.props.userName} />) :
                                        (<img src={"/avatars/default.png"} alt={this.props.userName} />)
                                }
                            </FlexView>
                            <FlexView>
                                <h1>{ this.props.userName }</h1>
                            </FlexView>

                            <FlexView className="vs" >
                                <h2>VS</h2>
                            </FlexView>

                            <FlexView className="intro-pic">
                                {
                                    this.props.partnerAvatar !== undefined ?
                                        (<img src={"/avatars/" + this.props.partnerAvatar + ".png"} alt={this.props.partnerName} />) :
                                        (<img src={"/avatars/default.png"} alt={this.props.partnerName} />)
                                }
                            </FlexView>
                            <FlexView>
                                <h1>{ this.props.partnerName }</h1>
                            </FlexView>
                        </FlexView>
                    ) : (
                        <FlexView className="intro-counter">
                            <Countdown date={Date.now() + 3000} renderer={
                                ({ hours, minutes, seconds, completed }) => {
                                    return (
                                        <span>{seconds}</span>
                                    )
                                }
                            } />
                        </FlexView>
                    )
                }
            </FlexView>
        )
    }

}

export default class ChatWindow extends Component {

    constructor(props) {
        super(props);
        this.handleType = this.handleType.bind(this);
        this.handleSend = this.handleSend.bind(this);
        this.handleIncoming = this.handleIncoming.bind(this);
        this.keyPress = this.keyPress.bind(this);
    }

    state = {
        messages: [],
        currentMessage: "",
        isInitial: true
    };

    componentDidMount() {
        let socket = this.props.socket;
        socket.on('newMessage', async message => {
            await this.handleIncoming(message);
        });
        setTimeout(() => this.setState({isInitial: false, startTime: Date.now()}), 5000);
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
        if (this.messagesEnd) {
            this.messagesEnd.scrollIntoView({ behavior: "smooth" });
        }
    }

    async keyPress(e) {
        if (!!this.state.currentMessage.length && !this.state.isInitial) {
            if (e.keyCode === 13) {
                console.log('Enter');
                await this.handleSend();
            }
        }
    }

    render() {
        return (
            <FlexView column width="100%" vAlignContent="center" hAlignContent="center">
                {
                    !this.state.isInitial && (
                        <FlexView className="chat-counter">
                            <Countdown date={this.state.startTime + 5 *60*1000} renderer={
                                ({ hours, minutes, seconds, completed }) => {
                                    if (completed) {
                                        this.props.socket.emit('chatTimeout');
                                    }
                                    if (parseInt(seconds) < 10) {
                                        seconds = "0" + seconds
                                    }
                                    return (
                                        <span>{minutes + ":" + seconds}</span>
                                    )
                                }
                            } />
                        </FlexView>
                    )
                }

                <FlexView className="chat-window" column>
                    <FlexView className="messages" column>
                        {
                            this.state.isInitial ?
                                <Intro partnerName={this.props.partnerName}
                                       partnerAvatar={this.props.partnerAvatar}
                                       userName={this.props.user}
                                       userAvatar={this.props.userAvatar}
                                /> :
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
                                   onKeyDown={this.keyPress}
                            />
                        </FlexView>
                        <FlexView>
                            <Button color="red" onClick={this.handleSend} disabled={!this.state.currentMessage.length || this.state.isInitial}>שלח</Button>
                        </FlexView>
                    </FlexView>
                </FlexView>
            </FlexView>

        )
    }
}
