import React, { Component } from 'react';
import './App.css';
import FlexView from "react-flexview";
import AppRouter from "./AppRouter";

export default class App extends Component {

    state = {
        userId: ""
    };

    async componentDidMount() {
        const response = await fetch('/ping');
        const body = await response.json();

        await this.setState({userId: body.userId});

        if (response.status !== 200) {
            throw Error(body.message)
        }
        return body;
    }

    render() {
        return (
            <FlexView className="app" hAlignContent="center" vAlignContent="center" column>
                <AppRouter userId={this.state.userId} />
            </FlexView>
        );
    }
}