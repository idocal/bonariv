import React from 'react';
import FlexView from "react-flexview";

export default function Loading(props) {
    return (
        <FlexView className="loading" column hAlignContent="center">
            <div className="lds-ripple">
                <div />
                <div />
            </div>
            {
                props.wing === "right" ?
                    <h2>מחפש שמאלני/ת לריב איתו/ה...</h2> :
                    <h2>מחפש ימני/ת לריב איתו/ה...</h2>
            }
        </FlexView>
    )
}