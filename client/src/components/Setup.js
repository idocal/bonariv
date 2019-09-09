import React, { Component } from 'react';
import { Input, Button } from 'semantic-ui-react'
import FlexView from "react-flexview";
import { nicknames, avatars } from "../config";

const randomNames = wing => {
    if (wing === 'right') {
        return nicknames.right;
    } else {
        return nicknames.left;
    }
};
const yourNameTag = "השם שלך: ";

function Welcome() {
    return (
        <FlexView hAlignContent="center" className="welcome" column>
            <h1>ברוכים הבאים ל״בוא נריב״</h1>
            <p>בוחרים ימין או שמאל, מוסיפים שם ותמונה ומתחילים לדבר עם הצד השני!</p>
            <p className="disclaimer">מוזמנים להתווכח, לטעון, אבל הכי חשוב, לזכור שבצד השני נמצא בן אדם בדיוק כמוכם שבסך הכל חושב קצת אחרת :)</p>
        </FlexView>
    )
}

export default class Setup extends Component {

    state = {
        name: "",
        inputValue: "",
        stage: "intro",
        wing: "",
        avatar: ""
    };

    constructor(props) {
        super(props);
        this.handleRandomNameButton = this.handleRandomNameButton.bind(this);
        this.handleNameButton = this.handleNameButton.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleWingChoose = this.handleWingChoose.bind(this);
        this.handleAvatarClick = this.handleAvatarClick.bind(this);
        this.handleAvatarChoose = this.handleAvatarChoose.bind(this);
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
        await this.setState({
            name: this.state.name,
            stage: "avatar"
        });
    }

    async handleWingChoose(wing) {
        await this.setState({
            wing: wing,
            stage: "name"
        });
    }

    async handleAvatarChoose(avatar) {
        this.props.history.push('/chat', {
            name: this.state.name,
            wing: this.state.wing,
            userId: this.props.userId,
            avatar: this.state.avatar
        });
    }

    handleAvatarClick(avatar) {
        this.setState({ avatar });
    }

    render() {

        let chooseWing =
            <FlexView hAlignContent="center" column>
                <Welcome />
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

        let chooseAvatar =
            <FlexView column>
                <FlexView hAlignContent="center">
                    <h1>בחר/י תמונה:</h1>
                </FlexView>
                <div className="avatars">
                    {
                        avatars.map((avatar, i) => {
                            return (
                                <div className="avatar" key={i} onClick={() => {this.handleAvatarClick(avatar)}}>
                                    <img
                                        src={"/avatars/" + avatar + ".png"}
                                        className={this.state.avatar === avatar ? 'selected': ''}
                                        alt={avatar} />
                                </div>
                            )
                        })
                    }
                </div>
                <FlexView hAlignContent="center">
                    <Button color="red" onClick={this.handleAvatarChoose} disabled={!this.state.avatar.length}>יאללה!</Button>
                </FlexView>
            </FlexView>;

        return (
            <FlexView column>
                { this.state.stage === 'intro' && chooseWing }
                { this.state.stage === 'name' && this.state.name && nameTag }
                { this.state.stage === 'name' && nameInput }
                { this.state.stage === 'avatar' && chooseAvatar }
            </FlexView>
        )
    }
}