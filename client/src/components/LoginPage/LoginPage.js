import React from 'react';
import { Row, Col } from 'reactstrap';

import LoginForm from '../LoginForm/LoginForm'
import illustration from '../../assets/imgs/illustration.png'

export default class LoginPage extends React.Component {

  render() {
    return (
      <Row className="h-100 w-100">
        <Col sm="6">
          <div class="illustration"></div>
        </Col>
        <Col className="d-flex align-items-center" sm="6">
          <LoginForm handleLoginSubmit={this.props.handleLoginSubmit}/>
        </Col>
      </Row>
    )
  }
}
