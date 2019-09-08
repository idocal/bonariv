import React from 'react';
import Setup from './components/Setup';
import Chat from './components/Chat';
import { BrowserRouter as Router, Route } from "react-router-dom";


function AppRouter(routerProps) {
    return (
        <Router>
            <Route path="/" exact render={(props) => <Setup {...props} userId={routerProps.userId} />} />
            <Route path="/chat" exact component={Chat} />
        </Router>
    )
}

export default AppRouter