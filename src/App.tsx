import * as React from 'react';
import {BrowserRouter as Router, Route, Link} from 'react-router-dom';
import './App.css';
import User from './components/user';

class App extends React.Component<{}, {}> {
    render() {
        return (
            <div className="App">
                <Router>
                    <div>
                        <ul>
                            <li><Link to="/user/Login">Login</Link></li>
                            <li><Link to="/user/ChangePass">Change Password</Link></li>
                        </ul>
                        <hr/>

                        <Route path="/user/Login" component={() => <User operate="login" url="/user/login"/>}/>
                        <Route
                            path="/user/ChangePass"
                            component={() => <User operate="changePass" url="/user/changePass"/>}
                        />
                    </div>
                </Router>
            </div>
        );
    }
}

export default App;
