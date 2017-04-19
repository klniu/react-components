import * as React from 'react';
import {BrowserRouter as Router, Route, Link} from 'react-router-dom';
import './App.css';
import User from './components/user';
import IForm from './components/form';
import {formGroupProps} from './data';
import IFormModal from './components/formModal';

class App extends React.Component<{}, {}> {
    render() {
        return (
            <div className="App">
                <Router>
                    <div>
                        <ul>
                            <li><Link to="/user/Login">Login</Link></li>
                            <li><Link to="/user/ChangePass">Change Password</Link></li>
                            <li><Link to="/Form">Form</Link></li>
                            <li><Link to="/FormModal">FormModal</Link></li>
                        </ul>
                        <hr/>

                        <Route path="/user/Login" component={UserLogin}/>
                        <Route path="/user/ChangePass" component={UserChangePass}/>
                        <Route path="/Form" component={IFormTest}/>
                        <Route path="/FormModal" component={IFormModalTest}/>
                    </div>
                </Router>
            </div>
        );
    }
}

class UserLogin extends React.Component<any, any> {
    render() {
        return ( <User operate="login" url="/user/login"/> );
    }
}
class UserChangePass extends React.Component<any, any> {
    render() {
        return (<User operate="changePass" url="/user/changePass"/>);
    }
}

class IFormTest extends React.Component<any, any> {
    render() {
        return ( <IForm url="/form/submit" formOptions={formGroupProps}/> );
    }
}

class IFormModalTest extends React.Component<any, any> {
    render() {
        return ( <IFormModal show={true} title="Form Modal Test" url="/form/submit" formOptions={formGroupProps}/>);
    }
}


export default App;
