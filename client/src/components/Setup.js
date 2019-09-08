import React, { Component } from 'react';
import { Input, Button } from 'semantic-ui-react'
import FlexView from "react-flexview";
import { nicknames } from "../config";

const randomNames = wing => {
    if (wing === 'right') {
        return nicknames.right;
    } else {
        return nicknames.left;
    }
};
const yourNameTag = "השם שלך: ";

export default class Setup extends Component {

    state = {
        name: "",
        inputValue: "",
        isInitial: true,
        wing: ""
    };

    constructor(props) {
        super(props);
        this.handleRandomNameButton = this.handleRandomNameButton.bind(this);
        this.handleNameButton = this.handleNameButton.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleWingChoose = this.handleWingChoose.bind(this);
    }

    async handleRandomNameButton() {
        let names = randomNames(this.state.wing);
        let rand = names[Math.floor(Math.random() * names.length)];
        await this.setState({
            name: rand,
            inputValue: ""
        })
    }

    async handleChange(e) {
        await this.setState({
            name: e.target.value,
            inputValue: e.target.value
        });
    }

    async handleNameButton() {
        this.props.history.push('/chat', {
            name: this.state.name,
            wing: this.state.wing,
            userId: this.props.userId
        });
    }

    async handleWingChoose(wing) {
        await this.setState({
            wing: wing,
            isInitial: false
        });
    }

    render() {

        let chooseWing =
            <FlexView hAlignContent="center" column>
                <FlexView hAlignContent="center">
                    <Button color="red" onClick={ () => {this.handleWingChoose('right')}}>ימין</Button>
                    <Button color="blue" onClick={ () => {this.handleWingChoose('left')}}>שמאל</Button>
                </FlexView>
            </FlexView>;

        let nameTag =
            <FlexView className="your-name-tag" column hAlignContent="center">
                <h2>{yourNameTag}</h2>
                <h1>{this.state.name}</h1>
            </FlexView>;

        let nameInput =
            <FlexView column>
                <FlexView hAlignContent="center">
                    <Input placeholder='בחר/י שם...' onChange={this.handleChange} value={this.state.inputValue}/>
                    <Button color="blue" onClick={this.handleRandomNameButton}>רנדום</Button>
                </FlexView>

                <FlexView hAlignContent="center" style={{marginTop: "15px"}}>
                    <Button color="red"
                            onClick={this.handleNameButton}
                            disabled={!this.state.name.length}
                    >
                        בחרתי
                    </Button>
                </FlexView>
            </FlexView>;

        return (
            <FlexView column>
                { !!this.state.isInitial && chooseWing }
                { !this.state.isInitial && this.state.name && nameTag }
                { !this.state.isInitial && nameInput }
            </FlexView>

        )
    }
}