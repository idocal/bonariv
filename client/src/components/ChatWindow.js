import React, { Component } from 'react';
import FlexView from "react-flexview/";
import '../style/ChatWindow.css';
import { Input, Button } from 'semantic-ui-react'
import moment from 'moment';

function Message(props) {
    return (
        <FlexView className="message" column>
            <FlexView className="sender" vAlignContent="center">
                <FlexView className="user" vAlignContent="center">
                    { props.user }
                </FlexView>
                <FlexView className="time" vAlignContent="center">
                    { props.time.format("HH:MM") }
                </FlexView>
            </FlexView>
            <FlexView className="content">{ props.content }</FlexView>
        </FlexView>
    )
}

export default class ChatWindow extends Component {

    constructor(props) {
        super(props);
        this.handleType = this.handleType.bind(this);
        this.handleSend = this.handleSend.bind(this);
    }

    state = {
        messages: [],
        currentMessage: ""
    };

    async handleType(e) {
        await this.setState({currentMessage: e.target.value})
    }

    async handleSend() {
        await this.setState(prevState => {
            let messages = prevState.messages;
            let message = {
                content: prevState.currentMessage,
                time: moment(),
                local: true
            };
            messages.push(message);
            return {
                messages,
                currentMessage: ""
            }
        })
    }

    render() {
        return (
            <FlexView className="chat-window" column>
                <FlexView className="messages" column>
                    {
                        this.state.messages.map((message, i) => {
                            let userName = message.local ? "חיים" : "משה";
                            return (
                                <Message content={message.content} user={userName} time={message.time} key={i} />
                            )
                        })
                    }
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
                        <Button color="red" onClick={this.handleSend}>שלח</Button>
                    </FlexView>
                </FlexView>
            </FlexView>
        )
    }
}
