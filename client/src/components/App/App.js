import React from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';

import LoginPage from '../LoginPage/LoginPage'
import RegisterPage from '../RegisterPage/RegisterPage'
import Dashboard from '../Dashboard/Dashboard'
import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      userCreated: false,
      readyForLogin: false,
      apiResponse: [],
      userLoggedOut: false,
    }
    this.handleRegisterSubmit = this.handleRegisterSubmit.bind(this);
    this.handleLoginSubmit = this.handleLoginSubmit.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  };

  componentDidMount(){
  }

  handleRegisterSubmit(e) {
    this.setState({
      userCreated: true
    })
  }

  handleLoginSubmit(e) {
    this.setState({
      userLoggedOut: false,
      readyForLogin: true
    })
  }

  handleLogout(e) {
    this.setState({
      userLoggedOut: true
    })
  }

  render() {
    return (
      <BrowserRouter forceRefresh={true}>
        <Switch>

        <Route exact path='/'>
          <Redirect to='/login' />
        </Route>

        <Route exact path='/login'
        render={(props) => (
          <LoginPage {...props} handleLoginSubmit={this.handleLoginSubmit} />
        )}>
          {this.state.readyForLogin ? <Redirect to='/dashboard' /> : ""}
        </Route>

        <Route exact path='/register'
        render={(props) => (
          <RegisterPage {...props} handleRegisterSubmit={this.handleRegisterSubmit} />
        )}>
          {this.state.userCreated ? <Redirect to='/login' /> : ""}
        </Route>

        <Route exact path='/dashboard' render={(props) => (
          <Dashboard {...props} handleLogout={this.handleLogout} />
        )}>
          {this.state.userLoggedOut ? <Redirect to='/login' /> : ""}
        </Route>
        </Switch>
      </BrowserRouter>
    )
  }
}

export default App;
